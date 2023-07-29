import {
  EventTemplate,
  Kind,
  UnsignedEvent,
  finishEvent,
  getPublicKey,
} from "nostr-tools";
import { difference, pick } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { NostrStore, useNostrStore } from "./useNostrStore";

export type NostrClient = Omit<NostrStore, "onMessage"> & {
  sendEvent: <K extends Kind>(
    eventTemplate: EventTemplate<K>,
    relayUrls?: string[]
  ) => void;
};

export function useNostrClient(): NostrClient {
  const {
    me,
    relays,
    following,
    users,
    textNotes,
    calendarEvents,
    addRelay,
    removeRelay,
    follow,
    unfollow,
    onMessage,
  } = useNostrStore();

  const websockets = useRef<Record<string, WebSocket>>({});

  const sendEvent = useCallback(
    <K extends Kind>(eventTemplate: EventTemplate<K>, relayUrls?: string[]) => {
      if (me) {
        const sockets = Object.values(
          pick(websockets.current, relayUrls ?? relays)
        );
        sockets.forEach((socket) => {
          const unsignedEvent: UnsignedEvent<K> = {
            ...eventTemplate,
            pubkey: getPublicKey(me.privkey),
          };
          const event = finishEvent(unsignedEvent, me.privkey);
          const payload = JSON.stringify(["EVENT", event]);
          socket.send(payload);
        });
      }
    },
    [me?.privkey]
  );

  const subscribeToFollowingMetadata = useCallback(
    (relay: string) => {
      const payload = JSON.stringify([
        "REQ",
        "following-metadata",
        {
          kinds: [Kind.Metadata],
          authors: following,
        },
      ]);
      websockets.current[relay].send(payload);
    },
    [following]
  );

  const subscribeToFollowingTextNotes = useCallback(
    (relay: string) => {
      const since = Math.floor(Date.now() / 1000 - 86400); // Last 24 hours.
      const payload = JSON.stringify([
        "REQ",
        "following-text-notes",
        {
          kinds: [Kind.Text],
          since,
          limit: 100,
          authors: following,
        },
      ]);
      websockets.current[relay].send(payload);
    },
    [following]
  );

  const subscribeToEventReplies = useCallback(
    (relay: string) => {
      const since = Math.floor(Date.now() / 1000 - 86400); // Last 24 hours.
      const ids = Object.values(textNotes).flatMap((textNote) =>
        textNote.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
      );
      const payload = JSON.stringify([
        "REQ",
        "event-replies",
        {
          since,
          until: Date.now() / 1000,
          ids,
        },
      ]);
      websockets.current[relay].send(payload);
    },
    [textNotes]
  );

  // Sync the relays to the websockets.
  useEffect(() => {
    const relaysWithWebSockets = Object.keys(websockets.current);
    const relaysToClose = difference(relaysWithWebSockets, relays);
    const relaysToOpen = difference(relays, relaysWithWebSockets);

    relaysToClose.forEach((relay) => {
      websockets.current[relay].close();
      delete websockets.current[relay];
    });

    relaysToOpen.forEach((relay) => {
      const ws = new WebSocket(relay);
      ws.onmessage = onMessage;
      ws.onopen = () => {
        console.info("opened", relay);
        // Only assign to our websockets ref once it's been opened and ready to go.
        websockets.current[relay] = ws;
        subscribeToFollowingMetadata(relay);
        subscribeToFollowingTextNotes(relay);
        subscribeToEventReplies(relay);
      };
      ws.onclose = () => {
        console.info("onclose", relay);
      };
      ws.onerror = (ev) => {
        console.info("onerror", relay, ev);
      };
    });
  }, [relays]);

  // Sync the users being followed to the relay subscriptions for their metadata events.
  useEffect(() => {
    Object.keys(websockets.current).forEach(subscribeToFollowingMetadata);
  }, [following]);

  // Sync the users being followed to the relay subscriptions for their text note events.
  useEffect(() => {
    Object.keys(websockets.current).forEach(subscribeToFollowingTextNotes);
  }, [following]);

  // Sync the textNotes to the the relay subscriptions for their reply events.
  useEffect(() => {
    Object.keys(websockets.current).forEach(subscribeToEventReplies);
  }, [textNotes]);

  return {
    me,
    relays,
    following,
    users,
    textNotes,
    calendarEvents,
    // Actions.
    addRelay,
    removeRelay,
    follow,
    unfollow,
    sendEvent,
  };
}
