/**
 * Admin Identidade - Types (SSOT)
 * 
 * Single Source of Truth para todos os tipos do módulo Admin Identidade
 * 
 * REFATORAÇÃO: AdminIdentidade.tsx (882 linhas)
 * Sem gambiarras: Tipos centralizados e reutilizáveis
 */

import type { LucideIcon } from "lucide-react";
import type {
  AdminProfileFamilySummary,
  AdminProfileIdentityDetail,
  AdminProfileIdentityIssue,
  AdminProfilePreferenceFieldSummary,
  AdminProfilePreferenceScopeSummary,
  AdminProfilePermissionGovernanceSummary,
  AdminProfileReputationSourceSummary,
  AdminProfileResidenceSummary,
} from "@/core/admin";

// ============================================
// Profile Types
// ============================================

export interface ProfileListItem {
  readonly id: string;
  readonly name: string;
  readonly profileType: string;
  readonly username?: string;
  readonly isPublic: boolean;
  readonly isActive: boolean;
  readonly isSuspended: boolean;
  readonly isVerified: boolean;
  readonly activePlan: string;
  readonly roles: readonly string[];
  readonly accountProfileCount: number;
  readonly linkedEntityCount: number;
  readonly usernameHistoryCount: number;
  readonly issues: readonly AdminProfileIdentityIssue[];
}

export interface ProfileStats {
  readonly totalProfiles: number;
  readonly publicProfiles: number;
  readonly privateProfiles: number;
  readonly publicWithoutUsername: number;
  readonly missingUsername: number;
  readonly multiProfileUsers: number;
  readonly withLinkedEntities: number;
  readonly withResidence: number;
  readonly withVerifiedResidence: number;
  readonly withScopedPreferences: number;
  readonly withNotificationScope: number;
  readonly withExternalReputation: number;
  readonly withMultiOriginReputation: number;
}

export interface ProfileFilters {
  readonly search: string;
  readonly profileType: string;
  readonly visibility: "all" | "public" | "private";
  readonly page: number;
}

// ============================================
// Section Props
// ============================================

export interface AdminIdentidadeHeaderSectionProps {}

export interface AdminIdentidadeStatsSectionProps {
  readonly stats: ProfileStats | null | undefined;
  readonly loading: boolean;
  readonly error: boolean;
}

export interface AdminIdentidadeFiltersSectionProps {
  readonly search: string;
  readonly profileType: string;
  readonly visibility: string;
  readonly onSearchChange: (value: string) => void;
  readonly onProfileTypeChange: (value: string) => void;
  readonly onVisibilityChange: (value: string) => void;
  readonly onClear: () => void;
}

export interface AdminIdentidadeTableSectionProps {
  readonly profiles: readonly ProfileListItem[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly onPageChange: (page: number) => void;
  readonly onSelectProfile: (profileId: string) => void;
  readonly onRetry: () => void;
}

export interface AdminIdentidadeDetailDialogProps {
  readonly open: boolean;
  readonly profileId: string | null;
  readonly detail: AdminProfileIdentityDetail | null | undefined;
  readonly loading: boolean;
  readonly error: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRetry: () => void;
}

// ============================================
// Card Props
// ============================================

export interface IdentityCardProps {
  readonly detail: AdminProfileIdentityDetail;
}

export interface GovernanceCardProps {
  readonly detail: AdminProfileIdentityDetail;
}

export interface LinkedEntitiesCardProps {
  readonly entities: readonly AdminProfileIdentityDetail["linkedEntities"];
}

export interface UsernameHistoryCardProps {
  readonly history: readonly AdminProfileIdentityDetail["usernameHistory"];
}

export interface SecondaryEntitiesCardProps {
  readonly residence: AdminProfileResidenceSummary | null;
  readonly family: AdminProfileFamilySummary;
}

export interface ReputationSourcesCardProps {
  readonly sources: readonly AdminProfileReputationSourceSummary[];
}

export interface PreferenceScopesCardProps {
  readonly scopes: readonly AdminProfilePreferenceScopeSummary[];
}

export interface EffectivePermissionsCardProps {
  readonly permissionGovernance: AdminProfilePermissionGovernanceSummary | null;
}

// ============================================
// Badge Props
// ============================================

export interface IssueBadgeProps {
  readonly issue: AdminProfileIdentityIssue;
}

export interface StatusBadgeProps {
  readonly profile: {
    readonly isPublic: boolean;
    readonly isActive: boolean;
    readonly isSuspended: boolean;
    readonly isVerified: boolean;
  };
}

export interface PlanBadgeProps {
  readonly plan: string;
}

export interface PreferenceScopeBadgeProps {
  readonly scope: AdminProfilePreferenceScopeSummary;
}

export interface PreferenceFieldBadgeProps {
  readonly field: AdminProfilePreferenceFieldSummary;
}

export interface ReputationSourceBadgeProps {
  readonly source: AdminProfileReputationSourceSummary;
}

export interface ReputationVisibilityBadgeProps {
  readonly source: AdminProfileReputationSourceSummary;
}

export interface ResidenceStatusBadgeProps {
  readonly residence: AdminProfileResidenceSummary | null;
}

export interface FamilyStatusBadgeProps {
  readonly family: AdminProfileFamilySummary;
}

export interface PermissionGovernanceBadgeProps {
  readonly permissionGovernance: AdminProfilePermissionGovernanceSummary | null;
}

export interface PermissionActionBadgeProps {
  readonly status: AdminProfilePermissionGovernanceSummary["actionMatrix"][number]["status"];
}

// ============================================
// Layout Props
// ============================================

export interface AdminIdentidadeLayoutProps {
  readonly children: React.ReactNode;
}

// ============================================
// Re-exports
// ============================================

export type {
  AdminProfileFamilySummary,
  AdminProfileIdentityDetail,
  AdminProfileIdentityIssue,
  AdminProfilePreferenceFieldSummary,
  AdminProfilePreferenceScopeSummary,
  AdminProfilePermissionGovernanceSummary,
  AdminProfileReputationSourceSummary,
  AdminProfileResidenceSummary,
};
