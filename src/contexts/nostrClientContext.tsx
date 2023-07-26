import { PropsWithChildren, createContext, useContext } from "react";
import { NostrClient, useNostrClient } from "../hooks/useNostrClient";

const NostrClientContext = createContext<NostrClient>({} as NostrClient);

export const useNostrClientContext = () => useContext(NostrClientContext);

export const NostrClientContextProvider = ({ children }: PropsWithChildren) => {
  const nostrClient = useNostrClient();
  return (
    <NostrClientContext.Provider value={nostrClient}>
      {children}
    </NostrClientContext.Provider>
  );
};
