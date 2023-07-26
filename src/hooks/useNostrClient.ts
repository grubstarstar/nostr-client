import {
  EventTemplate,
  Kind,
  UnsignedEvent,
  finishEvent,
  generatePrivateKey,
  getPublicKey,
  validateEvent,
  Event,
} from "nostr-tools";
import { difference, pick, uniq } from "lodash";
import { create } from "zustand";
import { useCallback, useEffect, useRef } from "react";

interface UserMetadata {
  pubkey: string;
  name: string;
  displayName: string;
  username: string;
  picture: string;
  website: string;
  updatedAt: number;
}

interface TextNoteEvent extends Event {}

interface NostrStore {
  me?: {
    pubkey: string;
    privkey: string;
  };
  relays: string[];
  users: Record<string, UserMetadata>;
  textNotes: Record<string, TextNoteEvent>;
  following: string[];
  calendarEvents: Record<string, any>;
  // Actions.
  onMessage: (message: MessageEvent<any>) => void;
  addRelay: (url: string) => void;
  removeRelay: (url: string) => void;
  follow: (pubkey: string) => void;
  unfollow: (pubkey: string) => void;
}

const privkey = generatePrivateKey();
const pubkey = getPublicKey(privkey);

const createNostrStore = create<NostrStore>();

const useNostrStore = createNostrStore((set) => ({
  me: {
    privkey,
    pubkey,
  },
  relays: [
    "wss://relay.beta.fogtype.com",
    "wss://nostr.yuv.al",
    "wss://nostr-relay.nokotaro.com",
    "wss://nostr.mikedilger.com",
    "wss://nostr.terminus.money",
    "wss://freespeech.casa",
    "wss://xmr.usenostr.org",
  ],
  following: [
    "83e818dfbeccea56b0f551576b3fd39a7a50e1d8159343500368fa085ccd964b",
    "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m",
    "7d7543186225119c7d5931f3de56a659ee22240a67572fab93edb607890fc149",
    "2cad5a4855a23027276a510a2d14d7ee4d19b915f3447a89cf2e8dfd0b4aeeec",
  ],
  users: {
    [pubkey]: {
      pubkey: pubkey,
      displayName: "Richardddd",
      name: "Richard",
      username: "richg",
      picture: "",
      about: "asdasdasd",
      website: "",
      updatedAt: 100,
    },
  },
  textNotes: {},
  calendarEvents: {},
  // Actions.
  onMessage(message: MessageEvent<any>) {
    const parsedMessage = JSON.parse(message.data);
    const event = parsedMessage[2];
    if (parsedMessage[0] === "EVENT" && event && validateEvent(event)) {
      switch (event.kind) {
        case Kind.Text: {
          return set((state) => ({
            ...state,
            textNotes: {
              ...state.textNotes,
              [event.id]: event,
            },
          }));
        }
        case Kind.Metadata: {
          const createdAt = event.created_at;
          const pubKey = event.pubkey;
          const setMetadata: UserMetadata = JSON.parse(event.content);
          set((state) => {
            const user = state.users[pubKey];
            if (!user || user.updatedAt <= createdAt) {
              return {
                ...state,
                users: {
                  ...state.users,
                  [pubKey]: {
                    ...setMetadata,
                    updatedAt: createdAt,
                  },
                },
              };
            } else {
              return state;
            }
          });
        }
      }
    }
  },
  addRelay(url: string) {
    set((state) => ({
      ...state,
      relays: uniq([...state.relays, url]),
    }));
  },
  removeRelay(url: string) {
    set((state) => ({
      ...state,
      relays: state.relays.filter((relay) => relay !== url),
    }));
  },
  follow(pubkey: string) {
    set((state) => ({
      ...state,
      following: uniq([...state.following, pubkey]),
    }));
  },
  unfollow(pubkey: string) {
    set((state) => ({
      ...state,
      following: state.following.filter(
        (followingPubkey) => followingPubkey !== pubkey
      ),
    }));
  },
}));

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

  useEffect(() => {
    function subscribeToFollowing(relay: string) {
      const since = Math.floor(Date.now() / 1000 - 86400); // Last 24 hours.
      const payload = JSON.stringify([
        "REQ",
        "following",
        {
          kinds: [0, 1],
          since,
          limit: 100,
          authors: following,
        },
      ]);
      websockets.current[relay].send(payload);
    }

    function subscribeToEventReplies(relay: string) {
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
    }

    const existingRelays = Object.keys(websockets.current);
    const relaysToClose = difference(existingRelays, relays);
    const relaysToOpen = difference(relays, existingRelays);

    console.log("existingRelays", existingRelays);
    console.log("relaysToClose", relaysToClose);
    console.log("relaysToOpen", relaysToOpen);

    relaysToClose.forEach((relay) => {
      websockets.current[relay].close();
      delete websockets.current[relay];
    });

    relaysToOpen.forEach((relay) => {
      const ws = new WebSocket(relay);
      ws.onmessage = onMessage;
      ws.onopen = () => {
        console.info("opened", relay);
        websockets.current[relay] = ws;
        subscribeToFollowing(relay);
        subscribeToEventReplies(relay);
      };
      ws.onclose = () => {
        console.info("onclose", relay);
      };
      ws.onerror = (ev) => {
        console.info("onerror", relay, ev);
      };
    });

    existingRelays.forEach((relay) => {
      subscribeToFollowing(relay);
      subscribeToEventReplies(relay);
    });
  }, [relays, following, textNotes]);

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
