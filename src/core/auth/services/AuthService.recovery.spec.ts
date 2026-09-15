import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  isCurrentSessionRecovery: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      updateUser: mocks.updateUser,
    },
  },
}));

vi.mock("@/core/auth/services/AuthRecoveryAuthority", () => ({
  AuthRecoveryAuthority: {
    isCurrentSessionRecovery: mocks.isCurrentSessionRecovery,
  },
}));

vi.mock("@/shared/config/publicSupabase", () => ({
  PUBLIC_SUPABASE_CONFIG: {
    url: "https://recovery-contract.invalid",
    publishableKey: "recovery-contract-key",
  },
  buildSupabaseFunctionUrl: (name: string) =>
    `https://recovery-contract.invalid/functions/v1/${name}`,
}));

import { AuthService } from "./AuthService";

describe("AuthService recovery password authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails closed before password mutation when the verified session is not recovery", async () => {
    mocks.isCurrentSessionRecovery.mockResolvedValue(false);
    const signOut = vi
      .spyOn(AuthService, "signOut")
      .mockResolvedValue(undefined);

    await expect(
      AuthService.updateRecoveredPassword("NovaSenha@2026"),
    ).rejects.toMatchObject({
      code: "RECOVERY_SESSION_REQUIRED",
      statusCode: 401,
    });

    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("mutates and disposes the temporary session only after verified recovery authority", async () => {
    mocks.isCurrentSessionRecovery.mockResolvedValue(true);
    mocks.updateUser.mockResolvedValue({ error: null });
    const signOut = vi
      .spyOn(AuthService, "signOut")
      .mockResolvedValue(undefined);

    await expect(
      AuthService.updateRecoveredPassword("NovaSenha@2026"),
    ).resolves.toBeUndefined();

    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: "NovaSenha@2026",
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("reports partial success when password changed but temporary session disposal fails", async () => {
    mocks.isCurrentSessionRecovery.mockResolvedValue(true);
    mocks.updateUser.mockResolvedValue({ error: null });
    const signOut = vi
      .spyOn(AuthService, "signOut")
      .mockRejectedValue(new Error("local cleanup failed"));

    await expect(
      AuthService.updateRecoveredPassword("NovaSenha@2026"),
    ).rejects.toMatchObject({
      code: "RECOVERY_SESSION_DISPOSAL_FAILED",
      statusCode: 500,
    });

    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: "NovaSenha@2026",
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("does not sign out or fake success when the recovery mutation fails", async () => {
    mocks.isCurrentSessionRecovery.mockResolvedValue(true);
    mocks.updateUser.mockResolvedValue({
      error: new Error("recovery mutation failed"),
    });
    const signOut = vi
      .spyOn(AuthService, "signOut")
      .mockResolvedValue(undefined);

    await expect(
      AuthService.updateRecoveredPassword("NovaSenha@2026"),
    ).rejects.toThrow("recovery mutation failed");

    expect(signOut).not.toHaveBeenCalled();
  });

  it("keeps ordinary account password changes independent from recovery authority", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });
    const signOut = vi
      .spyOn(AuthService, "signOut")
      .mockResolvedValue(undefined);

    await expect(
      AuthService.updatePassword("NovaSenha@2026", "123456"),
    ).resolves.toBeUndefined();

    expect(mocks.isCurrentSessionRecovery).not.toHaveBeenCalled();
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: "NovaSenha@2026",
      nonce: "123456",
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
