import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
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

const profileRow = {
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

describe("SessionService overlapping refresh ownership", () => {
  beforeEach(() => {
    SessionService.cleanup();
    SessionState.clear();
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    mocks.getActiveProfile.mockResolvedValue(profileRow);
  });

  it("lets a newer refresh perform its own fresh read after the prior load fails", async () => {
    let rejectFirst!: (reason?: unknown) => void;
    const firstProfileRead = new Promise<never>((_resolve, reject) => {
      rejectFirst = reject;
    });

    mocks.getProfilesByUserId
      .mockImplementationOnce(() => firstProfileRead)
      .mockResolvedValueOnce([profileRow]);

    const firstRefresh = SessionService.refreshSession();
    const firstResult = expect(firstRefresh).rejects.toThrow(
      "profile broker unavailable",
    );

    await vi.waitFor(() => {
      expect(mocks.getProfilesByUserId).toHaveBeenCalledTimes(1);
    });

    const secondRefresh = SessionService.refreshSession();
    rejectFirst(new Error("profile broker unavailable"));

    await firstResult;
    await expect(secondRefresh).resolves.toBeUndefined();

    expect(mocks.getProfilesByUserId).toHaveBeenCalledTimes(2);
    expect(SessionState.getState().user?.id).toBe("user-123");
    expect(SessionState.getState().activeProfile?.id).toBe("profile-1");
    expect(SessionState.getState().profiles.map((profile) => profile.id)).toEqual([
      "profile-1",
    ]);
  });
});
