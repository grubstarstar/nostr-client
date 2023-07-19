import { useState } from "react";
import { User, isSetMetadataEvent } from "./types";
import { useNostrClient } from "./client";
import "./App.css";

export function Users() {
  const [users, setUsers] = useState<Record<string, User>>({});

  const { send } = useNostrClient({
    url: "wss://sg.qemura.xyz",
    onMessage(message) {
      if (isSetMetadataEvent(message)) {
        const createdAt = message[2].created_at;
        const pubKey = message[2].pubkey;
        const newUser: User = JSON.parse(message[2].content);
        setUsers((users) => {
          const user = users[pubKey];
          return {
            ...users,
            [pubKey]:
              user?.updatedAt && user.updatedAt > createdAt
                ? {
                    ...user,
                    updatedAt: createdAt,
                  }
                : {
                    ...newUser,
                    updatedAt: createdAt,
                  },
          };
        });
      }
    },
  });

  return (
    <div>
      ASDASDAS
      <button onClick={() => send()}>Get users</button>
      {Object.entries(users).map(([pubKey, user]) => (
        <div key={pubKey} className="user">
          <div>{pubKey.substring(0, 8)}...</div>
          <div>
            <div>{user.displayName || user.name}</div>
            <div>{user.username}</div>
            {user.picture ? <img height={96} src={user.picture} /> : null}
            <div>{user.about}</div>
            <a href={user.website}>{user.website}</a>
          </div>
        </div>
      ))}
    </div>
  );
}
