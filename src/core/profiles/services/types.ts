/**
 * Profile Service Types — Hub de compatibilidade (Fase 4)
 *
 * ⚠️ ARQUIVO DE COMPATIBILIDADE — não adicionar tipos novos aqui.
 *
 * Os tipos foram movidos para arquivos com responsabilidade explícita:
 *
 * | Tipo canônico                  | Arquivo canônico                                      |
 * |-------------------------------|-------------------------------------------------------|
 * | ProfileStatus                 | contracts/ProfileRuntimeContracts.ts                  |
 * | ProfilePermissions            | contracts/ProfileRuntimeContracts.ts                  |
 * | ProfilePlan                   | contracts/ProfileRuntimeContracts.ts                  |
 * | ProfileReputation             | contracts/ProfileRuntimeContracts.ts                  |
 * | ProfileAssociatedBusiness     | services/ProfileBusinessTypes.ts                      |
 * | ProfileBusinessModuleSnapshot | services/ProfileBusinessTypes.ts                      |
 * | ProfileActivityStats          | services/ProfileOperationTypes.ts                     |
 * | ProfileContext                | views/ProfileContext.ts                               |
 * | Profile (entidade)            | domain/Profile.ts                                     |
 * | ProfileSummary                | views/ProfileSummary.ts                               |
 * | ProfileAccountSnapshot        | views/ProfileAccountSnapshot.ts                       |
 * | ProfileLikeActivityRecord     | views/ProfileActivityRecords.ts                       |
 * | ProfileSaveActivityRecord     | views/ProfileActivityRecords.ts                       |
 * | ProfilePollVoteActivityRecord | views/ProfileActivityRecords.ts                       |
 *
 * Aliases abaixo mantêm compatibilidade com código existente.
 * Novos imports desses nomes são bloqueados pelo ESLint (.eslintrc-profile-rules.json).
 */

// ── Re-exports canônicos ──────────────────────────────────────────────────

export type {
  ProfileStatus,
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  PlanType,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";

export type {
  ProfileAssociatedBusiness,
  ProfileBusinessModuleSnapshot,
  ProfileBusinessSubscriptionSnapshot,
  ProfileBusinessGastronomySnapshot,
  ProfileBusinessQrSnapshot,
} from "./ProfileBusinessTypes";

export type {
  ProfileActivityStats,
  ProfilePrivacySettingsInput,
} from "./ProfileOperationTypes";

export type { ProfileContext } from "@/core/profiles/views/ProfileContext";

// ── Aliases de compatibilidade (@deprecated) ─────────────────────────────
// Bloqueados para código novo via .eslintrc-profile-rules.json

/**
 * @deprecated Use ProfileAssociatedBusiness de @/core/profiles/services/ProfileBusinessTypes
 */
export type { ProfileAssociatedBusiness as Business } from "./ProfileBusinessTypes";

/**
 * @deprecated Use ProfileBusinessModuleSnapshot de @/core/profiles/services/ProfileBusinessTypes
 */
export type { ProfileBusinessModuleSnapshot as ProfileBusinessModuleItem } from "./ProfileBusinessTypes";

/**
 * @deprecated Use ProfileActivityStats de @/core/profiles/services/ProfileOperationTypes
 */
export type { ProfileActivityStats as ProfileStats } from "./ProfileOperationTypes";

// ── Tipos de operação do service (sem equivalente canônico ainda) ─────────
// Estes tipos são usados internamente pelo ProfileService e não têm
// equivalente canônico fora de services/. Permanecem aqui até Fase 5.

export type ProfileType =
  | "personal"
  | "driver"
  | "business"
  | "professional"
  | "community";

/** @deprecated Tipo legado — não usar em código novo */
export type LegacyProfileType = "personal" | "company" | "service";

export type ProfileVerificationStatusValue =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

/**
 * @deprecated Use Profile de @/core/profiles/domain/Profile
 * Mantido porque ProfileService ainda usa internamente (snake_case do banco).
 */
export interface Profile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  name: string;
  display_name: string;
  username: string;
  type?: LegacyProfileType;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city: string;
  neighborhood?: string;
  state?: string;
  location_id?: string;
  street?: string;
  public_location_visibility?: "hidden" | "city_only" | "district";
  verified: boolean;
  is_verified?: boolean;
  reputation: number;
  is_active: boolean;
  is_suspended?: boolean;
  suspended?: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  suspended_until?: string;
  alert_banned?: boolean;
  is_verified_resident?: boolean;
  verified_at?: string;
  pontos?: number;
  telefone?: string;
  phone?: string;
  whatsapp?: string;
  badges?: string[];
  author_profile_id?: string;
  is_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  allow_messages?: boolean;
  show_activity?: boolean;
  show_businesses?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use CreateProfileInput de @/core/profiles/operations/CreateProfileInput */
export interface CreateProfileData {
  profile_type: ProfileType;
  name: string;
  display_name?: string;
  username: string;
  city: string;
  type?: LegacyProfileType;
  bio?: string;
  avatar_url?: string;
  neighborhood?: string;
  street?: string;
  public_location_visibility?: "hidden" | "city_only" | "district";
}

/** @deprecated Use UpdateProfileInput de @/core/profiles/operations/UpdateProfileInput */
export interface UpdateProfileData {
  name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  telefone?: string;
  whatsapp?: string;
  phone?: string;
  state?: string;
  location_id?: string;
  reputation?: number;
  suspended?: boolean;
  suspended_until?: string | null;
  is_verified_resident?: boolean;
  is_suspended?: boolean;
  pontos?: number;
  is_verified?: boolean;
  verified?: boolean;
  verified_at?: string | null;
  active_ride_id?: string | null;
  [key: string]: unknown;
}

export class ProfileError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ProfileError";
    this.code = code;
    this.status = status;
  }
}

