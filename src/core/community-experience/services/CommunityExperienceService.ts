import { supabase } from "@/integrations/supabase";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { COMMUNITY_EXPERIENCE_STATUS } from "@/core/community-experience/constants/statuses";
import type {
  CommunityStatus,
  CommunityTerritoryType,
} from "@/core/community-experience/types";

export type { CommunityStatus, CommunityTerritoryType };

export interface TerritorialCommunityProfile {
  id: string;
  name: string;
  slug: string;
  city_id: string | null;
  territory_type: CommunityTerritoryType;
  territory_id: string;
  status: CommunityStatus;
  headline: string | null;
  description: string | null;
  launch_message: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  primary_cta_label: string | null;
  secondary_cta_label: string | null;
  is_featured: boolean;
  sort_order: number;
}

function isPublicFallbackResolved(resolved: ResolvedTerritory): boolean {
  return resolved.kind === "location" && resolved.location.metadata?.public_fallback === true;
}

function fallbackFromResolved(resolved: ResolvedTerritory): TerritorialCommunityProfile {
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
  static async getCommunityProfile(resolved: ResolvedTerritory): Promise<TerritorialCommunityProfile> {
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
      const { data, error } = await supabase
        .from("territory_communities" as never)
        .select("*")
        .eq("territory_type", territoryType)
        .eq("territory_id", territoryId)
        .maybeSingle();

      if (!error && data) {
        return data as TerritorialCommunityProfile;
      }
    } catch {
      // fallback handled below
    }

    return fallbackFromResolved(resolved);
  }
}
