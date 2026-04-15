import { createContext } from "react";
import type { Profile, ProfileType } from "../services/multi-profile/types";

export interface MultiProfileContextValue {
  activeProfile: Profile | null;
  contextualProfile: Profile | null;
  effectiveProfile: Profile | null;
  allProfiles: Profile[];
  loading: boolean;
  error: string | null;
  switchProfile: (profileId: string) => Promise<boolean>;
  setModuleContext: (type: ProfileType | null) => void;
  refetch: () => Promise<void>;
}

export const MultiProfileContext =
  createContext<MultiProfileContextValue | undefined>(undefined);
