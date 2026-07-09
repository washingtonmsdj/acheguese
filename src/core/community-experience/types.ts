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

export const COMMUNITY_MEMBERSHIP_ROLES = [
  "owner",
  "admin",
  "moderator",
  "member",
] as const;

export type CommunityMembershipRole = (typeof COMMUNITY_MEMBERSHIP_ROLES)[number];

export const COMMUNITY_MEMBERSHIP_STATUSES = [
  "pending",
  "active",
  "rejected",
  "blocked",
] as const;

export type CommunityMembershipStatus = (typeof COMMUNITY_MEMBERSHIP_STATUSES)[number];

export const COMMUNITY_MEMBERSHIP_JOIN_METHODS = [
  "open",
  "approval",
  "invite",
  "residence_verified",
  "admin_created",
] as const;

export type CommunityMembershipJoinMethod =
  (typeof COMMUNITY_MEMBERSHIP_JOIN_METHODS)[number];

export const COMMUNITY_MEMBERSHIP_REQUEST_DEFAULTS = {
  ROLE: "member" as CommunityMembershipRole,
  STATE: "pending" as CommunityMembershipStatus,
  JOIN_METHOD: "open" as CommunityMembershipJoinMethod,
} as const;

export const COMMUNITY_ENTITY_TYPES = [
  "business",
  "event",
  "classified",
  "professional",
  "post",
  "tourist_point",
] as const;

export type CommunityEntityType = (typeof COMMUNITY_ENTITY_TYPES)[number];

export const COMMUNITY_ENTITY_LINK_TYPES = [
  "primary_territory",
  "serves_area",
  "featured",
  "sponsored",
  "member_submitted",
  "official",
] as const;

export type CommunityEntityLinkType = (typeof COMMUNITY_ENTITY_LINK_TYPES)[number];

export const COMMUNITY_ENTITY_LINK_STATUSES = [
  "pending",
  "active",
  "rejected",
  "hidden",
  "expired",
] as const;

export type CommunityEntityLinkStatus =
  (typeof COMMUNITY_ENTITY_LINK_STATUSES)[number];

export const COMMUNITY_ENTITY_LINK_REQUEST_DEFAULTS = {
  LINK_TYPE: "member_submitted" as CommunityEntityLinkType,
  STATE: "pending" as CommunityEntityLinkStatus,
  PRIORITY: 0,
} as const;

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

export interface CommunitySearchResult {
  id: string;
  name: string;
  slug: string;
  city_id: string | null;
  territory_type: CommunityTerritoryType;
  territory_id: string;
  status: CommunityStatus;
  headline: string | null;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
  public_alias: string | null;
}

export interface CommunityMembershipRecord {
  id: string;
  community_id: string;
  profile_id: string;
  user_id: string;
  role: CommunityMembershipRole;
  status: CommunityMembershipStatus;
  join_method: CommunityMembershipJoinMethod;
  verified_by_residence: boolean;
  invited_by_profile_id: string | null;
  approved_by_profile_id: string | null;
  requested_at: string;
  approved_at: string | null;
  joined_at: string | null;
  last_seen_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CommunityMembershipRequestInput {
  communityId: string;
  profileId: string;
  userId: string;
  joinMethod?: Extract<CommunityMembershipJoinMethod, "open" | "approval">;
}

export interface CommunityEntityLinkRecord {
  id: string;
  community_id: string;
  entity_type: CommunityEntityType;
  entity_id: string;
  link_type: CommunityEntityLinkType;
  status: CommunityEntityLinkStatus;
  created_by_profile_id: string | null;
  approved_by_profile_id: string | null;
  approved_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CommunityEntityLinkRequestInput {
  communityId: string;
  entityType: CommunityEntityType;
  entityId: string;
  createdByProfileId: string;
  metadata?: Record<string, unknown>;
}

export interface CommunityEntityLinkListOptions {
  entityTypes?: readonly CommunityEntityType[];
  limit?: number;
}

export function isPersistedCommunityId(
  value: string | null | undefined,
): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export function isCommunityRouteableTerritoryType(
  value: string | null | undefined,
): value is CommunityRouteableTerritoryType {
  return COMMUNITY_ROUTEABLE_TERRITORY_TYPES.includes(
    value as CommunityRouteableTerritoryType,
  );
}
