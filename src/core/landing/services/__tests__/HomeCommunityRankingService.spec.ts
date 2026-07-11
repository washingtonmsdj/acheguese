import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeCommunityRankingService } from "../HomeCommunityRankingService";
import type { HomeCommunityCard } from "../HomeDiscoveryService";

const mocks = vi.hoisted(() => ({
  listActiveByCommunity: vi.fn(),
}));

vi.mock("@/core/community-experience/services/CommunityEntityLinkService", () => ({
  CommunityEntityLinkService: {
    listActiveByCommunity: mocks.listActiveByCommunity,
  },
}));

const firstCommunityId = "11111111-1111-4111-8111-111111111111";
const secondCommunityId = "22222222-2222-4222-8222-222222222222";

function makeCard(id: string, name: string): HomeCommunityCard {
  return {
    id,
    name,
    href: `/${name.toLowerCase()}`,
    imageKey: "bairroPituba",
    membersLabel: "Comunidade ativa",
    deltaLabel: "Ativa",
    avatarCount: 8,
  };
}

describe("HomeCommunityRankingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listActiveByCommunity.mockImplementation((communityId: string) => {
      if (communityId === secondCommunityId) {
        return Promise.resolve([
          {
            id: "link-1",
            community_id: secondCommunityId,
            entity_type: "business",
            entity_id: "33333333-3333-4333-8333-333333333333",
            link_type: "featured",
            status: "active",
            created_by_profile_id: null,
            approved_by_profile_id: null,
            approved_at: "2026-07-01T00:00:00Z",
            starts_at: null,
            ends_at: null,
            priority: 50,
            metadata: {},
            created_at: "2026-07-01T00:00:00Z",
            updated_at: "2026-07-01T00:00:00Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });
  });

  it("promotes communities with stronger public entity link signals", async () => {
    const ranked = await HomeCommunityRankingService.rankCommunityCards(
      [
        makeCard(firstCommunityId, "Pituba"),
        makeCard(secondCommunityId, "Barra"),
      ],
      2,
    );

    expect(ranked.map((community) => community.id)).toEqual([
      secondCommunityId,
      firstCommunityId,
    ]);
    expect(mocks.listActiveByCommunity).toHaveBeenCalledTimes(2);
  });

  it("does not query entity links for launch fallback ids", async () => {
    const ranked = await HomeCommunityRankingService.rankCommunityCards(
      [makeCard("launch-community-pituba", "Pituba")],
      1,
    );

    expect(ranked[0]?.id).toBe("launch-community-pituba");
    expect(mocks.listActiveByCommunity).not.toHaveBeenCalled();
  });
});
