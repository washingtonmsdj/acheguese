import { useContext } from "react";
import { SessionReactContext } from "../providers/SessionReactContext";
import type { SessionContext } from "../types";

export function useSessionContext(): SessionContext {
  const context = useContext(SessionReactContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
