import { CommunityEntityLinkRepository } from "@/core/community-experience/repositories/CommunityEntityLinkRepository";
import { CommunityEntityLinkEligibilityService } from "@/core/community-experience/services/CommunityEntityLinkEligibilityService";
import type {
  CommunityEntityLinkListOptions,
  CommunityEntityLinkRecord,
  CommunityEntityLinkRequestInput,
  CommunityEntityType,
} from "@/core/community-experience/types";

export class CommunityEntityLinkService {
  static async listActiveByCommunity(
    communityId: string,
    options: CommunityEntityLinkListOptions = {},
  ): Promise<CommunityEntityLinkRecord[]> {
    return CommunityEntityLinkRepository.listActiveByCommunity(communityId, options);
  }

  static async listActiveByEntity(
    entityType: CommunityEntityType,
    entityId: string,
  ): Promise<CommunityEntityLinkRecord[]> {
    return CommunityEntityLinkRepository.listActiveByEntity(entityType, entityId);
  }

  static async requestCommunityLink(
    input: CommunityEntityLinkRequestInput,
  ): Promise<CommunityEntityLinkRecord | null> {
    const eligibility = await CommunityEntityLinkEligibilityService.check(input);

    if (!eligibility.eligible) {
      return null;
    }

    return CommunityEntityLinkRepository.requestCommunityLink(input);
  }
}
