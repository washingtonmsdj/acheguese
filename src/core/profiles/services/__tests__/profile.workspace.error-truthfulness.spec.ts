import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: mocks.logError,
    warn: vi.fn(),
  },
}));

import { getPrivateWorkspaceAggregate } from "../profile.workspace.aggregate";

type WorkspaceDeps = Parameters<typeof getPrivateWorkspaceAggregate>[0];

function depsWithProfileReader(
  getActiveProfile: ReturnType<typeof vi.fn>,
): WorkspaceDeps {
  return {
    userId: "user-1",
    getActiveProfile,
    getProfileContext: vi.fn(),
    getProfilesByUserId: vi.fn(),
    getUserRoles: vi.fn(),
    getUserLikesCount: vi.fn(),
    getUserBusinessesByProfiles: vi.fn(),
    resolvePermissions: vi.fn(),
  } as unknown as WorkspaceDeps;
}

describe("Conta: ausencia real versus indisponibilidade do workspace", () => {
  it("retorna workspace vazio quando a leitura confirma que nao ha perfil", async () => {
    const reader = vi.fn().mockResolvedValue(null);

    const result = await getPrivateWorkspaceAggregate(depsWithProfileReader(reader));

    expect(result.profile).toBeNull();
    expect(result.identity).toBeNull();
    expect(result.businesses).toEqual([]);
    expect(result.account.accountState).toBe("inactive");
    expect(mocks.logError).not.toHaveBeenCalled();
  });

  it("nao converte falha do owner de Profile em usuario sem identidade", async () => {
    const failure = new Error("profile data plane unavailable");
    const reader = vi.fn().mockRejectedValue(failure);

    await expect(
      getPrivateWorkspaceAggregate(depsWithProfileReader(reader)),
    ).rejects.toBe(failure);

    expect(mocks.logError).toHaveBeenCalledWith(
      "Error in getPrivateWorkspaceAggregate:",
      failure,
    );
  });
});
