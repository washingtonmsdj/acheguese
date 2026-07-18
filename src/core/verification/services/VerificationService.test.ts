import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  rpc: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke: mocks.invoke },
    rpc: mocks.rpc,
  },
}));
vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { VerificationAdminService } from "./VerificationAdminService";
import { VerificationService } from "./VerificationService";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const VERIFICATION_ID = "22222222-2222-4222-8222-222222222222";

describe("VerificationService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits owner requests only through the actor-bound RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        id: VERIFICATION_ID,
        profile_id: PROFILE_ID,
        verification_type: "resident",
        status: "pending",
        submitted_at: "2026-07-18T15:00:00Z",
      },
      error: null,
    });

    await VerificationService.createVerificationRequest({
      profile_id: PROFILE_ID,
      verification_type: "resident",
      document_url: `storage://verification-documents/${PROFILE_ID}/proof_1.pdf`,
      document_type: "address_proof",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("request_profile_verification", {
      p_profile_id: PROFILE_ID,
      p_verification_type: "resident",
      p_document_url: `storage://verification-documents/${PROFILE_ID}/proof_1.pdf`,
      p_document_type: "address_proof",
      p_notes: null,
    });
  });

  it("does not hide request failures behind a successful result", async () => {
    const error = new Error("request denied");
    mocks.rpc.mockResolvedValue({ data: null, error });

    await expect(
      VerificationService.createVerificationRequest({
        profile_id: PROFILE_ID,
        verification_type: "resident",
      }),
    ).rejects.toBe(error);
    expect(mocks.trackError).toHaveBeenCalledOnce();
  });
});

describe("VerificationAdminService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes listing and review through the administrative Edge broker", async () => {
    mocks.invoke
      .mockResolvedValueOnce({ data: { items: [], total: 0 }, error: null })
      .mockResolvedValueOnce({ data: { verification: {} }, error: null });

    await expect(VerificationAdminService.list("pending")).resolves.toEqual([]);
    await VerificationAdminService.review(
      VERIFICATION_ID,
      "reject",
      "Documento nao corresponde ao perfil",
    );

    expect(mocks.invoke).toHaveBeenNthCalledWith(1, "admin-verify-profile", {
      body: { action: "list", status: "pending", limit: 100, offset: 0 },
    });
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, "admin-verify-profile", {
      body: {
        action: "review",
        verification_id: VERIFICATION_ID,
        decision: "reject",
        reason: "Documento nao corresponde ao perfil",
      },
    });
  });

  it("sends a mandatory audit reason when revoking an approval", async () => {
    mocks.invoke.mockResolvedValue({ data: { verification: {} }, error: null });

    await VerificationAdminService.review(
      VERIFICATION_ID,
      "revoke",
      "Documento expirado durante nova auditoria",
    );

    expect(mocks.invoke).toHaveBeenCalledWith("admin-verify-profile", {
      body: {
        action: "review",
        verification_id: VERIFICATION_ID,
        decision: "revoke",
        reason: "Documento expirado durante nova auditoria",
      },
    });
  });

  it("derives totals consistently from the broker response", async () => {
    mocks.invoke.mockResolvedValue({
      data: { pending: 2, approved: 3, rejected: 1, revoked: 1 },
      error: null,
    });

    await expect(VerificationAdminService.getStats()).resolves.toEqual({
      total: 7,
      pending: 2,
      approved: 3,
      rejected: 1,
      revoked: 1,
    });
  });
});
