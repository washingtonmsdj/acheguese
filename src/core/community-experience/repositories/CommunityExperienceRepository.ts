import { supabase } from "@/integrations/supabase";
import type {
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
}
