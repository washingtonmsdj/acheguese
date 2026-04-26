/**
 * Types compartilhados para as sections de Admin Territory Management
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { TerritoryNodeStatus } from "@/modules/admin/constants/territory";

// ============================================
// Territory Node (do hook)
// ============================================

export interface TerritoryNode {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly type: "country" | "state" | "city" | "district" | "territorial_group";
  readonly status: TerritoryNodeStatus;
  readonly parent_id: string | null;
  readonly geographic_path?: string;
  readonly is_selector_active: boolean;
  readonly is_landing_enabled: boolean;
  readonly is_navigable: boolean;
  readonly member_ids?: readonly string[];
  readonly member_count?: number;
  readonly children?: TerritoryNode[];
}

// ============================================
// Filter State
// ============================================

export interface FilterState {
  readonly active: boolean | null; // null = todos, true = ativos, false = inativos
  readonly type: "all" | "locations" | "groups";
}

// ============================================
// Duplicate Detection
// ============================================

export interface VisualDuplicate {
  readonly name: string;
  readonly type: string;
  readonly count: number;
  readonly locations: readonly TerritoryNode[];
}

export interface SlugDuplicate {
  readonly slug: string;
  readonly count: number;
}

// ============================================
// Stats
// ============================================

export interface TerritoryStats {
  readonly activeCount: number;
  readonly locationsCount: number;
  readonly groupsCount: number;
}

// ============================================
// Type Config (para visualizações)
// ============================================

export interface TypeConfig {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly color: string;
  readonly bgClass: string;
  readonly textClass: string;
  readonly borderClass: string;
}

// ============================================
// Base Props
// ============================================

export interface BaseSectionProps {
  readonly navigate?: NavigateFunction;
}

// ============================================
// Section Props Específicas
// ============================================

export interface AdminTerritoryHeaderSectionProps extends BaseSectionProps {
  readonly onNewGroup: () => void;
}

export interface AdminTerritoryStatsSectionProps extends BaseSectionProps {
  readonly stats: TerritoryStats;
  readonly filterState: FilterState;
  readonly onFilterChange: (filter: Partial<FilterState>) => void;
}

export interface AdminTerritoryFiltersSectionProps extends BaseSectionProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly filterState: FilterState;
  readonly onClearFilters: () => void;
}

export interface AdminTerritoryAlertsSectionProps extends BaseSectionProps {
  readonly visualDuplicates: readonly VisualDuplicate[];
  readonly slugDuplicates: readonly SlugDuplicate[];
}

export interface AdminTerritoryViewSectionProps extends BaseSectionProps {
  readonly filterState: FilterState;
  readonly searchQuery: string;
  readonly locations: readonly TerritoryNode[];
  readonly groups: readonly TerritoryNode[];
  readonly groupMembers: Map<string, string[]>;
  readonly isToggling: boolean;
  readonly onToggleLocation: (id: string, current: boolean) => void;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onToggleLocationFlag: (id: string, flag: string, current: boolean) => void;
  readonly onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
}

// ============================================
// Tree Node Props
// ============================================

export interface TerritoryTreeNodeProps {
  readonly node: TerritoryNode;
  readonly groups: readonly TerritoryNode[];
  readonly groupMembers: Map<string, string[]>;
  readonly allLocations: readonly TerritoryNode[];
  readonly depth?: number;
  readonly searchQuery: string;
  readonly onToggleLocation: (id: string, current: boolean) => void;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
  readonly onToggleLocationFlag: (id: string, flag: string, current: boolean) => void;
  readonly onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
  readonly isToggling: boolean;
}

export interface TerritorialGroupNodeProps {
  readonly group: TerritoryNode;
  readonly allLocations: readonly TerritoryNode[];
  readonly depth: number;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
  readonly onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
  readonly isToggling: boolean;
}

// ============================================
// View Props
// ============================================

export interface HierarchyViewProps {
  readonly tree: readonly TerritoryNode[];
  readonly groups: readonly TerritoryNode[];
  readonly groupMembers: Map<string, string[]>;
  readonly allLocations: readonly TerritoryNode[];
  readonly searchQuery: string;
  readonly isToggling: boolean;
  readonly onToggleLocation: (id: string, current: boolean) => void;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
  readonly onToggleLocationFlag: (id: string, flag: string, current: boolean) => void;
  readonly onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
}

export interface GroupsViewProps {
  readonly groups: readonly TerritoryNode[];
  readonly allLocations: readonly TerritoryNode[];
  readonly isToggling: boolean;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
}

export interface LocationsViewProps {
  readonly locations: readonly TerritoryNode[];
  readonly allLocations: readonly TerritoryNode[];
  readonly isToggling: boolean;
  readonly onToggleLocation: (id: string, current: boolean) => void;
}

// ============================================
// Card Props
// ============================================

export interface StatsCardProps {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly activeLabel?: string;
  readonly color?: string;
}

export interface GroupCardProps {
  readonly group: TerritoryNode;
  readonly memberLocations: readonly TerritoryNode[];
  readonly anchorCity?: TerritoryNode;
  readonly isToggling: boolean;
  readonly onToggleGroup: (id: string, current: boolean) => void;
  readonly onEditGroup: (group: TerritoryNode) => void;
}

export interface LocationCardProps {
  readonly location: TerritoryNode;
  readonly parent?: TerritoryNode;
  readonly typeConfig: TypeConfig;
  readonly isToggling: boolean;
  readonly onToggleLocation: (id: string, current: boolean) => void;
}

// ============================================
// Dialog Props
// ============================================

export interface GroupFormDialogProps {
  readonly open: boolean;
  readonly editingGroup: TerritoryNode | null;
  readonly onClose: () => void;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type AdminTerritorySectionId =
  | "header"
  | "stats"
  | "filters"
  | "alerts"
  | "view";

export type SectionPropsMap = {
  readonly header: AdminTerritoryHeaderSectionProps;
  readonly stats: AdminTerritoryStatsSectionProps;
  readonly filters: AdminTerritoryFiltersSectionProps;
  readonly alerts: AdminTerritoryAlertsSectionProps;
  readonly view: AdminTerritoryViewSectionProps;
};
