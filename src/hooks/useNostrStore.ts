import {
  Kind,
  generatePrivateKey,
  getPublicKey,
  validateEvent,
  Event,
} from "nostr-tools";
import { uniq } from "lodash";
import { create } from "zustand";

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

export interface NostrStore {
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

export const useNostrStore = createNostrStore((set) => ({
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
    "wss://relayable.org",
    "wss://relay.damus.io",
    "wss://nostr.kollider.xyz",
    "wss://relay.snort.social",
    "wss://nostr.zebedee.cloud",
    "wss://student.chadpolytechnic.com",
    "wss://nostr.fmt.wiz.biz",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.onsats.org",
    "wss://nostr.semisol.dev",
  ],
  following: [
    "83e818dfbeccea56b0f551576b3fd39a7a50e1d8159343500368fa085ccd964b",
    "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m", // Jack Dorsey
    "7d7543186225119c7d5931f3de56a659ee22240a67572fab93edb607890fc149",
    "2cad5a4855a23027276a510a2d14d7ee4d19b915f3447a89cf2e8dfd0b4aeeec",
    "npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a", // Lyn Alden
    "npub1s5yq6wadwrxde4lhfs56gn64hwzuhnfa6r9mj476r5s4hkunzgzqrs6q7z", // Preston Pysh
    "npub1pyp9fqq60689ppds9ec3vghsm7s6s4grfya0y342g2hs3a0y6t0segc0qq", // Dylan Eclair
  ],
  users: {},
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
