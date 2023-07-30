import { Event, Kind } from "nostr-tools";

export type SetMetadataEvent = Event<Kind.Metadata>;
export type TextNoteEvent = Event<Kind.Text>;
export type RecommendRelayEvent = Event<Kind.RecommendRelay>;

type SubscriptionId = string;
type Messsage = string;

export type ClientToRelayEventMessage<TEvent extends Event> = ["EVENT", TEvent];
export type ClientToRelaySubscribeMessage = ["REQ", SubscriptionId, Filters];
export type ClientToRelayUnsubscribeMessage = ["CLOSE", SubscriptionId];

export type ClientToRelayMessage =
  | ClientToRelayEventMessage<
      SetMetadataEvent | TextNoteEvent | RecommendRelayEvent
    >
  | ClientToRelaySubscribeMessage
  | ClientToRelayUnsubscribeMessage;

export type RelayToClientMessage =
  | [
      "EVENT",
      SubscriptionId,
      SetMetadataEvent | TextNoteEvent | RecommendRelayEvent
    ]
  | ["EOSE", SubscriptionId]
  | ["NOTICE", Messsage];

export interface UserDetails {
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
