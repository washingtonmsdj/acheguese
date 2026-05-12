/**
 * Types compartilhados para as sections do PerfilHub
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { MultiProfileRecord } from "@/core/profiles/services/multi-profile/types";
import type { ProfileBusinessModuleItem } from "@/core/profiles/services/types";
import type { AppUrls } from "@/core/routing/types";
import type { Tables } from "@/integrations/supabase/types.generated";
import type { ProfileSectionId } from "@/modules/profile/config/profile-sections.config";

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
  readonly appUrls: AppUrls;
  readonly moduleUrls: Record<string, string>;
}

// ============================================
// Operations (métricas de atividade)
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
  readonly recent?: readonly Record<string, unknown>[];
}

// ============================================
// Stats (estatísticas do perfil)
// ============================================

export interface Stats {
  readonly followers?: number;
  readonly following?: number;
  readonly reportsCount?: number;
  readonly supportsCount?: number;
}

// ============================================
// Identity & Context (dados de reputação/plano)
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
// Next Actions (ações sugeridas)
// ============================================

export interface NextAction {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly priority: "high" | "medium" | "low";
  readonly action: () => void;
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

// ============================================
// Account Snapshot (estado da conta)
// ============================================

export interface AccountSnapshot {
  readonly accountState: "active" | "inactive" | "blocked" | "suspended";
  readonly isBlocked: boolean;
  readonly isSuspended: boolean;
  readonly verificationStatus: string;
  readonly verificationRejectionReason?: string;
}

// ============================================
// Roles (permissões)
// ============================================

export interface Roles {
  readonly canManageProfileMembers: boolean;
}

// ============================================
// Section Props Específicas
// ============================================

export interface ResumoSectionProps extends BaseSectionProps {
  readonly operations: Operations;
  readonly notifications: Notifications;
  readonly stats: Stats;
  readonly nextActions: readonly NextAction[]; 
  readonly hasActiveRide: boolean;
  readonly activeRide?: Ride;
  readonly driverProfileId: string | null;
  readonly driverData?: Tables<"driver_data"> | null;
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface DadosPessoaisSectionProps extends BaseSectionProps {
  readonly profile: MultiProfileRecord | null;
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly stats: Stats;
  readonly operations: Operations;
  readonly isVerified: boolean;
  readonly verificationStatus: string;
  readonly verificationRejectionReason?: string;
  readonly favorites: readonly Favorite[];
  readonly handleBusinessClick: (id: string) => void;
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface EmpresasSectionProps extends BaseSectionProps {
  readonly businessModules: readonly ProfileBusinessModuleItem[];
  readonly showBusinessOnboarding: boolean;
  readonly handleBusinessClick: (id: string) => void;
  readonly copyToClipboard: (text: string) => void;
}

export interface MobilidadeSectionProps extends BaseSectionProps {
  readonly hasDriverProfile: boolean;
  readonly driverProfile: MultiProfileRecord | null;
  readonly driverProfileId: string | null;
  readonly driverData: Tables<"driver_data"> | null;
  readonly driverDataLoading: boolean;
  readonly operations: Operations;
  readonly hasActiveRide: boolean;
  readonly activeRide?: Ride;
}

export interface DeliverySectionProps extends BaseSectionProps {
  readonly businessModules: readonly ProfileBusinessModuleItem[]; 
  readonly setActiveSection: (section: ProfileSectionId) => void;
}

export interface PlanosSectionProps extends BaseSectionProps {
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly businessModules: readonly ProfileBusinessModuleItem[];
}

export interface NotificacoesSectionProps extends BaseSectionProps {
  readonly notifications: Notifications;
}

export interface ConfiguracoesSectionProps extends BaseSectionProps {
  readonly canManageProfileMembers: boolean;
}

export interface SegurancaSectionProps extends BaseSectionProps {
  readonly profile: MultiProfileRecord | null;
  readonly identity: Identity | null;
  readonly context: Context | null;
  readonly account: AccountSnapshot | null;
  readonly roles: Roles;
  readonly activeProfile: MultiProfileRecord | null;
  readonly stats: Stats;
  readonly verificationStatus: string;
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

export type ProfileSectionId =
  | "resumo"
  | "dados-pessoais"
  | "empresas"
  | "mobilidade"
  | "delivery"
  | "planos"
  | "notificacoes"
  | "configuracoes"
  | "seguranca";

export type SectionPropsMap = {
  readonly resumo: ResumoSectionProps;
  readonly "dados-pessoais": DadosPessoaisSectionProps;
  readonly empresas: EmpresasSectionProps;
  readonly mobilidade: MobilidadeSectionProps;
  readonly delivery: DeliverySectionProps;
  readonly planos: PlanosSectionProps;
  readonly notificacoes: NotificacoesSectionProps;
  readonly configuracoes: ConfiguracoesSectionProps;
  readonly seguranca: SegurancaSectionProps;
};
