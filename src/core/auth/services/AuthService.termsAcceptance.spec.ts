import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  refreshSession: vi.fn(),
  checkPasswordCompromise: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      signUp: mocks.signUp,
    },
  },
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    refreshSession: mocks.refreshSession,
  },
}));

vi.mock("@/core/auth/utils/compromisedPassword", () => ({
  checkPasswordCompromise: mocks.checkPasswordCompromise,
}));

import { AuthService } from "./AuthService";

describe("AuthService.signUp terms acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.refreshSession.mockResolvedValue(undefined);
    mocks.checkPasswordCompromise.mockResolvedValue({
      blocked: false,
      count: 0,
      unavailable: false,
    });
  });

  it("rejects a signup without the current Terms acceptance before calling Supabase", async () => {
    await expect(
      AuthService.signUp({
        email: "ana@example.com",
        password: "SenhaSegura@2026",
        name: "Ana Souza",
        termsAcceptance: undefined as never,
      }),
    ).rejects.toMatchObject({ code: "TERMS_ACCEPTANCE_REQUIRED" });

    expect(mocks.checkPasswordCompromise).not.toHaveBeenCalled();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("blocks a compromised password before creating the account", async () => {
    mocks.checkPasswordCompromise.mockResolvedValue({
      blocked: true,
      count: 77,
      unavailable: false,
      message: "Senha encontrada em vazamentos.",
    });

    await expect(
      AuthService.signUp({
        email: "ana@example.com",
        password: "SenhaVazada@2026",
        name: "Ana Souza",
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      }),
    ).rejects.toMatchObject({
      code: "PASSWORD_COMPROMISED",
      statusCode: 400,
      message: "Senha encontrada em vazamentos.",
    });

    expect(mocks.checkPasswordCompromise).toHaveBeenCalledWith(
      "SenhaVazada@2026",
    );
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("checks password compromise before sending accepted signup metadata", async () => {
    await AuthService.signUp({
      email: "ana@example.com",
      password: "SenhaSegura@2026",
      name: "Ana Souza",
      termsAcceptance: {
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      },
    });

    expect(mocks.checkPasswordCompromise).toHaveBeenCalledTimes(1);
    expect(mocks.checkPasswordCompromise).toHaveBeenCalledWith(
      "SenhaSegura@2026",
    );
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            terms_accepted: true,
            terms_version: TERMS_OF_SERVICE_VERSION,
          }),
        }),
      }),
    );
  });

  it("reports confirmation as required when signup returns no session", async () => {
    const result = await AuthService.signUp({
      email: "ana@example.com",
      password: "SenhaSegura@2026",
      name: "Ana Souza",
      termsAcceptance: {
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      },
    });

    expect(result).toEqual({ requiresEmailConfirmation: true });
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });

  it("publishes an immediate signup session before reporting first-access readiness", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { session: { access_token: "token" } },
      error: null,
    });

    const result = await AuthService.signUp({
      email: "ana@example.com",
      password: "SenhaSegura@2026",
      name: "Ana Souza",
      termsAcceptance: {
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      },
    });

    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ requiresEmailConfirmation: false });
  });

  it("does not turn a created account into a false signup failure when profile refresh is delayed", async () => {
    mocks.signUp.mockResolvedValueOnce({
      data: { session: { access_token: "token" } },
      error: null,
    });
    mocks.refreshSession.mockRejectedValueOnce(new Error("profile not ready"));

    await expect(
      AuthService.signUp({
        email: "ana@example.com",
        password: "SenhaSegura@2026",
        name: "Ana Souza",
        termsAcceptance: {
          accepted: true,
          version: TERMS_OF_SERVICE_VERSION,
        },
      }),
    ).resolves.toEqual({ requiresEmailConfirmation: false });
  });
});
