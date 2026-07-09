import { supabase } from "@/integrations/supabase";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import type {
  CommunitySearchResult,
  CommunityPublicAliasRecord,
  CommunityPublicAliasTerritoryReference,
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
  "community_public_aliases(alias,status)",
].join(",");

type CommunitySearchRow = Omit<CommunitySearchResult, "public_alias"> & {
  community_public_aliases?: Array<{ alias?: string | null; status?: string | null }> | null;
};

function mapCommunitySearchRow(row: CommunitySearchRow): CommunitySearchResult {
  const publicAlias =
    row.community_public_aliases?.find((alias) => alias.status === "active")?.alias ?? null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city_id: row.city_id,
    territory_type: row.territory_type,
    territory_id: row.territory_id,
    status: row.status,
    headline: row.headline,
    description: row.description,
    is_featured: row.is_featured,
    sort_order: row.sort_order,
    public_alias: publicAlias,
  };
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

  static async findCommunityByTerritoryReference(
    reference: CommunityPublicAliasTerritoryReference,
  ): Promise<TerritoryCommunityRecord | null> {
    if (!reference.territoryId) return null;

    let query = supabase
      .from("territory_communities" as never)
      .select(COMMUNITY_SELECT)
      .eq("territory_id", reference.territoryId)
      .neq("status", "inactive");

    query =
      reference.kind === "group"
        ? query.eq("territory_type", "territorial_group")
        : query.in("territory_type", ["district", "neighborhood"]);

    const { data, error } = await query.limit(2);
    if (error || !data) return null;

    const rows = data as TerritoryCommunityRecord[];
    return rows.length === 1 ? rows[0] : null;
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

  static async findActivePublicAlias(
    alias: string,
  ): Promise<CommunityPublicAliasRecord | null> {
    const { data, error } = await supabase
      .from("community_public_aliases" as never)
      .select("alias, territory_community_id, status")
      .eq("alias", alias)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return data as CommunityPublicAliasRecord;
  }

  static async findActivePublicAliasByCommunityId(
    communityId: string,
  ): Promise<CommunityPublicAliasRecord | null> {
    const { data, error } = await supabase
      .from("community_public_aliases" as never)
      .select("alias, territory_community_id, status")
      .eq("territory_community_id", communityId)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) return null;
    return data as CommunityPublicAliasRecord;
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
}
