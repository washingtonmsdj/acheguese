import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileRow } from "../types";

vi.mock("@/core/verification/services/VerificationService", () => ({
  VerificationService: {
    getVerification: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/core/notifications/services", () => ({
  notificationService: {
    getStats: vi.fn().mockResolvedValue(null),
    fetchNotifications: vi.fn().mockResolvedValue([]),
  },
}));

import { getPrivateWorkspaceAggregate } from "../profile.workspace.aggregate";

type WorkspaceDeps = Parameters<typeof getPrivateWorkspaceAggregate>[0];

function createDeps(locationId?: string): WorkspaceDeps & {
  getTerritoryLabel: ReturnType<typeof vi.fn>;
} {
  const profile = {
    id: "profile-1",
    user_id: "user-1",
    profile_type: "personal",
    name: "Perfil Teste",
    display_name: "Perfil Teste",
    username: "teste",
    city: "Salvador",
    location_id: locationId,
    verified: false,
    reputation: 0,
    is_active: true,
    created_at: "2026-10-07T00:00:00Z",
    updated_at: "2026-10-07T00:00:00Z",
  } satisfies Partial<ProfileRow>;

  return {
    userId: "user-1",
    getActiveProfile: vi.fn().mockResolvedValue(profile),
    getProfileContext: vi.fn().mockResolvedValue({
      id: "profile-1",
      name: "Perfil Teste",
      displayName: "Perfil Teste",
      username: "teste",
      status: { isActive: true, isBlocked: false, isSuspended: false },
      permissions: {
        canPost: false,
        canComment: false,
        canMessage: false,
        canCreateBusiness: false,
        canModerate: false,
      },
      plan: { type: "basic", isPremium: false },
      reputation: { level: 1, score: 0 },
      verified: false,
    }),
    getProfilesByUserId: vi.fn().mockResolvedValue([profile]),
    getUserRoles: vi.fn().mockResolvedValue([]),
    getUserLikesCount: vi.fn().mockResolvedValue(0),
    getUserBusinessesByProfiles: vi.fn().mockResolvedValue([]),
    getTerritoryLabel: vi.fn().mockResolvedValue("Pituba, Salvador"),
    resolvePermissions: () => ({
      canPost: false,
      canComment: false,
      canMessage: false,
      canCreateBusiness: false,
      canModerate: false,
    }),
  } as WorkspaceDeps & { getTerritoryLabel: ReturnType<typeof vi.fn> };
}

describe("Account: Location SSOT para o rotulo territorial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sem location_id nao consulta o owner e mantem territorio ausente", async () => {
    const deps = createDeps();
    const workspace = await getPrivateWorkspaceAggregate(deps);

    expect(workspace.profile?.id).toBe("profile-1");
    expect(workspace.identity?.territoryLabel).toBeNull();
    expect(deps.getTerritoryLabel).not.toHaveBeenCalled();
  });

  it("consulta o owner pelo ID sem usar PostgREST na camada Profile", async () => {
    const deps = createDeps("location-1");
    const workspace = await getPrivateWorkspaceAggregate(deps);

    expect(deps.getTerritoryLabel).toHaveBeenCalledExactlyOnceWith("location-1");
    expect(workspace.identity?.territoryLabel).toBe("Pituba, Salvador");
    expect(workspace.identity?.locationId).toBe("location-1");
  });

  it("preserva ausencia de nome confirmada pelo owner sem gerar label falso", async () => {
    const deps = createDeps("location-1");
    deps.getTerritoryLabel.mockResolvedValueOnce(null);

    const workspace = await getPrivateWorkspaceAggregate(deps);

    expect(workspace.identity?.territoryLabel).toBeNull();
    expect(deps.getTerritoryLabel).toHaveBeenCalledOnce();
  });

  it("propaga erro de banco ou location referenciada inexistente", async () => {
    const deps = createDeps("location-1");
    const failure = new Error("territorial data plane unavailable");
    deps.getTerritoryLabel.mockRejectedValueOnce(failure);

    await expect(getPrivateWorkspaceAggregate(deps)).rejects.toBe(failure);
  });

  it("nao anuncia uma conta desbloqueada quando o contexto confirmado diz bloqueada", async () => {
    const deps = createDeps();
    (deps.getProfileContext as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "profile-1",
      name: "Perfil Teste",
      displayName: "Perfil Teste",
      username: "teste",
      status: { isActive: false, isBlocked: true, isSuspended: false },
      permissions: {
        canPost: false,
        canComment: false,
        canMessage: false,
        canCreateBusiness: false,
        canModerate: false,
      },
      plan: { type: "basic", isPremium: false },
      reputation: { level: 1, score: 0 },
      verified: false,
    });

    const workspace = await getPrivateWorkspaceAggregate(deps);

    expect(workspace.account.isBlocked).toBe(true);
    expect(workspace.account.accountState).toBe("blocked");
  });

  it("se o perfil existe mas seu contexto nao foi confirmado, rejeita o workspace", async () => {
    const deps = createDeps();
    (deps.getProfileContext as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await expect(getPrivateWorkspaceAggregate(deps)).rejects.toThrow(
      "Profile context unavailable for the active account",
    );
  });

  it("impede consultas territoriais diretas no agregador de Profile", () => {
    const aggregate = readFileSync(
      resolve(process.cwd(), "src/core/profiles/services/profile.workspace.aggregate.ts"),
      "utf8",
    );
    const service = readFileSync(
      resolve(process.cwd(), "src/core/profiles/services/ProfileService.ts"),
      "utf8",
    );

    expect(aggregate).not.toContain('.from("locations")');
    expect(aggregate).toContain("deps.getTerritoryLabel(activeProfile.location_id)");
    expect(service).toContain("new LocationService(createLocationRepository())");
    expect(service).toContain("locationService.getLocationById({ id: locationId })");
  });
});
