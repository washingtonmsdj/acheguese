import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileRow } from "../types";

const mocks = vi.hoisted(() => ({
  getVerification: vi.fn(),
  getStats: vi.fn(),
  fetchNotifications: vi.fn(),
}));

vi.mock("@/core/verification/services/VerificationService", () => ({
  VerificationService: {
    getVerification: mocks.getVerification,
  },
}));

vi.mock("@/core/notifications/services", () => ({
  notificationService: {
    getStats: mocks.getStats,
    fetchNotifications: mocks.fetchNotifications,
  },
}));

import { getPrivateWorkspaceAggregate } from "../profile.workspace.aggregate";

type WorkspaceDeps = Parameters<typeof getPrivateWorkspaceAggregate>[0];

function createDeps(): WorkspaceDeps {
  const profile = {
    id: "profile-1",
    user_id: "user-1",
    profile_type: "personal",
    name: "Perfil Teste",
    display_name: "Perfil Teste",
    username: "teste",
    verified: false,
    reputation: 0,
    is_active: true,
    created_at: "2026-11-13T00:00:00Z",
    updated_at: "2026-11-13T00:00:00Z",
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
        canCreateBusiness: true,
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
    getTerritoryLabel: vi.fn().mockResolvedValue(null),
    resolvePermissions: (context) => context.permissions,
  } as WorkspaceDeps;
}

describe("private profile workspace optional reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getVerification.mockResolvedValue(null);
    mocks.getStats.mockResolvedValue(null);
    mocks.fetchNotifications.mockResolvedValue([]);
  });

  it("does not let an optional notification read hold the workspace forever", async () => {
    vi.useFakeTimers();
    try {
      mocks.getStats.mockImplementation(() => new Promise(() => undefined));

      const result = getPrivateWorkspaceAggregate(createDeps());
      await vi.advanceTimersByTimeAsync(3_000);
      const workspace = await result;

      expect(workspace.profile?.id).toBe("profile-1");
      expect(workspace.notifications.total).toBe(0);
      expect(workspace.notifications.unread).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
