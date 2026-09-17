import type { Profile, ProfileType } from "./types";

export type ModuleProfileState = "loading" | "resolved" | "select" | "missing";

export interface ModuleProfileSelection {
  profile: Profile | null;
  profiles: Profile[];
  state: ModuleProfileState;
}

export function resolveModuleProfileSelection(input: {
  allProfiles: Profile[];
  contextualProfile: Profile | null;
  loading: boolean;
  type: ProfileType;
}): ModuleProfileSelection {
  const { allProfiles, contextualProfile, loading, type } = input;
  const profiles = allProfiles.filter((profile) => profile.profile_type === type);

  if (loading) return { profile: null, profiles, state: "loading" };
  if (profiles.length === 0) return { profile: null, profiles, state: "missing" };
  if (profiles.length === 1) return { profile: profiles[0], profiles, state: "resolved" };
  if (contextualProfile?.profile_type === type) {
    return { profile: contextualProfile, profiles, state: "resolved" };
  }
  return { profile: null, profiles, state: "select" };
}
