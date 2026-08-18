import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  storageGetItem: vi.fn(),
  storageRemoveItem: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      signOut: mocks.signOut,
    },
  },
}));

vi.mock("@/integrations/supabase/cookieStorage", () => ({
  createBrowserAuthStorage: () => ({
    getItem: mocks.storageGetItem,
    setItem: vi.fn(),
    removeItem: mocks.storageRemoveItem,
  }),
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getCurrentUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    refreshSession: vi.fn(),
  },
}));

vi.mock("@/core/authorization/services/RoleService", () => ({
  RoleService: {
    isAdmin: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: mocks.loggerWarn,
  },
}));

vi.mock("@/shared/config/publicSupabase", () => ({
  PUBLIC_SUPABASE_CONFIG: {
    url: "https://logout-regression.invalid",
    publishableKey: "logout-regression-fixture-key",
  },
  buildSupabaseFunctionUrl: (name: string) =>
    `https://logout-regression.invalid/functions/v1/${name}`,
}));

import { AUTH_STORAGE_KEY } from "@/config/security.config";
import { AuthService } from "@/core/auth/services/AuthService";

describe("auth logout regression guard", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.storageRemoveItem.mockResolvedValue(undefined);
    mocks.storageGetItem.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses current-session scope and keeps the success path untouched", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    await expect(AuthService.signOut()).resolves.toBeUndefined();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.storageRemoveItem).not.toHaveBeenCalled();
    expect(mocks.loggerWarn).not.toHaveBeenCalled();
  });

  it("clears the Achegue-se auth storage when Supabase returns a sign-out error", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("remote sign-out failed") });

    await expect(AuthService.signOut()).resolves.toBeUndefined();

    expect(mocks.storageRemoveItem).toHaveBeenNthCalledWith(1, AUTH_STORAGE_KEY);
    expect(mocks.storageRemoveItem).toHaveBeenNthCalledWith(
      2,
      `${AUTH_STORAGE_KEY}-code-verifier`,
    );
    expect(mocks.storageGetItem).toHaveBeenCalledWith(AUTH_STORAGE_KEY);
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "AuthService.signOut recovered with local auth cleanup",
      { reason: "completed" },
    );
  });

  it("clears local auth when the SDK throws instead of returning an error", async () => {
    mocks.signOut.mockRejectedValue(new Error("network failure"));

    await expect(AuthService.signOut()).resolves.toBeUndefined();

    expect(mocks.storageRemoveItem).toHaveBeenCalledTimes(2);
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "AuthService.signOut recovered with local auth cleanup",
      { reason: "failed" },
    );
  });

  it("does not let a hanging sign-out keep the authenticated shell open", async () => {
    vi.useFakeTimers();
    mocks.signOut.mockReturnValue(new Promise(() => undefined));

    const signOut = AuthService.signOut();
    await vi.advanceTimersByTimeAsync(8_000);

    await expect(signOut).resolves.toBeUndefined();
    expect(mocks.storageRemoveItem).toHaveBeenCalledTimes(2);
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "AuthService.signOut recovered with local auth cleanup",
      { reason: "timeout" },
    );
  });

  it("fails closed if the local session remains after cleanup", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("remote sign-out failed") });
    mocks.storageGetItem.mockResolvedValue("still-present");

    await expect(AuthService.signOut()).rejects.toThrow(
      "Não foi possível encerrar a sessão local com segurança.",
    );
  });
});
