/**
 * Types compartilhados para AdminMotoristas
 * 
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { LucideIcon } from "lucide-react";
import type { ProfileContext } from "@/core/profiles/views/ProfileContext";

// ============================================
// Driver
// ============================================

export interface DriverRequest {
  readonly id: string;
  readonly profile_id: string;
  readonly name: string;
  readonly avatar_url?: string;
  readonly vehicle_plate: string;
  readonly vehicle_model: string;
  readonly vehicle_year: number;
  readonly cnh_image_url?: string;
  readonly profileContext?: ProfileContext;
  readonly is_online: boolean;
  readonly subscription_plan: string;
  readonly rating: number;
  readonly total_rides: number;
  readonly total_earnings: number;
  readonly created_at: string;
  readonly updated_at?: string;
  readonly neighborhood?: string;
  readonly city?: string;
  readonly verification_status?: "pending" | "verified" | "rejected" | "none" | null;
  readonly verification_rejection_reason?: string | null;
  readonly is_suspended?: boolean;
  readonly suspended_at?: string | null;
  readonly suspended_until?: string | null;
  readonly suspension_reason?: string | null;
}

// ============================================
// Suspension History
// ============================================

export interface SuspensionHistoryEntry {
  readonly id: string;
  readonly action:
    | "approved"
    | "rejected"
    | "suspended"
    | "reactivated"
    | "set_online"
    | "set_offline";
  readonly reason?: string;
  readonly admin_name: string;
  readonly created_at: string;
}

// ============================================
// Filter
// ============================================

export type FilterStatus = "all" | "pending" | "approved" | "rejected";

// ============================================
// Stats
// ============================================

export interface DriverStats {
  readonly total: number;
  readonly pending: number;
  readonly approved: number;
  readonly online: number;
  readonly totalRides: number;
  readonly totalEarnings: number;
}

export interface StatItem {
  readonly label: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly color: string;
}

// ============================================
// Confirm Dialog
// ============================================

export interface ConfirmDialogState {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly action: () => void;
  readonly variant?: "default" | "destructive";
}

// ============================================
// Driver Actions
// ============================================

export interface DriverActions {
  readonly onReview: (driver: DriverRequest) => void;
  readonly onToggleOnline: (driver: DriverRequest) => void;
  readonly onSuspend: (driver: DriverRequest) => void;
  readonly onReactivate: (driver: DriverRequest) => void;
  readonly onViewHistory: (driverProfileId: string) => void;
}

// ============================================
// Section Props
// ============================================

export type AdminMotoristasHeaderSectionProps = {
  readonly _sectionId?: "admin-motoristas-header";
};

export interface AdminMotoristasStatsSectionProps {
  readonly stats: DriverStats;
}

export interface AdminMotoristasFiltersSectionProps {
  readonly filter: FilterStatus;
  readonly onFilterChange: (filter: FilterStatus) => void;
  readonly search: string;
  readonly onSearchChange: (search: string) => void;
}

export interface AdminMotoristasListSectionProps {
  readonly drivers: readonly DriverRequest[];
  readonly actions: DriverActions;
}

export interface AdminMotoristasEmptySectionProps {
  readonly filter: FilterStatus;
}

export interface AdminMotoristasTabsSectionProps {
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
  readonly drivers: readonly DriverRequest[];
}

// ============================================
// Component Props
// ============================================

export interface StatCardProps {
  readonly stat: StatItem;
}

export interface DriverCardProps {
  readonly driver: DriverRequest;
  readonly actions: DriverActions;
}

export interface DriverInfoCardProps {
  readonly driver: DriverRequest;
}

export interface DriverReviewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly driver: DriverRequest | null;
  readonly rejectionReason: string;
  readonly onRejectionReasonChange: (reason: string) => void;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly processing: boolean;
}

export interface ConfirmationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly variant?: "default" | "destructive";
  readonly processing: boolean;
}

export interface SuspensionHistoryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly history: readonly SuspensionHistoryEntry[];
  readonly loading: boolean;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type AdminMotoristasSectionId =
  | "header"
  | "stats"
  | "filters"
  | "list"
  | "empty"
  | "tabs";

export type SectionPropsMap = {
  readonly header: AdminMotoristasHeaderSectionProps;
  readonly stats: AdminMotoristasStatsSectionProps;
  readonly filters: AdminMotoristasFiltersSectionProps;
  readonly list: AdminMotoristasListSectionProps;
  readonly empty: AdminMotoristasEmptySectionProps;
  readonly tabs: AdminMotoristasTabsSectionProps;
};
