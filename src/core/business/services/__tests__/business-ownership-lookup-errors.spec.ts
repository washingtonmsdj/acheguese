import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getProfileById: vi.fn(),
  getActiveRoleResult: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));
vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: { getProfileById: mocks.getProfileById },
}));
vi.mock("@/core/profiles/services/multi-profile/profileMembersService", () => ({
  ProfileMembersService: { getActiveRoleResult: mocks.getActiveRoleResult },
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import { BusinessOwnershipService } from "../BusinessOwnershipService";

function ownerQuery(data: { profile_id: string } | null, error: Error | null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
}

describe("Business ownership lookup boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ownerQuery({ profile_id: "profile-1" }, null);
    mocks.getProfileById.mockResolvedValue({ user_id: "user-owner" });
    mocks.getActiveRoleResult.mockResolvedValue({ success: true, data: null });
  });

  it("preserves a confirmed denial without granting any access", async () => {
    await expect(
      BusinessOwnershipService.resolveManagementRole("business-1", "stranger"),
    ).resolves.toBeNull();
    await expect(
      BusinessOwnershipService.requireOwnership("business-1", "stranger"),
    ).rejects.toThrow("não tem permissão");
  });

  it("keeps direct owner and active delegated manager distinct", async () => {
    await expect(
      BusinessOwnershipService.resolveManagementRole("business-1", "user-owner"),
    ).resolves.toBe("owner");

    mocks.getActiveRoleResult.mockResolvedValue({ success: true, data: "admin" });
    await expect(
      BusinessOwnershipService.resolveManagementRole("business-1", "user-admin"),
    ).resolves.toBe("admin");
  });

  it("propagates a failed business-to-profile lookup rather than reporting denial", async () => {
    const unavailable = new Error("Business data unavailable");
    ownerQuery(null, unavailable);
    await expect(
      BusinessOwnershipService.resolveManagementRole("business-1", "user-owner"),
    ).rejects.toThrow(unavailable.message);
  });

  it("propagates membership service failures without treating them as denied roles", async () => {
    const unavailable = new Error("Membership lookup unavailable");
    mocks.getActiveRoleResult.mockResolvedValue({ success: false, error: unavailable.message });
    await expect(
      BusinessOwnershipService.resolveManagementRole("business-1", "user-admin"),
    ).rejects.toBe(unavailable);
  });
});
