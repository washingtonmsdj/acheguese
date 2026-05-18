/**
 * Admin profile governance public contracts.
 */

import type {
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { AdminProfilePermissionGovernanceStatus } from "@/core/admin/config/profile-governance";
export type RawRecord = Record<string, unknown>;

export type AdminProfileIdentityIssue =
  | "public_without_username"
  | "public_unverified"
  | "suspended"
  | "inactive"
  | "multi_profile"
  | "missing_preferences";

export type AdminProfileVisibilityFilter = "all" | "public" | "private";

export interface AdminProfileIdentityFilters {
  search?: string;
  profileType?: string;
  visibility?: AdminProfileVisibilityFilter;
  page?: number;
  limit?: number;
}

export interface AdminProfileIdentityStats {
  totalProfiles: number;
  publicProfiles: number;
  privateProfiles: number;
  suspendedProfiles: number;
  missingUsername: number;
  publicWithoutUsername: number;
  multiProfileUsers: number;
  withLinkedEntities: number;
  withUsernameHistory: number;
  withPreferences: number;
  withScopedPreferences: number;
  withNotificationScope: number;
  withExternalReputation: number;
  withMultiOriginReputation: number;
  withResidence: number;
  withVerifiedResidence: number;
}

export interface AdminProfileIdentityRecord {
  id: string;
  userId: string;
  name: string;
  displayName: string | null;
  username: string | null;
  publicUrl: string | null;
  profileType: string;
  city: string | null;
  neighborhood: string | null;
  isPublic: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  reputation: number;
  createdAt: string | null;
  accountProfileCount: number;
  roles: string[];
  activePlan: string;
  subscriptionStatus: string;
  linkedEntityKinds: string[];
  linkedEntityCount: number;
  memberCount: number;
  hasNotificationSettings: boolean;
  usernameHistoryCount: number;
  issues: AdminProfileIdentityIssue[];
}

export interface AdminProfileIdentityListResult {
  data: AdminProfileIdentityRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminProfileLinkedEntitySummary {
  kind: "business" | "professional" | "driver";
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  verified: boolean;
  publicUrl: string | null;
  metadata: string[];
}

export interface AdminProfileIdentitySiblingProfile {
  id: string;
  name: string;
  username: string | null;
  profileType: string;
  isPublic: boolean;
  isActive: boolean;
  isSuspended: boolean;
}

export interface AdminProfileIdentityRoleSummary {
  id: string;
  role: string;
  isActive: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
}

export interface AdminProfileIdentitySubscriptionSummary {
  id: string;
  planType: string;
  status: string;
  active: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  amountCents: number;
}

export interface AdminProfileIdentityMemberSummary {
  id: string;
  userId: string;
  role: string;
  joinedAt: string | null;
  invitedBy: string | null;
}

export interface AdminProfileIdentityAuthSummary {
  email: string | null;
  phone: string | null;
  emailConfirmed: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface AdminProfileIdentityEffectiveContext {
  profileId: string;
  status: ProfileStatus;
  permissions: ProfilePermissions;
  plan: ProfilePlan;
  reputation: ProfileReputation;
  verified: boolean;
}

export interface AdminProfileResidenceSummary {
  id: string;
  locationId: string;
  locationName: string | null;
  addressLine: string | null;
  postalCode: string | null;
  country: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verificationRequestedAt: string | null;
  status: "verified" | "pending_verification" | "unverified";
}

export type AdminProfileFamilyCoverageStatus =
  | "available"
  | "empty"
  | "untracked";

export interface AdminProfileFamilySummary {
  status: AdminProfileFamilyCoverageStatus;
  activeChildrenCount: number;
  activeParentsCount: number;
  pendingInvitesCount: number;
  relationshipTypes: string[];
  notes: string[];
}

export type AdminProfilePreferenceScope =
  | "public_profile"
  | "linked_entities"
  | "reputation_visibility"
  | "notifications";

export type AdminProfilePreferenceFieldState =
  | "enabled"
  | "disabled"
  | "unset"
  | "not_applicable";

export interface AdminProfilePreferenceFieldSummary {
  key: string;
  label: string;
  value: boolean | null;
  state: AdminProfilePreferenceFieldState;
}

export interface AdminProfilePreferenceScopeSummary {
  scope: AdminProfilePreferenceScope;
  label: string;
  status: "configured" | "partial" | "missing";
  configuredFields: number;
  applicableFields: number;
  totalFields: number;
  fields: AdminProfilePreferenceFieldSummary[];
}

export type AdminProfileReputationOrigin =
  | "profile_aggregate"
  | "passenger_mobility"
  | "driver_mobility"
  | "business_reviews"
  | "professional_reviews";

export type AdminProfileReputationStatus =
  | "canonical"
  | "derived"
  | "legacy"
  | "missing";

export interface AdminProfileReputationSourceSummary {
  origin: AdminProfileReputationOrigin;
  label: string;
  status: AdminProfileReputationStatus;
  score: number | null;
  volume: number;
  visibility: "public" | "private" | "internal";
  notes: string[];
}

export interface AdminProfilePermissionActionSummary {
  action: string;
  status: "allowed" | "denied" | "requiresTarget";
}

export interface AdminProfilePermissionGovernanceSummary {
  status: AdminProfilePermissionGovernanceStatus;
  sourceRoles: string[];
  sourceMembershipRoles: string[];
  allowedActions: number;
  deniedActions: number;
  targetDependentActions: number;
  actionMatrix: AdminProfilePermissionActionSummary[];
  notes: string[];
}

export interface AdminProfileIdentityDetail {
  profile: AdminProfileIdentityRecord;
  auth: AdminProfileIdentityAuthSummary | null;
  roles: AdminProfileIdentityRoleSummary[];
  subscription: AdminProfileIdentitySubscriptionSummary | null;
  usernameHistory: Array<{
    id: string;
    old_username: string;
    new_username: string;
    change_reason: string;
    changed_at: string;
  }>;
  members: AdminProfileIdentityMemberSummary[];
  linkedEntities: AdminProfileLinkedEntitySummary[];
  siblingProfiles: AdminProfileIdentitySiblingProfile[];
  notificationSettings: Record<string, unknown> | null;
  effectiveContext: AdminProfileIdentityEffectiveContext | null;
  preferenceScopes: AdminProfilePreferenceScopeSummary[];
  reputationSources: AdminProfileReputationSourceSummary[];
  residence: AdminProfileResidenceSummary | null;
  family: AdminProfileFamilySummary;
  permissionGovernance: AdminProfilePermissionGovernanceSummary | null;
}
