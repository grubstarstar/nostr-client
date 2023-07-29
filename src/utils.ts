import { TextNoteEvent } from "./hooks/useNostrStore";

export function getReplyAndMentionIdsFromTextNotes(
  textNotes: Record<string, TextNoteEvent>
): string[] {
  return Object.values(textNotes).flatMap((textNote) =>
    textNote.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1])
  );
}