export interface BannedUser {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  banned_until?: string;
  banned_by?: string;
  is_permanent: boolean;
  created_at: string;
}

/** @deprecated Use ProfileSummary de @/core/profiles/views/ProfileSummary */
export interface ProfileSummary {
  id: string;
  userId?: string;
  name: string;
  avatarUrl?: string;
  verified: boolean;
}

/** @deprecated Use ProfileSummaryExtended de @/core/profiles/views/ProfileSummary */
export interface ProfileSummaryExtended extends ProfileSummary {
  neighborhood?: string;
  whatsapp?: string;
}

export interface AdminProfileListItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  verified: boolean;
  suspended: boolean;
  createdAt: string;
  profileType: ProfileType;
}

export interface BasePermissions {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
}

export interface AdminFilters {
  suspended?: boolean;
  verified?: boolean;
  profileType?: ProfileType;
  limit?: number;
}

export interface ProfileEffectivePermission {
  key: string;
  label: string;
  allowed: boolean;
}

export interface ProfileIdentitySnapshot {
  profileId: string;
  profileType: ProfileType;
  displayName: string;
  username: string;
  isPublic: boolean;
  verified: boolean;
  territoryLabel: string | null;
  locationId?: string;
  status: import("@/core/profiles/contracts/ProfileRuntimeContracts").ProfileStatus;
  plan: import("@/core/profiles/contracts/ProfileRuntimeContracts").ProfilePlan;
  reputation: import("@/core/profiles/contracts/ProfileRuntimeContracts").ProfileReputation;
  permissions: ProfileEffectivePermission[];
}

export interface ProfileOperationsCounts {
  managedProfiles: number;
  businesses: number;
  services: number;
  classifieds: number;
  posts: number;
  events: number;
  alerts: number;
  issues: number;
  favoritesGiven: number;
  favoritesReceived: number;
  notificationsTotal: number;
  notificationsUnread: number;
  ridesTotal: number;
  activeRides: number;
}

export interface ProfileManagedAssetItem {
  id: string;
  kind: "business" | "service" | "classified" | "event" | "alert" | "issue";
  title: string;
  status: string;
  updatedAt?: string;
}

export interface ProfileNotificationItem {
  id: string;
  type: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  read: boolean;
  createdAt: string;
}

export interface ProfileNotificationsSnapshot {
  total: number;
  unread: number;
  highPriority: number;
  urgentPriority: number;
  recent: ProfileNotificationItem[];
}

export interface ProfilePrivateWorkspace {
  profile: Profile | null;
  context: import("@/core/profiles/views/ProfileContext").ProfileContext | null;
  identity: ProfileIdentitySnapshot | null;
  account: import("@/core/profiles/views/ProfileAccountSnapshot").ProfileAccountSnapshot;
  stats: ProfileActivityStats;
  operations: ProfileOperationsCounts;
  managedAssets: ProfileManagedAssetItem[];
  notifications: ProfileNotificationsSnapshot;
  roles: string[];
  businesses: ProfileAssociatedBusiness[];
  businessModules: ProfileBusinessModuleSnapshot[];
  activeRide: unknown | null;
  hasActiveRide: boolean;
  verificationStatus: ProfileVerificationStatusValue;
  verificationRejectionReason?: string;
}

// ── Activity records (deprecated — use views/ProfileActivityRecords) ──────

/** @deprecated Use ProfileLikeActivityRecord de @/core/profiles/views/ProfileActivityRecords */
export interface ProfileActivityAuthorSummary {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

/** @deprecated Use ProfileLikeActivityRecord de @/core/profiles/views/ProfileActivityRecords */
export interface ProfileActivityPostSummary {
  id: string;
  type: string | null;
  content: string | null;
  author: ProfileActivityAuthorSummary | null;
}

/** @deprecated Use ProfileLikeActivityRecord de @/core/profiles/views/ProfileActivityRecords */
export interface ProfileLikeActivityRecord {
  id: string;
  created_at: string;
  post: ProfileActivityPostSummary | null;
}

/** @deprecated Use ProfileSaveActivityRecord de @/core/profiles/views/ProfileActivityRecords */
export interface ProfileSaveActivityRecord {
  id: string;
  created_at: string;
  post: ProfileActivityPostSummary | null;
}

export interface ProfilePollOptionRecord {
  id: string;
  text: string | null;
}

export interface ProfilePollActivitySummary {
  id: string;
  question: string | null;
  options: ProfilePollOptionRecord[] | null;
  post_id: string | null;
}

/** @deprecated Use ProfilePollVoteActivityRecord de @/core/profiles/views/ProfileActivityRecords */
export interface ProfilePollVoteActivityRecord {
  id: string;
  option_id: string;
  created_at: string;
  poll: ProfilePollActivitySummary | null;
}
