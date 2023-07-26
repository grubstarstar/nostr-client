import { useNostrClientContext } from "../contexts/nostrClientContext";
import "./App.css";

export function Users() {
  const { users } = useNostrClientContext();

  return (
    <div>
      {Object.entries(users).map(([pubKey, user]) => (
        <div key={pubKey} className="user">
          <div>{pubKey.substring(0, 8)}...</div>
          <div>
            <div>{user.displayName || user.name}</div>
            <div>{user.username}</div>
            {user.picture ? <img height={96} src={user.picture} /> : null}
            <a href={user.website}>{user.website}</a>
          </div>
        </div>
      ))}
    </div>
  );
}
