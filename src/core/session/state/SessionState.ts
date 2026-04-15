import type { User, Profile } from "../types";

export interface SessionData {
  user: User | null;
  activeProfile: Profile | null;
  profiles: Profile[];
}

const DEFAULT_STATE: SessionData = {
  user: null,
  activeProfile: null,
  profiles: [],
};

export class SessionState {
  private static user: User | null = null;
  private static activeProfile: Profile | null = null;
  private static profiles: Profile[] = [];

  private static listeners: Set<() => void> = new Set();

  static getState(): SessionData {
    return {
      user: SessionState.user,
      activeProfile: SessionState.activeProfile,
      profiles: SessionState.profiles,
    };
  }

  static setState(data: Partial<SessionData>): void {
    if ("user" in data) SessionState.user = data.user ?? null;
    if ("activeProfile" in data)
      SessionState.activeProfile = data.activeProfile ?? null;
    if ("profiles" in data) SessionState.profiles = data.profiles ?? [];
    SessionState.notifyListeners();
  }

  static clear(): void {
    SessionState.user = null;
    SessionState.activeProfile = null;
    SessionState.profiles = [];
    SessionState.notifyListeners();
  }

  static subscribe(listener: () => void): () => void {
    SessionState.listeners.add(listener);
    return () => {
      SessionState.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    SessionState.listeners.forEach((listener) => listener());
  }
}
