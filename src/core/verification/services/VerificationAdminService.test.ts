import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

import { VerificationAdminService } from "./VerificationAdminService";

describe("VerificationAdminService", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it("returns a validated verification list", async () => {
    invoke.mockResolvedValue({ data: { items: [], total: 0 }, error: null });

    await expect(VerificationAdminService.list("pending")).resolves.toEqual([]);
  });

  it("rejects a malformed list instead of presenting it as empty", async () => {
    invoke.mockResolvedValue({ data: { total: 0 }, error: null });

    await expect(VerificationAdminService.list("pending")).rejects.toThrow(
      "Invalid profile verification list response",
    );
  });

  it("returns validated verification counters", async () => {
    invoke.mockResolvedValue({
      data: { pending: 2, approved: 3, rejected: 1, revoked: 0, total: 6 },
      error: null,
    });

    await expect(VerificationAdminService.getStats()).resolves.toEqual({
      pending: 2,
      approved: 3,
      rejected: 1,
      revoked: 0,
      total: 6,
    });
  });

  it("rejects incomplete stats instead of fabricating zero counts", async () => {
    invoke.mockResolvedValue({ data: { pending: 2 }, error: null });

    await expect(VerificationAdminService.getStats()).rejects.toThrow(
      "Invalid profile verification stats response",
    );
  });

  it("preserves safe structured Edge errors", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("Forbidden: Admin access required");

    await expect(VerificationAdminService.getStats()).rejects.toThrow(
      "Forbidden: Admin access required",
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it("requires the review command response contract", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });

    await expect(
      VerificationAdminService.review(
        "11111111-1111-4111-8111-111111111111",
        "approve",
      ),
    ).rejects.toThrow("Invalid profile verification review response");
  });

  it("accepts a command response that explicitly contains verification", async () => {
    invoke.mockResolvedValue({ data: { verification: null }, error: null });

    await expect(
      VerificationAdminService.verifyProfile(
        "11111111-1111-4111-8111-111111111111",
      ),
    ).resolves.toBeUndefined();
  });
});
