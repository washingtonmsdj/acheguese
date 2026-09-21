import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getVerifiedAuthUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getVerifiedAuthUser: mocks.getVerifiedAuthUser,
  },
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    rpc: mocks.rpc,
  },
}));

import { AuthIdentityService } from "@/core/auth/services/AuthIdentityService";

describe("AuthIdentityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ data: true, error: null });
  });

  it("derives linked providers only from verified authenticated identities", async () => {
    mocks.getVerifiedAuthUser.mockResolvedValue({
      identities: [
        { provider: "email" },
        { provider: "google" },
        { provider: "google" },
      ],
      app_metadata: {},
    });

    await expect(AuthIdentityService.getLinkedProviders()).resolves.toEqual({
      providers: ["email", "google"],
      hasPassword: true,
      hasGoogle: true,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("current_user_has_password");
  });

  it("does not infer a Google link from provider availability", async () => {
    mocks.getVerifiedAuthUser.mockResolvedValue({
      identities: [{ provider: "email" }],
      app_metadata: {},
    });
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await expect(AuthIdentityService.getLinkedProviders()).resolves.toEqual({
      providers: ["email"],
      hasPassword: false,
      hasGoogle: false,
    });
  });

  it("fails instead of showing a guessed provider state", async () => {
    mocks.getVerifiedAuthUser.mockResolvedValue(null);

    await expect(AuthIdentityService.getLinkedProviders()).rejects.toThrow(
      "Authenticated user unavailable",
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when password capability authority fails", async () => {
    mocks.getVerifiedAuthUser.mockResolvedValue({
      identities: [{ provider: "email" }],
      app_metadata: {},
    });
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("password capability unavailable"),
    });

    await expect(AuthIdentityService.getLinkedProviders()).rejects.toThrow(
      "password capability unavailable",
    );
  });
});
