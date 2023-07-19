import { useEffect, useRef } from "react";
import { ServerMessage, kinds } from "./types";

interface UseNostrClientArgs {
  url: string;
  onMessage: (message: ServerMessage) => void;
}

export function useNostrClient({ url, onMessage }: UseNostrClientArgs) {
  const ws = useRef(new WebSocket(url));

  function send() {
    console.log("send", ws.current.readyState);
    if (ws.current.readyState === WebSocket.OPEN) {
      console.log(
        "sending",
        JSON.stringify(["REQ", "arbitrary subscription id string", filters])
      );
      ws.current.send(
        JSON.stringify(["REQ", "arbitrary subscription id string", filters])
      );
    }
  }

  useEffect(() => {
    ws.current.onopen = (ev) => {
      console.log("onopen", ev);
    };
    ws.current.onmessage = (ev) => {
      const message: ServerMessage = JSON.parse(ev.data);
      console.log("onmessage", message);
      onMessage(message);
    };
    ws.current.onerror = (...ev) => {
      console.log("onerror", ev);
    };
    ws.current.onclose = (ev) => {
      console.log("onclose", ev);
    };
    return () => {
      console.log("ws.current.readyState", ws.current.readyState);
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

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
