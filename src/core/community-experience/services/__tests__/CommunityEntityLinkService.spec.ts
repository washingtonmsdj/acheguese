import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityEntityLinkService } from "@/core/community-experience/services/CommunityEntityLinkService";
import type { CommunityEntityLinkRequestInput } from "@/core/community-experience/types";

const mocks = vi.hoisted(() => ({
  checkEligibility: vi.fn(),
  requestCommunityLink: vi.fn(),
  listActiveByCommunity: vi.fn(),
  listActiveByEntity: vi.fn(),
}));

vi.mock(
  "@/core/community-experience/services/CommunityEntityLinkEligibilityService",
  () => ({
    CommunityEntityLinkEligibilityService: {
      check: mocks.checkEligibility,
    },
  }),
);

vi.mock(
  "@/core/community-experience/repositories/CommunityEntityLinkRepository",
  () => ({
    CommunityEntityLinkRepository: {
      listActiveByCommunity: mocks.listActiveByCommunity,
      listActiveByEntity: mocks.listActiveByEntity,
      requestCommunityLink: mocks.requestCommunityLink,
    },
  }),
);

const input: CommunityEntityLinkRequestInput = {
  communityId: "community-1",
  entityType: "business",
  entityId: "business-data-1",
  createdByProfileId: "profile-1",
};

describe("CommunityEntityLinkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a community link after eligibility passes", async () => {
    const record = {
      id: "link-1",
      community_id: input.communityId,
      entity_type: input.entityType,
      entity_id: input.entityId,
    };

    mocks.checkEligibility.mockResolvedValue({
      eligible: true,
      reason: "eligible",
    });
    mocks.requestCommunityLink.mockResolvedValue(record);

    await expect(CommunityEntityLinkService.requestCommunityLink(input)).resolves.toBe(
      record,
    );

    expect(mocks.checkEligibility).toHaveBeenCalledWith(input);
    expect(mocks.requestCommunityLink).toHaveBeenCalledWith(input);
  });

  it("does not write a community link when eligibility fails", async () => {
    mocks.checkEligibility.mockResolvedValue({
      eligible: false,
      reason: "not_public",
    });

    await expect(CommunityEntityLinkService.requestCommunityLink(input)).resolves.toBeNull();

    expect(mocks.checkEligibility).toHaveBeenCalledWith(input);
    expect(mocks.requestCommunityLink).not.toHaveBeenCalled();
  });
});
