import type { SessionProfileView } from '@/core/profiles/views/SessionProfileView';

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
}

/**
 * Re-export de SessionProfileView como tipo de perfil na sessão.
 * 
 * ⚠️ NÃO redefinir Profile aqui — usar SessionProfileView de core/profiles/views.
 * @see SessionProfileView em @/core/profiles/views/SessionProfileView
 */
export type { SessionProfileView };

export interface SessionData {
  user: User | null;
  activeProfile: SessionProfileView | null;
  profiles: SessionProfileView[];
}

export type CacheInvalidationCallback = (
  scope: "session" | "profile" | "authorization" | "all",
) => void;

export interface SessionContext {
  user: User | null;
  activeProfile: SessionProfileView | null;
  profiles: SessionProfileView[];
  isLoading: boolean;
  error: Error | null;
  switchProfile: (profileId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}
