import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityEntityLinkEligibilityService } from "@/core/community-experience/services/CommunityEntityLinkEligibilityService";

const mocks = vi.hoisted(() => ({
  businessEligible: vi.fn(),
  eventEligible: vi.fn(),
  classifiedEligible: vi.fn(),
  professionalEligible: vi.fn(),
  postEligible: vi.fn(),
  touristPointEligible: vi.fn(),
}));

vi.mock("@/core/business", () => ({
  BusinessService: {
    isCommunityLinkEligibleByDataId: mocks.businessEligible,
  },
}));

vi.mock("@/core/classifieds/services", () => ({
  ClassifiedLinkEligibilityService: {
    isCommunityLinkEligible: mocks.classifiedEligible,
  },
}));

vi.mock("@/core/guide/tourist-points", () => ({
  TouristPointLinkEligibilityService: {
    isCommunityLinkEligible: mocks.touristPointEligible,
  },
}));

vi.mock("@/core/posts/services", () => ({
  PostLinkEligibilityService: {
    isCommunityLinkEligible: mocks.postEligible,
  },
}));

vi.mock("@/core/professional/services", () => ({
  ProfessionalLinkEligibilityService: {
    isCommunityLinkEligible: mocks.professionalEligible,
  },
}));

vi.mock("@/core/verticals/events", () => ({
  EventLinkEligibilityService: {
    isCommunityLinkEligible: mocks.eventEligible,
  },
}));

describe("CommunityEntityLinkEligibilityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates business validation to the business_data id eligibility rule", async () => {
    mocks.businessEligible.mockResolvedValue(true);

    await expect(
      CommunityEntityLinkEligibilityService.check({
        entityType: "business",
        entityId: "business-data-1",
      }),
    ).resolves.toEqual({ eligible: true, reason: "eligible" });

    expect(mocks.businessEligible).toHaveBeenCalledWith("business-data-1");
  });

  it.each([
    ["event", "event-1", "eventEligible"],
    ["classified", "classified-1", "classifiedEligible"],
    ["professional", "professional-1", "professionalEligible"],
    ["post", "post-1", "postEligible"],
    ["tourist_point", "tourist-point-1", "touristPointEligible"],
  ] as const)("delegates %s validation to its domain rule", async (
    entityType,
    entityId,
    mockName,
  ) => {
    mocks[mockName].mockResolvedValue(true);

    await expect(
      CommunityEntityLinkEligibilityService.check({ entityType, entityId }),
    ).resolves.toEqual({ eligible: true, reason: "eligible" });

    expect(mocks[mockName]).toHaveBeenCalledWith(entityId);
  });

  it("returns not_public when the domain rule rejects the entity", async () => {
    mocks.classifiedEligible.mockResolvedValue(false);

    await expect(
      CommunityEntityLinkEligibilityService.check({
        entityType: "classified",
        entityId: "classified-1",
      }),
    ).resolves.toEqual({ eligible: false, reason: "not_public" });
  });

  it("returns unsupported_entity_type for unknown future entity types", async () => {
    await expect(
      CommunityEntityLinkEligibilityService.check({
        entityType: "work_opportunity",
        entityId: "opportunity-1",
      } as never),
    ).resolves.toEqual({ eligible: false, reason: "unsupported_entity_type" });
  });
});
