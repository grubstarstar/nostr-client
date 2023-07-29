import { format } from "date-fns";
import { pickBy } from "lodash";
import { useNostrClientContext } from "../contexts/nostrClientContext";

export function TextNotes() {
  const { textNotes } = useNostrClientContext();

  const rootTextNotes = pickBy(
    textNotes,
    (textNote) => !textNote.tags.some((tag) => tag[0] === "e")
  );

  const sortedRootTextNotes = Object.values(rootTextNotes).sort(
    (a, b) => b.created_at - a.created_at
  );

  return (
    <ol className="events">
      {sortedRootTextNotes.map((textNote) => (
        <li key={textNote.id}>
          <div className="event">
            <div className="event-time">
              {format(
                new Date(textNote.created_at * 1000),
                "h:mm aaa do MMM yyyy"
              )}
            </div>
            <div className="event-content">{textNote.id}</div>
            <div className="event-content">{textNote.content}</div>
            <div className="event-tags">
              {textNote.tags.map((tag, idx) => (
                <div key={`${tag.join("-")}-${idx}}`}>
                  <div>{JSON.stringify(tag)}</div>
                </div>
              ))}
            </div>
            <Replies parentEventId={textNote.id} />
          </div>
        </li>
      ))}
    </ol>
  );
}

interface RepliesProps {
  parentEventId: string;
  parentMarker?: "root" | "reply" | "mention";
}

const Replies = ({ parentEventId, parentMarker = "root" }: RepliesProps) => {
  const { textNotes } = useNostrClientContext();

  const replies = pickBy(textNotes, (textNote) => {
    const eTags = textNote.tags.filter((tag) => tag[0] === "e");

    // See https://github.com/nostr-protocol/nips/blob/master/10.md#marked-e-tags-preferred
    // ["e", <event-id>, <relay-url>, <marker>]
    const isUsingMarkedETags = eTags.some((eTag) => eTag.length === 4);

    if (isUsingMarkedETags) {
      // See "Marked "e" tags (PREFERRED)"
      // https://github.com/nostr-protocol/nips/blob/master/10.md#marked-e-tags-preferred
      const eTagFormarker = eTags.find((eTag) => eTag[3] === parentMarker);

      return (
        eTagFormarker?.[1] === parentEventId &&
        !(parentMarker === "root" && eTags.length === 1)
      );
    } else {
      // See "Positional "e" tags (DEPRECATED)"
      // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
      const rootETags = eTags.slice(0, 1);
      const mentionETags = eTags.slice(1, -1);
      const replyETags = eTags.slice(-1);
      switch (parentMarker) {
        case "root": {
          return (
            eTags.length === 1 &&
            rootETags?.some((etag) => etag[1] === parentEventId)
          );
        }
        case "reply": {
          return (
            eTags.length > 1 &&
            replyETags?.some((etag) => etag[1] === parentEventId)
          );
        }
        case "mention": {
          return mentionETags?.some((etag) => etag[1] === parentEventId);
        }
      }
    }
  });
  const sortedReplies = Object.values(replies).sort(
    (a, b) => b.created_at - a.created_at
  );

  return (
    <div className="replies">
      {sortedReplies.map((reply) => (
        <div key={reply.id}>
          <div>{reply.content}</div>
          <div className="sub-reply">
            <Replies parentEventId={reply.id} parentMarker="reply" />
          </div>
        </div>
      ))}
    </div>
  );
};
