type SubscriptionId = string;

type Event<TKind extends KindValues> = [
  "EVENT",
  SubscriptionId,
  {
    content: string;
    created_at: number;
    id: string;
    kind: TKind;
    pubkey: string;
    sig: string;
    tags: string[];
  }
];

type SetMetadataEvent = Event<0>;
type TextNoteEvent = Event<1>;
type RecommendServerEvent = Event<2>;

export const isSetMetadataEvent = (
  serverMessage: ServerMessage
): serverMessage is SetMetadataEvent =>
  serverMessage[2]?.kind === kinds.set_metadata;

export const isTextNoteEvent = (
  serverMessage: ServerMessage
): serverMessage is TextNoteEvent => {
  return serverMessage[2]?.kind === kinds.text_note;
};

export const isRecommendServerEvent = (
  serverMessage: ServerMessage
): serverMessage is RecommendServerEvent =>
  serverMessage[2]?.kind === kinds.recommend_server;

type EOSE = ["EOSE", SubscriptionId];

type Notice = ["NOTICE", string];

export type ServerMessage =
  | SetMetadataEvent
  | TextNoteEvent
  | RecommendServerEvent
  | EOSE
  | Notice;

export interface User {
  updatedAt: number;
  // from set meta data properties...
  website?: string;
  lud06?: string;
  nip05?: string;
  picture?: string;
  display_name?: string;
  about?: string;
  name?: string;
  banner?: string;
  lud16?: string;
  username?: string;
  displayName?: string;
  nip05valid?: boolean;
  damus_donation_v2?: number;
  reactions?: string;
  damus_donation?: number;
  pubkey?: string;
  loaded?: number;
  created?: number;
  bio?: string;
  nip05_updated_at?: number;
  zapService?: string;
}

// type EOSE = ["EOSE", string];

export const kinds = {
  set_metadata: 0,
  text_note: 1,
  recommend_server: 2,
} as const;
type Kinds = typeof kinds;
type KindValues = Kinds[keyof Kinds];
