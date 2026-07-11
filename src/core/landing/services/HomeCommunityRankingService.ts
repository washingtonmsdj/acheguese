import { CommunityEntityLinkService } from "@/core/community-experience/services/CommunityEntityLinkService";
import type {
  CommunityEntityLinkRecord,
  CommunityEntityLinkType,
  CommunityEntityType,
} from "@/core/community-experience/types";
import type { HomeCommunityCard } from "./HomeDiscoveryService";

type ScoredCommunity = {
  card: HomeCommunityCard;
  index: number;
  score: number;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const linkTypeWeights: Record<CommunityEntityLinkType, number> = {
  official: 80,
  featured: 70,
  sponsored: 60,
  primary_territory: 45,
  serves_area: 25,
  member_submitted: 10,
};

const entityTypeWeights: Record<CommunityEntityType, number> = {
  business: 14,
  professional: 12,
  tourist_point: 10,
  classified: 8,
  post: 8,
  event: 6,
};

function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

function scoreLink(link: CommunityEntityLinkRecord): number {
  const priorityScore = Math.max(0, Math.min(link.priority, 50));
  return (
    linkTypeWeights[link.link_type] +
    entityTypeWeights[link.entity_type] +
    priorityScore
  );
}

async function scoreCommunityLinks(communityId: string): Promise<number> {
  if (!isUuid(communityId)) return 0;

  const links = await CommunityEntityLinkService.listActiveByCommunity(
    communityId,
    { limit: 12 },
  );

  return links.reduce((score, link) => score + scoreLink(link), 0);
}

function baseEditorialScore(card: HomeCommunityCard, index: number): number {
  const featuredScore = card.badge ? 300 : 0;
  const orderScore = Math.max(0, 240 - index * 20);
  return featuredScore + orderScore;
}

export class HomeCommunityRankingService {
  static async rankCommunityCards(
    cards: HomeCommunityCard[],
    limit: number,
  ): Promise<HomeCommunityCard[]> {
    const scored = await Promise.all(
      cards.map(async (card, index): Promise<ScoredCommunity> => ({
        card,
        index,
        score:
          baseEditorialScore(card, index) +
          (await scoreCommunityLinks(card.id)),
      })),
    );

    return scored
      .sort((a, b) => {
        const scoreDelta = b.score - a.score;
        if (scoreDelta !== 0) return scoreDelta;

        const nameDelta = a.card.name.localeCompare(b.card.name);
        if (nameDelta !== 0) return nameDelta;

        return a.index - b.index;
      })
      .slice(0, limit)
      .map((item) => item.card);
  }
}
