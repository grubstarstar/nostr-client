import { useState } from "react";
import "./App.css";
import { format } from "date-fns";
import { useNostrClient } from "./client";
import { ServerMessage, isTextNoteEvent } from "./types";

export function TextNotes() {
  const [events, setEvents] = useState<ServerMessage[]>([]);

  useNostrClient({
    url: "wss://sg.qemura.xyz",
    onMessage(message) {
      if (isTextNoteEvent(message)) {
        setEvents((events) => [...events, message]);
      }
    },
  });

  return (
    <ol className="events">
      {events.map((event) => (
        <li>
          {isTextNoteEvent(event) && (
            <div className="event">
              <div className="event-time">
                {format(
                  new Date(event[2].created_at * 1000),
                  "h:mm aaa do MMM yyyy"
                )}
              </div>
              <div className="event-content">{event[2].content}</div>
              <div className="event-tags">
                {event[2].tags.map((tag) => (
                  <div>
                    <div>{tag[0]}</div>
                    <div>{tag.slice(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
