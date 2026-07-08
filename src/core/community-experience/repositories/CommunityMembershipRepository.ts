import { supabase } from "@/integrations/supabase";
import type {
  CommunityMembershipRecord,
  CommunityMembershipRequestInput,
} from "@/core/community-experience/types";

const COMMUNITY_MEMBERSHIP_SELECT = [
  "id",
  "community_id",
  "profile_id",
  "user_id",
  "role",
  "status",
  "join_method",
  "verified_by_residence",
  "invited_by_profile_id",
  "approved_by_profile_id",
  "requested_at",
  "approved_at",
  "joined_at",
  "last_seen_at",
  "metadata",
  "created_at",
  "updated_at",
].join(",");

export class CommunityMembershipRepository {
  static async findByCommunityAndProfile(
    communityId: string,
    profileId: string,
  ): Promise<CommunityMembershipRecord | null> {
    const { data, error } = await supabase
      .from("community_memberships" as never)
      .select(COMMUNITY_MEMBERSHIP_SELECT)
      .eq("community_id", communityId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error || !data) return null;
    return data as CommunityMembershipRecord;
  }

  static async listForCurrentUser(): Promise<CommunityMembershipRecord[]> {
    const { data, error } = await supabase
      .from("community_memberships" as never)
      .select(COMMUNITY_MEMBERSHIP_SELECT)
      .order("requested_at", { ascending: false });

    if (error || !data) return [];
    return data as CommunityMembershipRecord[];
  }

  static async requestMembership(
    input: CommunityMembershipRequestInput,
  ): Promise<CommunityMembershipRecord | null> {
    const { data, error } = await supabase
      .from("community_memberships" as never)
      .insert({
        community_id: input.communityId,
        profile_id: input.profileId,
        user_id: input.userId,
        role: "member",
        status: "pending",
        join_method: input.joinMethod ?? "open",
        verified_by_residence: false,
      } as never)
      .select(COMMUNITY_MEMBERSHIP_SELECT)
      .maybeSingle();

    if (error || !data) return null;
    return data as CommunityMembershipRecord;
  }

  static async deleteOwnMembership(membershipId: string): Promise<boolean> {
    const { error } = await supabase
      .from("community_memberships" as never)
      .delete()
      .eq("id", membershipId);

    return !error;
  }
}
