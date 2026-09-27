import { supabase } from "@/integrations/supabase";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import type {
  CommunitySearchResult,
  CommunitySlugLookup,
  CommunityTerritoryType,
  TerritorialCommunityProfile,
  TerritoryCommunityRecord,
} from "@/core/community-experience/types";

const COMMUNITY_SELECT = [
  "id",
  "name",
  "slug",
  "city_id",
  "territory_type",
  "territory_id",
  "status",
].join(",");

const COMMUNITY_SEARCH_SELECT = [
  "id",
  "name",
  "slug",
  "city_id",
  "territory_type",
  "territory_id",
  "status",
  "headline",
  "description",
  "is_featured",
  "sort_order",
].join(",");

type CommunitySearchRow = CommunitySearchResult;

function mapCommunitySearchRow(row: CommunitySearchRow): CommunitySearchResult {
  return row;
}

export class CommunityExperienceRepository {
  static async findCommunityById(id: string): Promise<TerritoryCommunityRecord | null> {
    const { data, error } = await supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as TerritoryCommunityRecord;
  }

  static async findSingleActiveCommunityBySlug(alias: string): Promise<CommunitySlugLookup> {
    const { data, error } = await supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SELECT)
      .eq("slug", alias)
      .neq("status", "inactive")
      .limit(2);

    if (error || !data) {
      return { row: null, ambiguous: false };
    }

    const rows = data as TerritoryCommunityRecord[];
    return {
      row: rows.length === 1 ? rows[0] : null,
      ambiguous: rows.length > 1,
    };
  }

  static async findCommunityByCityAndSlug(
    cityId: string,
    slug: string,
  ): Promise<TerritoryCommunityRecord | null> {
    const { data, error } = await supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SELECT)
      .eq("city_id", cityId)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as TerritoryCommunityRecord;
  }

  static async findCommunityProfileByTerritory(
    territoryType: CommunityTerritoryType,
    territoryId: string,
  ): Promise<TerritorialCommunityProfile | null> {
    const { data, error } = await supabase
      .from("territory_communities" as never)
      .select("*")
      .eq("territory_type", territoryType)
      .eq("territory_id", territoryId)
      .maybeSingle();

    if (error || !data) return null;
    return data as TerritorialCommunityProfile;
  }

  static async searchPublicCommunities(
    query: string,
    limit = 12,
  ): Promise<CommunitySearchResult[]> {
    const searchFilter = buildSafeOrILikeFilter(
      ["name", "slug", "headline", "description"],
      query,
    );
    if (!searchFilter) return [];

    const { data, error } = await supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SEARCH_SELECT)
      .neq("status", "inactive")
      .or(searchFilter)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (error || !data) return [];
    return (data as unknown as CommunitySearchRow[]).map(mapCommunitySearchRow);
  }

  static async listPublicCommunitiesForDiscovery(
    options: { cityId?: string | null; limit?: number } = {},
  ): Promise<CommunitySearchResult[]> {
    let query = supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SEARCH_SELECT)
      .neq("status", "inactive")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(options.limit ?? 12);

    if (options.cityId) {
      query = query.eq("city_id", options.cityId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as unknown as CommunitySearchRow[]).map(mapCommunitySearchRow);
  }
}
