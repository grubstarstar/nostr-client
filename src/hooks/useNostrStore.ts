import {
  Kind,
  generatePrivateKey,
  getPublicKey,
  validateEvent,
} from "nostr-tools";
import { uniq } from "lodash";
import { create } from "zustand";
import { TextNoteEvent, UserDetails } from "../types";
import { extractRelayMessage, extractUserFromMetadata } from "../utils";

export interface NostrStore {
  me?: {
    pubkey: string;
    privkey: string;
  };
  relays: string[];
  users: Record<string, UserDetails>;
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
    // "wss://relay.beta.fogtype.com",
    // "wss://nostr.yuv.al",
    // "wss://nostr-relay.nokotaro.com",
    // "wss://nostr.mikedilger.com",
    // "wss://nostr.terminus.money",
    // "wss://freespeech.casa",
    // "wss://xmr.usenostr.org",
    "wss://relayable.org",
    // "wss://relay.damus.io",
    // "wss://nostr.kollider.xyz",
    // "wss://relay.snort.social",
    // "wss://nostr.zebedee.cloud",
    // "wss://student.chadpolytechnic.com",
    // "wss://nostr.fmt.wiz.biz",
    // "wss://nostr-pub.wellorder.net",
    // "wss://nostr.onsats.org", // fail to connect
    // "wss://nostr.semisol.dev", // fail to connect
  ],
  following: [
    // "npub1l5rlwjn9gnxvu5x8g0xv90jufq60l0y50srfzkty8ywx84xxe8wsymzaae", // Me. (npub)
    "fd07f74a6544ccce50c743ccc2be5c4834ffbc947c06915964391c63d4c6c9dd", // Me.
    // "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m", // Jack Dorsey (npub)
    "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2", // Jack Dorsey
    "eab0e756d32b80bcd464f3d844b8040303075a13eabc3599a762c9ac7ab91f4f", // Lyn Alden
    // "npub1s5yq6wadwrxde4lhfs56gn64hwzuhnfa6r9mj476r5s4hkunzgzqrs6q7z", // Preston Pysh (npub)
    "85080d3bad70ccdcd7f74c29a44f55bb85cbcd3dd0cbb957da1d215bdb931204", // Preston Pysh
    "090254801a7e8e5085b02e711622f0dfa1a85503493af246aa42af08f5e4d2df", // Dylan Eclair
    "c4eabae1be3cf657bc1855ee05e69de9f059cb7a059227168b80b89761cbc4e0", // Jack Mallers
  ],
  users: {},
  textNotes: {},
  calendarEvents: {},
  // Actions.
  onMessage(message: MessageEvent<string>) {
    const parsedMessage = extractRelayMessage(message.data);
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
          const setMetadata = extractUserFromMetadata(event);
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
      relays: uniq([...state.relays, url]),
    }));
  },
  removeRelay(url: string) {
    set((state) => ({
      relays: state.relays.filter((relay) => relay !== url),
    }));
  },
  follow(pubkey: string) {
    set((state) => ({
      following: uniq([...state.following, pubkey]),
    }));
  },
  unfollow(pubkey: string) {
    set((state) => ({
      following: state.following.filter(
        (followingPubkey) => followingPubkey !== pubkey
      ),
    }));
  },
}));
