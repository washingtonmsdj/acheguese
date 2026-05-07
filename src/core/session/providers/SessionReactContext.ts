import { createContext } from "react";

import type { SessionContext } from "../types";

export const SessionReactContext = createContext<SessionContext | undefined>(
  undefined,
);
