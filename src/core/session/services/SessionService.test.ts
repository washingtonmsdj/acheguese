import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SessionService } from "./SessionService";
import { SessionState } from "../state/SessionState";

const {
  authGetSessionMock,
  authGetUserMock,
  authOnAuthStateChangeMock,
  authSignOutMock,
  rpcMock,
  fromMock,
} = vi.hoisted(() => ({
  authGetSessionMock: vi.fn(),
  authGetUserMock: vi.fn(),
  authOnAuthStateChangeMock: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  authSignOutMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      getSession: authGetSessionMock,
      getUser: authGetUserMock,
      onAuthStateChange: authOnAuthStateChangeMock,
      signOut: authSignOutMock,
    },
    rpc: rpcMock,
    from: fromMock,
  },
}));

describe("SessionService", () => {
  beforeEach(() => {
    SessionState.clear();
    authGetSessionMock.mockReset();
    authGetUserMock.mockReset();
    authOnAuthStateChangeMock.mockClear();
    authSignOutMock.mockReset();
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null em getCurrentUser quando nao ha sessao", async () => {
    authGetSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    const user = await SessionService.getCurrentUser();

    expect(user).toBeNull();
  });

  it("retorna user mapeado em getCurrentUser quando ha sessao", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-123",
            email: "test@example.com",
            email_confirmed_at: "2026-01-01T00:00:00.000Z",
            created_at: "2025-01-01T00:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const user = await SessionService.getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-123");
    expect(user?.email).toBe("test@example.com");
    expect(user?.emailConfirmed).toBe(true);
  });

  it("carrega perfis via getUserProfiles com mapeamento canonico", async () => {
    const dbRows = [
      {
        id: "profile-1",
        user_id: "user-123",
        name: "Perfil 1",
        display_name: "Perfil Um",
        username: "perfil1",
        avatar_url: null,
        bio: null,
        profile_type: "personal",
        city: "Salvador",
        neighborhood: "Barra",
        state: "BA",
        telefone: null,
        whatsapp: null,
        location_id: "loc-1",
        is_active: true,
        verified: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const eqStatusMock = vi.fn().mockResolvedValue({ data: dbRows, error: null });
    const eqUserMock = vi.fn(() => ({ eq: eqStatusMock }));
    const selectMock = vi.fn(() => ({ eq: eqUserMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const profiles = await SessionService.getUserProfiles("user-123");

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(eqUserMock).toHaveBeenCalledWith("user_id", "user-123");
    expect(eqStatusMock).toHaveBeenCalledWith("is_active", true);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].userId).toBe("user-123");
    expect(profiles[0].profileType).toBe("personal");
    expect(profiles[0].locationId).toBe("loc-1");
  });

  it("switchProfile usa RPC canonica e atualiza estado da sessao", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-123",
            email: "test@example.com",
            email_confirmed_at: "2026-01-01T00:00:00.000Z",
            created_at: "2025-01-01T00:00:00.000Z",
          },
        },
      },
      error: null,
    });
    authGetUserMock.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "switch_active_profile") return { error: null };
      if (fn === "get_active_profile") {
        return {
          data: [
            {
              id: "profile-2",
              user_id: "user-123",
              name: "Empresa",
              display_name: null,
              username: null,
              avatar_url: null,
              bio: null,
              profile_type: "business",
              city: null,
              neighborhood: null,
              state: null,
              telefone: null,
              whatsapp: null,
              location_id: null,
              is_active: true,
              verified: false,
              created_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const eqStatusMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "profile-2",
          user_id: "user-123",
          name: "Empresa",
          display_name: null,
          username: null,
          avatar_url: null,
          bio: null,
          profile_type: "business",
          city: null,
          neighborhood: null,
          state: null,
          telefone: null,
          whatsapp: null,
          location_id: null,
          is_active: true,
          verified: false,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const eqUserMock = vi.fn(() => ({ eq: eqStatusMock }));
    const selectMock = vi.fn(() => ({ eq: eqUserMock }));
    fromMock.mockReturnValue({ select: selectMock });

    await SessionService.switchProfile("profile-2");

    expect(rpcMock).toHaveBeenCalledWith("switch_active_profile", {
      p_user_id: "user-123",
      p_profile_id: "profile-2",
    });
    expect(SessionState.getState().activeProfile?.id).toBe("profile-2");
  });
});
