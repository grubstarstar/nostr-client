import "../App.css";
import { useNostrClientContext } from "../contexts/nostrClientContext";
import { TextNotes } from "./TextNotes";

export function Home() {
  const { me, following, relays, users } = useNostrClientContext();

  const followingUsers = following
    .map((pubkey) => users[pubkey] || pubkey)
    .filter((v) => !!v);
  console.log("users", users);
  console.log("following", following);
  console.log("followingUsers", followingUsers);
  return (
    <div>
      <div>
        {followingUsers.map((user) =>
          typeof user === "string" ? (
            <div>PUB KEY: {user}</div>
          ) : (
            <div>
              {/* <div>{user?.displayName}</div> */}
              <div style={{ color: "orange" }}>{user?.name}</div>
            </div>
          )
        )}
      </div>
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
