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

export function isCommunityRouteableTerritoryType(
  value: string | null | undefined,
): value is CommunityRouteableTerritoryType {
  return COMMUNITY_ROUTEABLE_TERRITORY_TYPES.includes(
    value as CommunityRouteableTerritoryType,
  );
}
