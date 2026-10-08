import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserRoles: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/core/authorization/services/RoleService", () => ({
  RoleService: {
    getUserRoles: mocks.getUserRoles,
    hasRole: vi.fn(),
    isAdmin: vi.fn(),
    isSuperAdmin: vi.fn(),
  },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { ProfileService } from "../ProfileService";

describe("ProfileService: roles globais nao sao fabricados em falha do broker", () => {
  const service = new ProfileService();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("aceita resultado vazio confirmado", async () => {
    mocks.getUserRoles.mockResolvedValueOnce([]);

    await expect(service.getUserRoles("user-1")).resolves.toEqual([]);

    expect(mocks.getUserRoles).toHaveBeenCalledWith("user-1");
  });

  it("preserva roles reais conforme resposta do owner", async () => {
    mocks.getUserRoles.mockResolvedValueOnce(["admin"]);

    await expect(service.getUserRoles("user-1")).resolves.toEqual(["admin"]);
  });

  it("propaga erro de role-rpc e registra a falha", async () => {
    const failure = new Error("role-rpc unavailable");
    mocks.getUserRoles.mockRejectedValueOnce(failure);

    await expect(service.getUserRoles("user-1")).rejects.toBe(failure);

    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        component: "ProfileService",
        action: "getUserRoles",
        metadata: { userId: "user-1" },
      }),
    );
  });
});
