import { useState } from "react";
import "../App.css";
import { useNostrClientContext } from "../contexts/nostrClientContext";
import { Kind } from "nostr-tools";

export function Post() {
  const { sendEvent } = useNostrClientContext();
  const [message, setMesssage] = useState("");

  const submit = () => {
    sendEvent({
      kind: Kind.Text,
      content: message,
      tags: [],
      created_at: Math.floor(Date.now() / 1000),
    });
  };

  return (
    <div>
      <p>What's on your mind?</p>
      <textarea
        name="postMessage"
        onChange={(event) => {
          setMesssage(event.target.value as string);
        }}
      />
      <input name="submitMessage" type="submit" onSubmit={submit} />
    </div>
  );
}
