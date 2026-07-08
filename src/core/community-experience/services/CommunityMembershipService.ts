import { CommunityMembershipRepository } from "@/core/community-experience/repositories/CommunityMembershipRepository";
import type {
  CommunityMembershipRecord,
  CommunityMembershipRequestInput,
} from "@/core/community-experience/types";

export class CommunityMembershipService {
  static async findByCommunityAndProfile(
    communityId: string,
    profileId: string,
  ): Promise<CommunityMembershipRecord | null> {
    return CommunityMembershipRepository.findByCommunityAndProfile(communityId, profileId);
  }

  static async listForCurrentUser(): Promise<CommunityMembershipRecord[]> {
    return CommunityMembershipRepository.listForCurrentUser();
  }

  static async requestMembership(
    input: CommunityMembershipRequestInput,
  ): Promise<CommunityMembershipRecord | null> {
    return CommunityMembershipRepository.requestMembership(input);
  }

  static async deleteOwnMembership(membershipId: string): Promise<boolean> {
    return CommunityMembershipRepository.deleteOwnMembership(membershipId);
  }
}
