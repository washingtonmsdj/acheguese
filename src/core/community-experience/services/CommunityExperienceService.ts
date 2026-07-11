import { COMMUNITY_EXPERIENCE_STATUS } from "@/core/community-experience/constants/statuses";
import { CommunityExperienceRepository } from "@/core/community-experience/repositories/CommunityExperienceRepository";
import type {
  CommunityExperienceResolvedTerritory,
  CommunityPublicAliasRecord,
  CommunityPublicAliasTerritoryReference,
  CommunitySearchResult,
  CommunitySlugLookup,
  CommunityStatus,
  CommunityTerritoryType,
  TerritorialCommunityProfile,
  TerritoryCommunityRecord,
} from "@/core/community-experience/types";
import type { TerritoryFilter } from "@/core/location/types";

export type { CommunityStatus, CommunityTerritoryType, TerritorialCommunityProfile };
export type { CommunitySearchResult };

function isPublicFallbackResolved(resolved: CommunityExperienceResolvedTerritory): boolean {
  return resolved.kind === "location" && resolved.location.metadata?.public_fallback === true;
}

function fallbackFromResolved(
  resolved: Exclude<CommunityExperienceResolvedTerritory, null>,
): TerritorialCommunityProfile {
  if (resolved.kind === "location" && resolved.location.type === "city") {
    return {
      id: `community-city-${resolved.location.id}`,
      name: `Achegue-se ${resolved.location.name}`,
      slug: resolved.location.slug,
      city_id: resolved.location.id,
      territory_type: "city",
      territory_id: resolved.location.id,
      status: COMMUNITY_EXPERIENCE_STATUS.ACTIVE,
      headline: null,
      description: null,
      launch_message: null,
      hero_title: null,
      hero_subtitle: null,
      primary_cta_label: null,
      secondary_cta_label: null,
      is_featured: false,
      sort_order: 0,
    };
  }

  if (
    resolved.kind === "location" &&
    (resolved.location.type === "neighborhood" || resolved.location.type === "district")
  ) {
    return {
      id: `community-${resolved.location.slug}`,
      name: `Achegue-se ${resolved.location.name}`,
      slug: resolved.location.slug,
      city_id: resolved.location.parent_id ?? null,
      territory_type: resolved.location.type === "neighborhood" ? "neighborhood" : "district",
      territory_id: resolved.location.id,
      status: COMMUNITY_EXPERIENCE_STATUS.INACTIVE,
      headline: null,
      description: null,
      launch_message: null,
      hero_title: null,
      hero_subtitle: null,
      primary_cta_label: null,
      secondary_cta_label: null,
      is_featured: false,
      sort_order: 99,
    };
  }

  return {
    id: "community-city-default",
    name: "Comunidade local",
    slug: resolved.kind === "group" ? resolved.group.slug : resolved.location.slug,
    city_id: null,
    territory_type: resolved.kind === "group" ? "territorial_group" : "district",
    territory_id: resolved.kind === "group" ? resolved.group.id : resolved.location.id,
    status: COMMUNITY_EXPERIENCE_STATUS.INACTIVE,
    headline: null,
    description: null,
    launch_message: null,
    hero_title: null,
    hero_subtitle: null,
    primary_cta_label: null,
    secondary_cta_label: null,
    is_featured: false,
    sort_order: 100,
  };
}

export class CommunityExperienceService {
  static async findCommunityById(id: string): Promise<TerritoryCommunityRecord | null> {
    return CommunityExperienceRepository.findCommunityById(id);
  }

  static async findSingleActiveCommunityBySlug(alias: string): Promise<CommunitySlugLookup> {
    return CommunityExperienceRepository.findSingleActiveCommunityBySlug(alias);
  }

  static async findCommunityByTerritoryReference(
    reference: CommunityPublicAliasTerritoryReference,
  ): Promise<TerritoryCommunityRecord | null> {
    return CommunityExperienceRepository.findCommunityByTerritoryReference(reference);
  }

  static async findCommunityByCityAndSlug(
    cityId: string,
    slug: string,
  ): Promise<TerritoryCommunityRecord | null> {
    return CommunityExperienceRepository.findCommunityByCityAndSlug(cityId, slug);
  }

  static async findActivePublicAlias(
    alias: string,
  ): Promise<CommunityPublicAliasRecord | null> {
    return CommunityExperienceRepository.findActivePublicAlias(alias);
  }

  static async findActivePublicAliasByCommunityId(
    communityId: string,
  ): Promise<CommunityPublicAliasRecord | null> {
    return CommunityExperienceRepository.findActivePublicAliasByCommunityId(communityId);
  }

  static async getCommunityProfile(
    resolved: CommunityExperienceResolvedTerritory,
  ): Promise<TerritorialCommunityProfile> {
    if (!resolved) {
      throw new Error("resolved territory is required");
    }

    if (isPublicFallbackResolved(resolved)) {
      return fallbackFromResolved(resolved);
    }

    const territoryType: CommunityTerritoryType =
      resolved.kind === "group"
        ? "territorial_group"
        : resolved.location.type === "city"
          ? "city"
          : resolved.location.type === "neighborhood"
            ? "neighborhood"
            : "district";
    const territoryId = resolved.kind === "group" ? resolved.group.id : resolved.location.id;

    try {
      const profile = await CommunityExperienceRepository.findCommunityProfileByTerritory(
        territoryType,
        territoryId,
      );
      if (profile) return profile;
    } catch {
      // fallback handled below
    }

    return fallbackFromResolved(resolved);
  }

  static async searchPublicCommunities(
    query: string,
    limit = 12,
  ): Promise<CommunitySearchResult[]> {
    return CommunityExperienceRepository.searchPublicCommunities(query, limit);
  }

  static async listPublicCommunitiesForDiscovery(
    filter: TerritoryFilter,
    limit = 12,
  ): Promise<CommunitySearchResult[]> {
    if (filter.scope === "none") return [];

    return CommunityExperienceRepository.listPublicCommunitiesForDiscovery({
      cityId: filter.scope === "location" ? filter.location_id : null,
      limit,
    });
  }
}
