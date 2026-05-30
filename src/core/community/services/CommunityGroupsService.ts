import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { TerritoryFilter } from "@/core/location";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";

const db = supabase as any;

interface GroupProfileInfo {
  name: string | null;
  avatar_url: string | null;
}

interface GroupMemberCountRow {
  count: number;
}

export interface GroupRow {
  id: string;
  name: string;
  description: string;
  category: string;
  members_count:
    | number
    | GroupMemberCountRow[]
    | string
    | null;
  created_at: string;
  created_by: string;
  profile?: GroupProfileInfo[] | GroupProfileInfo | null;
}

export type GroupCreateInput = {
  name: string;
  description: string;
  category?: string;
  is_private?: boolean;
  location_id?: string;
  rules?: string[];
  join_policy?: string;
  posting_policy?: string;
  member_visibility?: string;
  media_policy?: string;
};

export class CommunityGroupsService {
  static async getGroupsPage(params: {
    search?: string;
    territoryFilter?: TerritoryFilter;
    offset?: number;
    limit?: number;
    groupIds?: string[];
    sortBy?: "recentes" | "populares" | "relevancia";
  }): Promise<{ items: GroupRow[]; totalCount: number; hasMore: boolean; nextOffset: number | null }> {
    const {
      search,
      territoryFilter,
      offset = 0,
      limit = 20,
      groupIds,
      sortBy = "recentes",
    } = params;
    try {
      let query = db
        .from("groups")
        .select(
          `
          *,
          profiles:created_by(name, avatar_url),
          members_count:group_members_new(count)
        `,
          { count: "exact" },
        )
        .range(offset, offset + limit - 1);

      if (sortBy === "populares") {
        query = query
          .order("members_count", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      if (search) {
        const sanitizedSearch = sanitizeForILike(search);
        if (sanitizedSearch) {
          query = query.ilike("name", `%${sanitizedSearch}%`);
        }
      }

      if (groupIds && groupIds.length > 0) {
        query = query.in("id", groupIds);
      }

      if (territoryFilter?.scope === "location") {
        query = query.eq("location_id", territoryFilter.location_id);
      } else if (territoryFilter?.scope === "group" && territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", territoryFilter.location_ids);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const normalized = ((data || []) as GroupRow[]).map((g) => ({
        ...g,
        members_count: g.members_count?.[0]?.count ?? 0,
      })) as GroupRow[];

      const totalCount = count ?? normalized.length;
      const hasMore = offset + normalized.length < totalCount;
      return {
        items: normalized,
        totalCount,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
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

  static async getGroups(search?: string, territoryFilter?: TerritoryFilter): Promise<GroupRow[]> {
    try {
      let query = db
        .from("groups")
        .select(`
          *,
          profiles:created_by(name, avatar_url),
          members_count:group_members_new(count)
        `)
        .order("created_at", { ascending: false });

      if (search) {
        const sanitizedSearch = sanitizeForILike(search);
        if (sanitizedSearch) {
          query = query.ilike("name", `%${sanitizedSearch}%`);
        }
      }

      if (territoryFilter?.scope === "location") {
        query = query.eq("location_id", territoryFilter.location_id);
      } else if (territoryFilter?.scope === "group" && territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      const normalized = ((data || []) as GroupRow[]).map((g) => ({
        ...g,
        members_count: g.members_count?.[0]?.count ?? 0,
      })) as GroupRow[];
      return normalized;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGroupsService",
        action: "getGroups",
      });
      return [];
    }
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
        join_policy: groupData.join_policy || (groupData.is_private ? "approval" : "open"),
        posting_policy: groupData.posting_policy || "members",
        member_visibility: groupData.member_visibility || "members_count_public",
        media_policy: groupData.media_policy || "manual_download",
        rules: groupData.rules,
        capabilities: {
          text: true,
          images: true,
          audio: true,
          polls: true,
          chat: true,
          reactions: true,
          reports: true,
          share_link: true,
        },
        type: groupType,
        location_id: groupData.location_id,
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
