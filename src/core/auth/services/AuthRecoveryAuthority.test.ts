import { beforeEach, describe, expect, it, vi } from "vitest";

const { getClaims } = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      getClaims,
    },
  },
}));

import { AuthRecoveryAuthority } from "./AuthRecoveryAuthority";

describe("AuthRecoveryAuthority", () => {
  beforeEach(() => {
    getClaims.mockReset();
  });

  it("accepts only a verified session whose AMR includes account recovery", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-id",
          amr: [
            { method: "recovery", timestamp: 123 },
            { method: "otp", timestamp: 122 },
          ],
        },
      },
      error: null,
    });

    await expect(
      AuthRecoveryAuthority.isCurrentSessionRecovery(),
    ).resolves.toBe(true);
  });

  it("rejects a normal authenticated session even when valid claims exist", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-id",
          amr: [{ method: "password", timestamp: 123 }],
        },
      },
      error: null,
    });

    await expect(
      AuthRecoveryAuthority.isCurrentSessionRecovery(),
    ).resolves.toBe(false);
  });

  it("fails closed when claims cannot be verified or are malformed", async () => {
    getClaims.mockResolvedValueOnce({
      data: null,
      error: new Error("verification failed"),
    });
    await expect(
      AuthRecoveryAuthority.isCurrentSessionRecovery(),
    ).resolves.toBe(false);

    getClaims.mockResolvedValueOnce({
      data: { claims: { sub: "user-id", amr: "recovery" } },
      error: null,
    });
    await expect(
      AuthRecoveryAuthority.isCurrentSessionRecovery(),
    ).resolves.toBe(false);

    getClaims.mockRejectedValueOnce(new Error("network failed"));
    await expect(
      AuthRecoveryAuthority.isCurrentSessionRecovery(),
    ).resolves.toBe(false);
  });
});
