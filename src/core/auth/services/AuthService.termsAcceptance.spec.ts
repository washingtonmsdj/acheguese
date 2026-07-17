import { beforeEach, describe, expect, it, vi } from "vitest";

import { TERMS_OF_SERVICE_VERSION } from "@/core/legal/termsOfService";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    auth: {
      signUp: mocks.signUp,
    },
  },
}));

import { AuthService } from "./AuthService";

describe("AuthService.signUp terms acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUp.mockResolvedValue({ error: null });
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

    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("sends the accepted current version as signup metadata", async () => {
    await AuthService.signUp({
      email: "ana@example.com",
      password: "SenhaSegura@2026",
      name: "Ana Souza",
      termsAcceptance: {
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      },
    });

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
});
