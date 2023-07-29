import {
  EventTemplate,
  Kind,
  UnsignedEvent,
  finishEvent,
  getPublicKey,
} from "nostr-tools";
import { difference, differenceBy, filter, keyBy, pick } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import { NostrStore, useNostrStore } from "./useNostrStore";
import { getReplyAndMentionIdsFromTextNotes } from "../utils";
import { shallow } from "zustand/shallow";

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
  } = useNostrStore((state) => state, shallow);

  const replyAndMentionIds = useNostrStore(
    (state) => getReplyAndMentionIdsFromTextNotes(state.textNotes),
    shallow
  );

  const rootTextNotes = useNostrStore((state) => {
    const ids = getReplyAndMentionIdsFromTextNotes(state.textNotes);
    const mappedIds = keyBy(ids, (id) => id);
    return filter(textNotes, (textNote) => !mappedIds[textNote.id]);
  }, shallow);

  const replyAndMentionTextNotes = useNostrStore((state) => {
    const ids = getReplyAndMentionIdsFromTextNotes(state.textNotes);
    const mappedIds = keyBy(ids, (id) => id);
    return filter(textNotes, (textNote) => !!mappedIds[textNote.id]);
  }, shallow);

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
      console.log("subscribeToFollowingMetadata");
      websockets.current[relay].send(payload);
    },
    [following]
  );

  const subscribeToFollowingTextNotes = useCallback(
    (relay: string) => {
      const since = Math.floor(Date.now() / 1000 - 86400 * 7); // Last 7 days.
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
      console.log("subscribeToFollowingTextNotes");
      websockets.current[relay].send(payload);
    },
    [following]
  );

  const subscribeToEventReplies = useCallback(
    (relay: string) => {
      const since = Math.floor(Date.now() / 1000 - 86400 * 7); // Last 7 days.
      const payload = JSON.stringify([
        "REQ",
        "event-replies",
        {
          since,
          until: Date.now() / 1000,
          ids: replyAndMentionIds,
        },
      ]);
      console.log("subscribeToEventReplies");
      websockets.current[relay].send(payload);
    },
    [replyAndMentionIds]
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
      ws.onclose = (ev) => {
        console.info("onclose", relay, ev, ev.code);
        if (ev.code === 4000) {
          throw new Error("SHOULD NO USE!");
        }
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
  }, [replyAndMentionIds]);

  console.table({
    // me: useHasChanged(me),
    // relays: useHasChanged(relays),
    // following: useHasChanged(following),
    // users: useHasChanged(users),
    // textNotes: useHasChanged(textNotes),
    // rootTextNotes: useHasChanged(rootTextNotes),
    replyAndMentionTextNotes: useHasChanged(
      replyAndMentionTextNotes,
      (prev, current) => {
        // console.info("prev", JSON.stringify(prev));
        // console.info("current", JSON.stringify(current));
        console.info(
          "diff1",
          differenceBy(prev, current, (v) => v)
        );
        console.info(
          "diff2",
          differenceBy(current, prev, (v) => v)
        );
      }
    ),
    calendarEvents: useHasChanged(calendarEvents),
  });

  return {
    me,
    relays,
    following,
    users,
    textNotes,
    // rootTextNotes,
    // replyAndMentionTextNotes,
    calendarEvents,
    // Actions.
    addRelay,
    removeRelay,
    follow,
    unfollow,
    sendEvent,
  };
}

function useHasChanged<T>(value: T, logFn?: (prev: T, current: T) => void) {
  const prev = useRef(value);
  const hasChanged = prev.current !== value;
  prev.current = value;
  if (hasChanged) {
    logFn?.(prev.current, value);
    // console.info("Befor", prev.current);
    // console.info("After", value);
    // if (value instanceof Array && prev.current instanceof Array) {
    //   console.info("diff1", difference(value, prev.current));
    //   console.info("diff2", difference(prev.current, value));
    // } else {
    //   console.info("Befor", prev.current);
    //   console.info("After", value);
    // }
  }
  return hasChanged;
}
