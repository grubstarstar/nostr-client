import {
  RelayToClientMessage,
  SetMetadataEvent,
  TextNoteEvent,
  UserDetails,
} from "./types";

export function getReplyAndMentionIdsFromTextNotes(
  textNotes: Record<string, TextNoteEvent>
): string[] {
  return Object.values(textNotes).flatMap((textNote) =>
    textNote.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
  );
}

export const extractRelayMessage = (
  messageString: string
): RelayToClientMessage => JSON.parse(messageString) as RelayToClientMessage;

export const extractUserFromMetadata = (
  metadataEvent: SetMetadataEvent
): UserDetails => JSON.parse(metadataEvent.content) as UserDetails;

// export const isSetMetadataEvent = (
//   relayToClientMessage: RelayToClientMessage
// ): relayToClientMessage is SetMetadataEvent =>
//   relayToClientMessage[2]?.kind === Kind.Metadata;

// export const isTextNoteEvent = (
//   relayToClientMessage: RelayToClientMessage
// ): relayToClientMessage is TextNoteEvent => {
//   return relayToClientMessage[2]?.kind === Kind.Text;
// };

// export const isRecommendRelayEvent = (
//   relayToClientMessage: RelayToClientMessage
// ): relayToClientMessage is RecommendRelayEvent =>
//   relayToClientMessage[2]?.kind === Kind.RecommendRelay;
