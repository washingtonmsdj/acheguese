import { beforeEach, describe, expect, it, vi } from "vitest";

let authListener:
  | ((event: string, session: typeof session | null) => void)
  | null = null;

const mocks = vi.hoisted(() => ({
  onAuthStateChange: vi.fn((listener: (event: string, session: unknown) => void) => {
    authListener = listener as typeof authListener;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  getSession: vi.fn(),
  getActiveProfile: vi.fn(),
  getProfilesByUserId: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}));

vi.mock("./SessionRpcService", () => ({
  SessionRpcService: {
    getActiveProfile: mocks.getActiveProfile,
    switchActiveProfile: vi.fn(),
  },
}));

vi.mock("@/core/profiles/services/SessionProfileReader", () => ({
  SessionProfileReader: {
    getProfilesByUserId: mocks.getProfilesByUserId,
  },
}));

import { SessionService } from "./SessionService";
import { SessionState } from "../state/SessionState";

const session = {
  access_token: "token-user-123",
  user: {
    id: "user-123",
    email: "test@example.com",
    email_confirmed_at: "2026-01-01T00:00:00.000Z",
    created_at: "2025-01-01T00:00:00.000Z",
  },
};

const activeProfileRow = {
  id: "profile-1",
  user_id: "user-123",
  name: "Pessoa",
  display_name: "Pessoa",
  username: "pessoa",
  avatar_url: null,
  bio: null,
  profile_type: "personal",
  city: "Salvador",
  neighborhood: "Barra",
  state: "BA",
  street: null,
  telefone: null,
  whatsapp: null,
  location_id: null,
  is_active: true,
  verified: false,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("SessionService initial hydration contract", () => {
  beforeEach(() => {
    SessionService.cleanup();
    SessionState.clear();
    authListener = null;
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.getActiveProfile.mockResolvedValue(activeProfileRow);
  });

  it("preserves authenticated identity but rejects initialization when private profiles fail", async () => {
    mocks.getProfilesByUserId.mockRejectedValue(
      new Error("profile broker unavailable"),
    );

    SessionService.initialize();
    expect(authListener).not.toBeNull();

    const initialization = SessionService.initializeSession();
    authListener?.("INITIAL_SESSION", session);

    await expect(initialization).rejects.toThrow("profile broker unavailable");

    expect(SessionState.getState().user?.id).toBe("user-123");
    expect(SessionState.getState().activeProfile).toBeNull();
    expect(SessionState.getState().profiles).toEqual([]);
  });
});
