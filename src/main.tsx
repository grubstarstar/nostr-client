import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App.tsx";
import "./index.css";
import { NostrClientContextProvider } from "./contexts/nostrClientContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NostrClientContextProvider>
      <App />
    </NostrClientContextProvider>
  </React.StrictMode>
);
