import "../App.css";
import { useNostrClientContext } from "../contexts/nostrClientContext";
import { TextNotes } from "./TextNotes";

export function Home() {
  const { me } = useNostrClientContext();

  return (
    <div>
      <div>
        <div>{me?.pubkey}</div>
        {/* <div>{me?.displayName}</div>
        <div>{me?.name}</div> */}
      </div>
      <div>
        <TextNotes />
      </div>
    </div>
  );
}
