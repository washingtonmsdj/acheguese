/**
 * Types compartilhados para as sections do ContaHub
 *
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: props explicitas, sem contratos frouxos
 */

import type { NavigateFunction } from "react-router-dom";
import type { MultiProfileRecord } from "@/core/profiles/services/multi-profile/types";
import type {
  ProfileAssociatedBusiness,
  ProfileBusinessModuleSnapshot,
} from "@/core/profiles/services/ProfileBusinessTypes";
import type { VerificationStatus } from "@/modules/profile/components/ResidentVerificationCard";
import type { DriverDataRecord } from "@/core/mobility/types/DriverDataRecord";
export type ProfileSectionId =
  import("@/modules/profile/config/profile-sections.config").ProfileSectionId;

// ============================================
// Base Props (compartilhadas por todas)
// ============================================

export interface BaseSectionProps {
  readonly user: {
    readonly id: string;
    readonly email?: string;
  };
  readonly personalProfile: MultiProfileRecord | null;
  readonly personalProfileId: string | null;
  readonly navigate: NavigateFunction;
  readonly appUrls: any;
  readonly moduleUrls: any;
}

// ============================================
// Operations (metricas de atividade)
// ============================================

export interface Operations {
  readonly posts: number;
  readonly businesses: number;
  readonly services: number;
  readonly classifieds: number;
  readonly ridesTotal: number;
  readonly activeRides: number;
  readonly favoritesGiven: number;
}

// ============================================
// Notifications (alertas e mensagens)
// ============================================

export interface Notifications {
  readonly unread: number;
  readonly highPriority: number;
  readonly urgentPriority: number;
  readonly total: number;
  readonly recent?: readonly {
    readonly id: string;
    readonly title: string;
    readonly type: string;
    readonly createdAt: string;
    readonly read: boolean;
    readonly priority: "low" | "medium" | "high" | "urgent";
  }[];
}

// ============================================
// Stats (estatisticas do perfil)
// ============================================

export interface Stats {
  readonly followers?: number;
  readonly following?: number;
  readonly reportsCount?: number;
  readonly supportsCount?: number;
}

// ============================================
// Identity & Context (dados de reputacao/plano)
// ============================================

export interface Identity {
  readonly plan?: {
    readonly type?: string;
    readonly isPremium?: boolean;
    readonly expiresAt?: string;
  };
  readonly reputation?: {
    readonly score: number;
    readonly level: number;
    readonly rank?: string;
  };
}

export interface Context {
  readonly plan?: {
    readonly type?: string;
    readonly isPremium?: boolean;
    readonly expiresAt?: string;
  };
  readonly reputation?: {
    readonly score: number;
    readonly level: number;
    readonly rank?: string;
  };
}

// ============================================
// Next Actions (acoes sugeridas)
// ============================================

export interface NextAction {
  readonly id?: string;
  readonly label?: string;
  readonly description: string;
  readonly priority?: "high" | "medium" | "low";
  readonly action?: () => void;
  readonly title?: string;
  readonly actionLabel?: string;
  readonly onClick?: () => void;
}

// ============================================
// Ride (corrida ativa)
// ============================================

export interface Ride {
  readonly id: string;
  readonly status: string;
  readonly origin?: string;
  readonly destination?: string;
  readonly driver?: {
    readonly name: string;
    readonly avatar?: string;
  };
}

// ============================================
// Favorite (favoritos)
// ============================================

export interface Favorite {
  readonly id: string;
  readonly type: string;
  readonly item: Record<string, unknown>;
}

export interface BusinessFavoritesState {
  readonly favorites: readonly ProfileAssociatedBusiness[];
  readonly loading: boolean;
}

// ============================================
// Account Snapshot (estado da conta)
// ============================================

export interface AccountSnapshot {
  readonly accountState: "active" | "inactive" | "blocked" | "suspended";
  readonly isBlocked: boolean;
  readonly isSuspended: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly verificationRejectionReason?: string;
}

// ============================================
// Roles (permissoes)
// ============================================

export interface Roles {
  readonly canManageProfileMembers: boolean;
}

// ============================================
// Section Props especificas
// ============================================

export interface ResumoSectionProps extends BaseSectionProps {
  readonly operations: Operations;
  readonly notifications: Notifications;
  readonly stats: Stats;
  readonly nextActions: readonly NextAction[];
  readonly hasActiveRide: boolean;
  readonly activeRide?: Ride;
  readonly driverProfileId: string | null;
  readonly driverData?: DriverDataRecord | null;
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface DadosPessoaisSectionProps extends BaseSectionProps {
  readonly profile: MultiProfileRecord | null;
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly stats: Stats;
  readonly operations: Operations;
  readonly isVerified: boolean;
  readonly verificationStatus: VerificationStatus;
  readonly verificationRejectionReason?: string;
  readonly favorites: BusinessFavoritesState;
  readonly handleBusinessClick: (business: ProfileAssociatedBusiness) => void;
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface EmpresasSectionProps extends BaseSectionProps {
  readonly businessModules: readonly ProfileBusinessModuleSnapshot[];
  readonly showBusinessOnboarding: boolean;
  readonly copyToClipboard: (text: string) => void;
}

export interface MobilidadeSectionProps extends BaseSectionProps {
  readonly hasDriverProfile: boolean;
  readonly driverProfile: MultiProfileRecord | null;
  readonly driverProfileId: string | null;
  readonly driverData: DriverDataRecord | null;
  readonly driverDataLoading: boolean;
  readonly operations: Operations;
  readonly hasActiveRide: boolean;
  readonly activeRide?: Ride;
}

export interface DeliverySectionProps extends BaseSectionProps {
  readonly businessModules: readonly ProfileBusinessModuleSnapshot[];
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface PlanosSectionProps extends BaseSectionProps {
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly businessModules: readonly ProfileBusinessModuleSnapshot[];
}

export interface NotificacoesSectionProps extends BaseSectionProps {
  readonly notifications: Notifications;
}

export interface PreferenciasSectionProps extends BaseSectionProps {
  readonly canManageProfileMembers: boolean;
}

export interface SegurancaSectionProps extends BaseSectionProps {
  readonly profile: MultiProfileRecord | null;
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly account: AccountSnapshot | null;
  readonly roles: any;
  readonly activeProfile: MultiProfileRecord | null;
  readonly stats: Stats;
  readonly verificationStatus: VerificationStatus;
  readonly verificationRejectionReason?: string;
  readonly downloadDataOpen: boolean;
  readonly setDownloadDataOpen: (open: boolean) => void;
  readonly viewDataOpen: boolean;
  readonly setViewDataOpen: (open: boolean) => void;
  readonly deactivateOpen: boolean;
  readonly setDeactivateOpen: (open: boolean) => void;
  readonly deleteOpen: boolean;
  readonly setDeleteOpen: (open: boolean) => void;
  readonly deleteConfirm: string;
  readonly setDeleteConfirm: (value: string) => void;
  readonly handleDownloadData: () => void;
  readonly handleDeactivateAccount: () => void;
  readonly handleDeleteAccount: () => void;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type SectionPropsMap = {
  readonly resumo: ResumoSectionProps;
  readonly "dados-pessoais": DadosPessoaisSectionProps;
  readonly empresas: EmpresasSectionProps;
  readonly mobilidade: MobilidadeSectionProps;
  readonly delivery: DeliverySectionProps;
  readonly planos: PlanosSectionProps;
  readonly notificacoes: NotificacoesSectionProps;
  readonly preferencias: PreferenciasSectionProps;
  readonly seguranca: SegurancaSectionProps;
};
