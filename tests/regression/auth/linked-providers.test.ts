import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
  },
}));

import { AuthIdentityService } from "@/core/auth/services/AuthIdentityService";

describe("AuthIdentityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives linked providers only from authenticated identities", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          identities: [
            { provider: "email" },
            { provider: "google" },
            { provider: "google" },
          ],
        },
      },
      error: null,
    });

    await expect(AuthIdentityService.getLinkedProviders()).resolves.toEqual({
      providers: ["email", "google"],
      hasGoogle: true,
    });
  });

  it("does not infer a Google link from provider availability", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: "email" }] } },
      error: null,
    });

    await expect(AuthIdentityService.getLinkedProviders()).resolves.toEqual({
      providers: ["email"],
      hasGoogle: false,
    });
  });

  it("fails instead of showing a guessed provider state", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("identity lookup failed"),
    });

    await expect(AuthIdentityService.getLinkedProviders()).rejects.toThrow(
      "identity lookup failed",
    );
  });
});
