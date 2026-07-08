import type { Location, TerritorialGroupWithMembers } from "@/core/location/types";

export const COMMUNITY_STATUS_VALUES = [
  "active",
  "launching",
  "waiting_list",
  "coming_soon",
  "inactive",
] as const;

export type CommunityStatus = (typeof COMMUNITY_STATUS_VALUES)[number];

export const COMMUNITY_ROUTEABLE_TERRITORY_TYPES = [
  "neighborhood",
  "district",
  "territorial_group",
] as const;

export type CommunityRouteableTerritoryType =
  (typeof COMMUNITY_ROUTEABLE_TERRITORY_TYPES)[number];

export const COMMUNITY_PROFILE_TERRITORY_TYPES = [
  "city",
  ...COMMUNITY_ROUTEABLE_TERRITORY_TYPES,
] as const;

export type CommunityTerritoryType =
  (typeof COMMUNITY_PROFILE_TERRITORY_TYPES)[number];

export type CommunityExperienceResolvedTerritory =
  | { kind: "location"; location: Location }
  | { kind: "group"; group: TerritorialGroupWithMembers }
  | null;

export type CommunityPublicAliasTerritoryReference =
  | { kind: "location"; territoryId: string | null | undefined }
  | { kind: "group"; territoryId: string | null | undefined };

export interface CommunityPublicAliasRecord {
  alias?: string;
  territory_community_id?: string;
  status?: string;
}

export interface TerritoryCommunityRecord {
  id?: string;
  name?: string;
  slug?: string;
  city_id?: string | null;
  territory_type?: string;
  territory_id?: string;
  status?: string;
}

export interface CommunitySlugLookup {
  row: TerritoryCommunityRecord | null;
  ambiguous: boolean;
}

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

export function isCommunityRouteableTerritoryType(
  value: string | null | undefined,
): value is CommunityRouteableTerritoryType {
  return COMMUNITY_ROUTEABLE_TERRITORY_TYPES.includes(
    value as CommunityRouteableTerritoryType,
  );
}
