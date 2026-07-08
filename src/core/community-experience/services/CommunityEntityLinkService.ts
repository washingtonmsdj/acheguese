import { CommunityEntityLinkRepository } from "@/core/community-experience/repositories/CommunityEntityLinkRepository";
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
    return CommunityEntityLinkRepository.requestCommunityLink(input);
  }
}
