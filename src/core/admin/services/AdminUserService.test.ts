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

vi.mock("./AdminRolesService", () => ({
  adminRolesService: {
    grantRole: vi.fn(),
    revokeRole: vi.fn(),
  },
}));

vi.mock("@/core/verification", () => ({
  VerificationAdminService: {
    verifyProfile: vi.fn(),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { AdminUserService } from "./AdminUserService";

describe("AdminUserService Edge contracts", () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it("returns a validated paginated user list", async () => {
    invoke.mockResolvedValue({
      data: { users: [], total: 0, page: 0, pageSize: 50 },
      error: null,
    });

    await expect(AdminUserService.listUsers()).resolves.toEqual({
      users: [],
      total: 0,
      page: 0,
      pageSize: 50,
    });
  });

  it("rejects malformed pagination instead of accepting a partial admin response", async () => {
    invoke.mockResolvedValue({
      data: { users: [], total: 0, page: 0 },
      error: null,
    });

    await expect(AdminUserService.listUsers()).rejects.toThrow(
      "Invalid admin user list response",
    );
  });

  it("preserves a structured list error from the Edge function", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("Forbidden: Admin access required");

    await expect(AdminUserService.listUsers()).rejects.toThrow(
      "Forbidden: Admin access required",
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it("returns null for an invalid detail payload without fabricating a user", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });

    await expect(
      AdminUserService.getUserById("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeNull();
  });

  it("requires an explicit success result from the suspension broker", async () => {
    invoke.mockResolvedValue({ data: {}, error: null });

    await expect(
      AdminUserService.suspendProfile(
        "11111111-1111-4111-8111-111111111111",
        "Violacao confirmada de politica",
      ),
    ).rejects.toThrow("Falha ao atualizar suspensão");
  });

  it("preserves a structured suspension rejection", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue("Moderation target not found");

    await expect(
      AdminUserService.unsuspendUser(
        "22222222-2222-4222-8222-222222222222",
      ),
    ).rejects.toThrow("Moderation target not found");
  });

  it("accepts the canonical suspension success envelope", async () => {
    invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          target_kind: "profile",
          target_id: "11111111-1111-4111-8111-111111111111",
          suspended: true,
          affected_count: 1,
        },
      },
      error: null,
    });

    await expect(
      AdminUserService.suspendProfile(
        "11111111-1111-4111-8111-111111111111",
        "Violacao confirmada de politica",
      ),
    ).resolves.toBeUndefined();
  });
});
