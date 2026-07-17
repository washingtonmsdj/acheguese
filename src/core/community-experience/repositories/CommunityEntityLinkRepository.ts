import { supabase } from "@/integrations/supabase";
import {
  COMMUNITY_ENTITY_LINK_REQUEST_DEFAULTS,
  type CommunityEntityLinkListOptions,
  type CommunityEntityLinkRecord,
  type CommunityEntityLinkRequestInput,
  type CommunityEntityType,
} from "@/core/community-experience/types";

const COMMUNITY_ENTITY_LINK_SELECT = [
  "id",
  "community_id",
  "entity_type",
  "entity_id",
  "link_type",
  "status",
  "created_by_profile_id",
  "approved_by_profile_id",
  "approved_at",
  "starts_at",
  "ends_at",
  "priority",
  "metadata",
  "created_at",
  "updated_at",
].join(",");

function isDuplicateCommunityEntityLinkError(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "23505" || message.includes("duplicate key");
}

export class CommunityEntityLinkRepository {
  private static async findExistingLink(
    communityId: string,
    entityType: CommunityEntityType,
    entityId: string,
  ): Promise<CommunityEntityLinkRecord | null> {
    const { data, error } = await supabase
      .from("community_entity_links" as never)
      .select(COMMUNITY_ENTITY_LINK_SELECT)
      .eq("community_id", communityId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("link_type", "member_submitted")
      .maybeSingle();

    if (error || !data) return null;
    return data as CommunityEntityLinkRecord;
  }

  static async listActiveByCommunity(
    communityId: string,
    options: CommunityEntityLinkListOptions = {},
  ): Promise<CommunityEntityLinkRecord[]> {
    const now = new Date().toISOString();
    const boundedLimit = Math.min(Math.max(options.limit ?? 100, 1), 100);
    let query = supabase
      .from("community_entity_links" as never)
      .select(COMMUNITY_ENTITY_LINK_SELECT)
      .eq("community_id", communityId)
      .eq("status", "active")
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (options.entityTypes?.length) {
      query = query.in("entity_type", [...options.entityTypes]);
    }

    query = query.limit(boundedLimit);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as CommunityEntityLinkRecord[];
  }

  static async listActiveByEntity(
    entityType: CommunityEntityType,
    entityId: string,
  ): Promise<CommunityEntityLinkRecord[]> {
    const { data, error } = await supabase
      .from("community_entity_links" as never)
      .select(COMMUNITY_ENTITY_LINK_SELECT)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data as CommunityEntityLinkRecord[];
  }

  static async requestCommunityLink(
    input: CommunityEntityLinkRequestInput,
  ): Promise<CommunityEntityLinkRecord | null> {
    const payload = {
      community_id: input.communityId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      link_type: COMMUNITY_ENTITY_LINK_REQUEST_DEFAULTS.LINK_TYPE,
      status: COMMUNITY_ENTITY_LINK_REQUEST_DEFAULTS.STATE,
      created_by_profile_id: input.createdByProfileId,
      priority: COMMUNITY_ENTITY_LINK_REQUEST_DEFAULTS.PRIORITY,
      metadata: input.metadata ?? {},
    };

    const { data, error } = await supabase
      .from("community_entity_links" as never)
      .insert(payload as never)
      .select(COMMUNITY_ENTITY_LINK_SELECT)
      .maybeSingle();

    if (error) {
      if (isDuplicateCommunityEntityLinkError(error)) {
        return this.findExistingLink(input.communityId, input.entityType, input.entityId);
      }

      return null;
    }

    if (!data) return null;
    return data as CommunityEntityLinkRecord;
  }
}
