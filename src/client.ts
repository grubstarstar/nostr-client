import { useEffect, useRef } from "react";
import { ServerMessage, kinds } from "./types";

interface UseNostrClientArgs {
  url: string;
  onMessage: (message: ServerMessage) => void;
}

export function useNostrClient({ url, onMessage }: UseNostrClientArgs) {
  const ws = useRef(new WebSocket(url));

  function send() {
    ws.current.send(
      JSON.stringify(["REQ", "arbitrary subscription id string", filters])
    );
  }

  useEffect(() => {
    ws.current.onopen = (ev) => {
      console.log("open", ev);
    };
    ws.current.onmessage = (ev) => {
      const message: ServerMessage = JSON.parse(ev.data);
      onMessage(message);
    };
    ws.current.onerror = (ev) => {
      console.log("error", ev);
    };
    ws.current.onclose = (ev) => {
      console.log("close", ev);
    };
    return () => {
      ws.current.close();
    };
  }, [ws.current]);

  return {
    send,
  };
}

const filters = {
  // "ids": <a list of event ids or prefixes>,
  // "authors": <a list of pubkeys or prefixes, the pubkey of an event must be one of these>,
  kinds: [kinds.set_metadata],
  // kinds: Object.values(kinds),
  // "#e": <a list of event ids that are referenced in an "e" tag>,
  // "#p": <a list of pubkeys that are referenced in a "p" tag>,
  // "since": <an integer unix timestamp in seconds, events must be newer than this to pass>,
  // </an>"until": <an integer unix timestamp in seconds, events must be older than this to pass>,
  limit: 100,
};
