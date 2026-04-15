import { useContext } from "react";
import { SessionReactContext } from "../providers/SessionProvider";
import type { SessionContext } from "../types";

export function useSessionContext(): SessionContext {
  const context = useContext(SessionReactContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
