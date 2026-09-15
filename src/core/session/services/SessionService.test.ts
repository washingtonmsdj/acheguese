import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SessionService } from "./SessionService";
import { SessionState } from "../state/SessionState";
import { ACTIVE_PROFILE_STORAGE_KEY } from "@/core/profiles/constants/activeProfileStorage";

const {
  authGetSessionMock,
  authGetUserMock,
  authOnAuthStateChangeMock,
  authSignOutMock,
  functionsInvokeMock,
  rpcMock,
  fromMock,
  sessionProfileReaderGetProfilesByUserIdMock,
} = vi.hoisted(() => ({
  authGetSessionMock: vi.fn(),
  authGetUserMock: vi.fn(),
  authOnAuthStateChangeMock: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  authSignOutMock: vi.fn(),
  functionsInvokeMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  sessionProfileReaderGetProfilesByUserIdMock: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      getSession: authGetSessionMock,
      getUser: authGetUserMock,
      onAuthStateChange: authOnAuthStateChangeMock,
      signOut: authSignOutMock,
    },
    functions: {
      invoke: functionsInvokeMock,
    },
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock("@/core/profiles/services/SessionProfileReader", () => ({
  SessionProfileReader: {
    getProfilesByUserId: sessionProfileReaderGetProfilesByUserIdMock,
  },
}));

const createSessionProfile = (
  id: string,
  profileType: "personal" | "business" = "personal",
) => ({
  id,
  userId: "user-123",
  name: profileType === "personal" ? "Pessoa" : "Empresa",
  displayName: profileType === "personal" ? "Pessoa" : "Empresa",
  username: null,
  avatarUrl: null,
  bio: null,
  profileType,
  city: null,
  neighborhood: null,
  state: null,
  street: null,
  phone: null,
  whatsapp: null,
  locationId: null,
  isActive: true,
  verified: false,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const createAuthSession = () => ({
  access_token: "token-user-123",
  user: {
    id: "user-123",
    email: "test@example.com",
    email_confirmed_at: "2026-01-01T00:00:00.000Z",
    created_at: "2025-01-01T00:00:00.000Z",
  },
});

describe("SessionService", () => {
  beforeEach(() => {
    SessionService.cleanup();
    SessionState.clear();
    window.localStorage.clear();
    authGetSessionMock.mockReset();
    authGetUserMock.mockReset();
    authOnAuthStateChangeMock.mockClear();
    authSignOutMock.mockReset();
    functionsInvokeMock.mockReset();
    rpcMock.mockReset();
    fromMock.mockReset();
    sessionProfileReaderGetProfilesByUserIdMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("retorna null em getCurrentUser quando nao ha sessao", async () => {
    authGetSessionMock.mockResolvedValue({ data: { session: null }, error: null });

    const user = await SessionService.getCurrentUser();

    expect(user).toBeNull();
  });

  it("retorna user mapeado em getCurrentUser quando ha sessao", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: createAuthSession(),
      },
      error: null,
    });

    const user = await SessionService.getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-123");
    expect(user?.email).toBe("test@example.com");
    expect(user?.emailConfirmed).toBe(true);
  });

  it("carrega perfis via reader estrito com mapeamento canonico", async () => {
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

    sessionProfileReaderGetProfilesByUserIdMock.mockResolvedValue([
      ...dbRows,
      {
        ...dbRows[0],
        id: "inactive-profile",
        is_active: false,
      },
    ]);

    const profiles = await SessionService.getUserProfiles("user-123");

    expect(sessionProfileReaderGetProfilesByUserIdMock).toHaveBeenCalledWith(
      "user-123",
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].userId).toBe("user-123");
    expect(profiles[0].profileType).toBe("personal");
    expect(profiles[0].locationId).toBe("loc-1");
  });

  it("propaga indisponibilidade do broker em vez de fabricar lista vazia", async () => {
    sessionProfileReaderGetProfilesByUserIdMock.mockRejectedValue(
      new Error("profile broker unavailable"),
    );

    await expect(SessionService.getUserProfiles("user-123")).rejects.toThrow(
      "profile broker unavailable",
    );
  });

  it("preserva a projecao conhecida quando refresh do mesmo usuario falha", async () => {
    const session = createAuthSession();
    const profile = createSessionProfile("profile-1");

    SessionState.setState({
      user: {
        id: "user-123",
        email: "test@example.com",
        emailConfirmed: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      activeProfile: profile,
      profiles: [profile],
    });
    authGetSessionMock.mockResolvedValue({ data: { session }, error: null });
    functionsInvokeMock.mockImplementation(
      async (_fn: string, options: { body?: { action?: string } }) => {
        if (options.body?.action === "getActiveProfile") {
          return {
            data: {
              data: {
                profile: {
                  id: "profile-1",
                  user_id: "user-123",
                  name: "Pessoa",
                  display_name: "Pessoa",
                  username: null,
                  avatar_url: null,
                  bio: null,
                  profile_type: "personal",
                  city: null,
                  neighborhood: null,
                  state: null,
                  street: null,
                  telefone: null,
                  whatsapp: null,
                  location_id: null,
                  is_active: true,
                  verified: false,
                  created_at: "2026-01-01T00:00:00.000Z",
                },
              },
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    );
    sessionProfileReaderGetProfilesByUserIdMock.mockRejectedValue(
      new Error("profile broker unavailable"),
    );

    await expect(SessionService.refreshSession()).rejects.toThrow(
      "profile broker unavailable",
    );

    expect(SessionState.getState().activeProfile?.id).toBe("profile-1");
    expect(SessionState.getState().profiles.map((item) => item.id)).toEqual([
      "profile-1",
    ]);
  });

  it("switchProfile usa RPC canonica e atualiza estado da sessao", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: createAuthSession(),
      },
      error: null,
    });
    authGetUserMock.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    functionsInvokeMock.mockImplementation(async (_fn: string, options: { body?: { action?: string } }) => {
      if (options.body?.action === "switchActiveProfile") {
        return { data: { data: { ok: true } }, error: null };
      }
      if (options.body?.action === "getActiveProfile") {
        return {
          data: {
            data: {
              profile: {
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
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    sessionProfileReaderGetProfilesByUserIdMock.mockResolvedValue([
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
    ]);

    await SessionService.switchProfile("profile-2");

    expect(functionsInvokeMock).toHaveBeenCalledWith("session-rpc", {
      body: {
        action: "switchActiveProfile",
        params: { profileId: "profile-2" },
      },
    });
    expect(SessionState.getState().activeProfile?.id).toBe("profile-2");
    expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe("profile-2");
  });

  it("mantem perfil selecionado localmente quando get_active_profile retorna outro perfil ativo legado", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: createAuthSession(),
      },
      error: null,
    });
    authGetUserMock.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    functionsInvokeMock.mockImplementation(async (_fn: string, options: { body?: { action?: string } }) => {
      if (options.body?.action === "switchActiveProfile") {
        return { data: { data: { ok: true } }, error: null };
      }
      if (options.body?.action === "getActiveProfile") {
        return {
          data: {
            data: {
              profile: {
                id: "profile-1",
                user_id: "user-123",
                name: "Pessoa",
                display_name: "Pessoa",
                username: null,
                avatar_url: null,
                bio: null,
                profile_type: "personal",
                city: null,
                neighborhood: null,
                state: null,
                street: null,
                telefone: null,
                whatsapp: null,
                location_id: null,
                is_active: true,
                verified: false,
                created_at: "2026-01-01T00:00:00.000Z",
              },
            },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    sessionProfileReaderGetProfilesByUserIdMock.mockResolvedValue([
      {
        id: "profile-1",
        user_id: "user-123",
        name: "Pessoa",
        display_name: "Pessoa",
        username: null,
        avatar_url: null,
        bio: null,
        profile_type: "personal",
        city: null,
        neighborhood: null,
        state: null,
        street: null,
        telefone: null,
        whatsapp: null,
        location_id: null,
        is_active: true,
        verified: false,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "profile-2",
        user_id: "user-123",
        name: "Pizzaria",
        display_name: "Pizzaria",
        username: null,
        avatar_url: null,
        bio: null,
        profile_type: "business",
        city: null,
        neighborhood: null,
        state: null,
        street: null,
        telefone: null,
        whatsapp: null,
        location_id: null,
        is_active: true,
        verified: false,
        created_at: "2026-01-02T00:00:00.000Z",
      },
    ]);

    await SessionService.switchProfile("profile-2");

    expect(SessionState.getState().activeProfile?.id).toBe("profile-2");
    expect(SessionState.getState().activeProfile?.profileType).toBe("business");
  });

  it("nao transforma switch confirmado em falso erro quando apenas a reidratacao falha", async () => {
    const session = createAuthSession();
    const personal = createSessionProfile("profile-1", "personal");
    const business = createSessionProfile("profile-2", "business");

    SessionState.setState({
      user: {
        id: "user-123",
        email: "test@example.com",
        emailConfirmed: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      activeProfile: personal,
      profiles: [personal, business],
    });
    authGetSessionMock.mockResolvedValue({ data: { session }, error: null });
    functionsInvokeMock.mockImplementation(
      async (_fn: string, options: { body?: { action?: string } }) => {
        if (options.body?.action === "switchActiveProfile") {
          return { data: { data: { ok: true } }, error: null };
        }
        if (options.body?.action === "getActiveProfile") {
          return {
            data: {
              data: {
                profile: {
                  id: "profile-2",
                  user_id: "user-123",
                  name: "Empresa",
                  display_name: "Empresa",
                  username: null,
                  avatar_url: null,
                  bio: null,
                  profile_type: "business",
                  city: null,
                  neighborhood: null,
                  state: null,
                  street: null,
                  telefone: null,
                  whatsapp: null,
                  location_id: null,
                  is_active: true,
                  verified: false,
                  created_at: "2026-01-01T00:00:00.000Z",
                },
              },
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
    );
    sessionProfileReaderGetProfilesByUserIdMock.mockRejectedValue(
      new Error("profile broker unavailable"),
    );

    await expect(SessionService.switchProfile("profile-2")).resolves.toBeUndefined();

    expect(SessionState.getState().activeProfile?.id).toBe("profile-2");
    expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe("profile-2");
  });

  it("descarta sucesso tardio de switch quando a sessao perde ownership", async () => {
    authGetSessionMock.mockResolvedValue({
      data: {
        session: createAuthSession(),
      },
      error: null,
    });

    let resolveSwitch!: (value: {
      data: { data: { ok: boolean } };
      error: null;
    }) => void;
    const pendingSwitch = new Promise<{
      data: { data: { ok: boolean } };
      error: null;
    }>((resolve) => {
      resolveSwitch = resolve;
    });

    functionsInvokeMock.mockImplementation(
      (_fn: string, options: { body?: { action?: string } }) => {
        if (options.body?.action === "switchActiveProfile") {
          return pendingSwitch;
        }
        return Promise.resolve({ data: null, error: null });
      },
    );

    const switchPromise = SessionService.switchProfile("profile-2");
    await vi.waitFor(() => {
      expect(functionsInvokeMock).toHaveBeenCalledWith("session-rpc", {
        body: {
          action: "switchActiveProfile",
          params: { profileId: "profile-2" },
        },
      });
    });

    SessionService.cleanup();
    resolveSwitch({ data: { data: { ok: true } }, error: null });

    await expect(switchPromise).rejects.toThrow(
      "A sessão mudou durante a operação. Tente novamente.",
    );
    expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBeNull();
  });
});
