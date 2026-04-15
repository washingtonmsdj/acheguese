export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  profileType: string;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  telefone: string | null;
  whatsapp: string | null;
  locationId: string | null;
  isActive: boolean;
  verified: boolean;
  createdAt: string;
}

export interface SessionData {
  user: User | null;
  activeProfile: Profile | null;
  profiles: Profile[];
}

export type CacheInvalidationCallback = (
  scope: "session" | "profile" | "authorization" | "all",
) => void;

export interface SessionContext {
  user: User | null;
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
  switchProfile: (profileId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}
