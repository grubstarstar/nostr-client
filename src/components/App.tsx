import "../App.css";
import { Home } from "./Home";
import { Login } from "./Login";
import { useNostrClientContext } from "../contexts/nostrClientContext";

function App() {
  const { me } = useNostrClientContext();
  return me ? <Home /> : <Login />;
}

export default App;
