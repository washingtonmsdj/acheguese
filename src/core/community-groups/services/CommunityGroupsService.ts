import { supabase } from "@/integrations/supabase";
import type { Json } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { TerritoryFilter } from "@/core/location";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import { profileService } from "@/core/profiles/services/ProfileService";

interface GroupProfileInfo {
  name: string | null;
  avatar_url: string | null;
}

export interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  members_count: number | null;
  created_at: string;
  created_by: string | null;
  avatar_url?: string | null;
  is_private?: boolean;
  location_id?: string | null;
  profile?: GroupProfileInfo[] | GroupProfileInfo | null;
}

export type GroupCreateInput = {
  name: string;
  description: string;
  category?: string;
  is_private?: boolean;
  location_id: string;
  rules?: string[];
  join_policy?: string;
  posting_policy?: string;
  member_visibility?: string;
  media_policy?: string;
};

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
}

type GroupSelectRow = GroupRow;

interface GroupsQueryBuilder {
  select: (
    columns: string,
    options?: { count?: "exact"; head?: boolean },
  ) => GroupsQueryBuilder;
  eq: (column: string, value: string) => GroupsQueryBuilder;
  insert: (
    payload: Record<string, unknown>,
  ) => {
    select: (_columns?: string) => {
      single: () => Promise<QueryResult<GroupSelectRow>>;
    };
  };
  single: () => Promise<QueryResult<GroupSelectRow>>;
  then: PromiseLike<QueryResult<GroupSelectRow[]>>["then"];
}

interface GroupsDbClient {
  from: (table: "groups") => GroupsQueryBuilder;
}

const db = supabase as unknown as GroupsDbClient;

function boundedInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

function normalizeGroup(group: GroupRow): GroupRow {
  return {
    ...group,
    members_count:
      typeof group.members_count === "number" && Number.isFinite(group.members_count)
        ? group.members_count
        : 0,
  };
}

interface GroupsPageRpcResponse {
  items?: GroupRow[];
  total_count?: number;
  has_more?: boolean;
  next_offset?: number | null;
}

export class CommunityGroupsService {
  static async getGroupsPage(params: {
    search?: string;
    territoryFilter?: TerritoryFilter;
    offset?: number;
    limit?: number;
    groupIds?: string[];
    onlyMemberGroups?: boolean;
    sortBy?: "recentes" | "populares" | "relevancia";
  }): Promise<{
    items: GroupRow[];
    totalCount: number;
    hasMore: boolean;
    nextOffset: number | null;
  }> {
    const {
      search,
      territoryFilter,
      offset = 0,
      limit = 20,
      groupIds,
      onlyMemberGroups = false,
      sortBy = "recentes",
    } = params;

    try {
      const boundedOffset = boundedInteger(offset, 0, 10_000);
      const boundedLimit = boundedInteger(limit, 1, 100);
      const sanitizedSearch = sanitizeForILike(search ?? "") || null;
      const uniqueGroupIds = groupIds
        ? [...new Set(groupIds.filter((groupId) => groupId.trim().length > 0))].slice(0, 500)
        : null;
      const locationIds =
        territoryFilter?.scope === "location"
          ? [territoryFilter.location_id]
          : territoryFilter?.scope === "group"
            ? territoryFilter.location_ids.slice(0, 100)
            : null;

      if (territoryFilter?.scope === "none") {
        return { items: [], totalCount: 0, hasMore: false, nextOffset: null };
      }

      const { data, error } = await supabase.rpc("list_community_groups_page", {
        p_group_ids: uniqueGroupIds,
        p_limit: boundedLimit,
        p_location_ids: locationIds,
        p_offset: boundedOffset,
        p_only_member_groups: onlyMemberGroups,
        p_search: sanitizedSearch,
        p_sort: sortBy,
      });

      if (error) throw error;

      const response = (data ?? {}) as unknown as GroupsPageRpcResponse;
      const normalized = Array.isArray(response.items)
        ? response.items.map(normalizeGroup)
        : [];
      const totalCount = Math.max(0, Number(response.total_count ?? 0));
      const hasMore = Boolean(response.has_more);
      const nextOffset =
        hasMore && typeof response.next_offset === "number"
          ? response.next_offset
          : null;

      return {
        items: normalized,
        totalCount,
        hasMore,
        nextOffset,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGroupsService",
        action: "getGroupsPage",
      });
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextOffset: null,
      };
    }
  }

  static async getGroups(
    search?: string,
    territoryFilter?: TerritoryFilter,
  ): Promise<GroupRow[]> {
    const result = await this.getGroupsPage({
      search,
      territoryFilter,
      limit: 50,
    });
    return result.items;
  }

  static async getGroupById(groupId: string): Promise<GroupRow | null> {
    try {
      const { data, error } = await db
        .from("groups")
        .select("*, profiles:created_by(name, avatar_url)")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGroupsService",
        action: "getGroupById",
      });
      return null;
    }
  }

  static async createGroup(groupData: GroupCreateInput): Promise<GroupRow | null> {
    try {
      const activeProfile = await profileService.getRequiredActiveProfile();
      const groupType =
        groupData.category === "vizinhanca"
          ? "neighborhood"
          : groupData.category
            ? "interest"
            : "community";

      const payload = {
        name: groupData.name,
        description: groupData.description,
        category: groupData.category || "geral",
        is_private: Boolean(groupData.is_private),
        visibility: groupData.is_private ? "private" : "public",
        join_policy:
          groupData.join_policy || (groupData.is_private ? "approval" : "open"),
        posting_policy: groupData.posting_policy || "members",
        member_visibility:
          groupData.member_visibility || "members_count_public",
        media_policy: groupData.media_policy || "manual_download",
        rules: groupData.rules?.join("\n") || null,
        capabilities: {
          text: true,
          images: true,
          audio: true,
          polls: true,
          chat: true,
          reactions: true,
          reports: true,
          share_link: true,
        } satisfies Json,
        type: groupType,
        location_id: groupData.location_id,
        created_by: activeProfile.id,
      };

      const { data, error } = await db
        .from("groups")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGroupsService",
        action: "createGroup",
      });
      return null;
    }
  }
}
