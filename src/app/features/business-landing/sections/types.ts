/**
 * Types compartilhados para as sections de Empresas Landing Page
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

// ============================================
// Business
// ============================================

export interface Business {
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
  readonly category: string;
  readonly subcategoria?: string;
  readonly rating: number;
  readonly reviews: number;
  readonly distance: string;
  readonly walkTime: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly premium: boolean;
  readonly isOpen: boolean;
  readonly neighborRecs: number;
  readonly lastVisit: string;
  readonly coords: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly website?: string;
  readonly is_premium?: boolean;
  readonly is_verified?: boolean;
  readonly geographic_path?: string | null;
  readonly horario_funcionamento?: Record<
    string,
    { open: string; close: string; closed?: boolean } | { closed: true; open?: string; close?: string }
  >;
  readonly formas_pagamento?: readonly string[];
  readonly especialidades?: readonly string[];
  readonly facilidades?: readonly string[];
  readonly modos_atendimento?: readonly string[];
  readonly distanceMeters?: number;
}

// ============================================
// Category
// ============================================

export interface Category {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly count: string;
  readonly iconColor: string;
  readonly bg: string;
  readonly slug: string;
}

// ============================================
// Neighbor Activity
// ============================================

export interface NeighborActivity {
  readonly user: string;
  readonly action: string;
  readonly business: string;
  readonly time: string;
  readonly emoji: string;
}

// ============================================
// Stat
// ============================================

export interface Stat {
  readonly icon: LucideIcon;
  readonly value: string;
  readonly label: string;
}

// ============================================
// Quick Filter
// ============================================

export interface QuickFilter {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly active: boolean;
}

// ============================================
// Benefit
// ============================================

export interface Benefit {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly iconClass: string;
  readonly bgClass: string;
}

// ============================================
// Territory Polygon
// ============================================

export interface TerritoryPolygon {
  readonly name: string;
  readonly color: string;
  readonly coordinates: readonly any[];
}

// ============================================
// Base Props
// ============================================

export interface BaseSectionProps {
  readonly navigate: NavigateFunction;
}

// ============================================
// Section Props Específicas
// ============================================

export interface EmpresasCategoriasSectionProps extends BaseSectionProps {
  readonly categories: readonly Category[];
  readonly businessUrls: {
    readonly list: string;
  };
}

export interface EmpresasHeroSectionProps extends BaseSectionProps {
  readonly territoryName: string;
  readonly territoryNameShort: string;
  readonly territoryPreposition: string;
  readonly currentBannerIndex: number;
  readonly bannerImages: readonly string[];
  readonly onPrevBanner: () => void;
  readonly onNextBanner: () => void;
  readonly onBannerSelect: (index: number) => void;
}

export interface EmpresasFiltrosSectionProps extends BaseSectionProps {
  readonly filters: readonly QuickFilter[];
  readonly activeFilters: readonly string[];
  readonly onToggleFilter: (label: string) => void;
}

export interface EmpresasStatsSectionProps {
  readonly stats: readonly Stat[];
}

export interface EmpresasAtividadeSectionProps {
  readonly activities: readonly NeighborActivity[];
}

export interface EmpresasMapaSectionProps extends BaseSectionProps {
  readonly territoryLabels: {
    readonly mapLabel: string;
  };
  readonly businesses: readonly Business[];
  readonly territoryPolygons: readonly TerritoryPolygon[];
  readonly resolved: ResolvedTerritory | null | undefined;
  readonly isLoadingBounds: boolean;
  readonly filteredCount: number;
  readonly moduleUrls: {
    readonly business: string;
  };
}

export interface EmpresasListaSectionProps extends BaseSectionProps {
  readonly businesses: readonly Business[];
  readonly territoryNameShort: string;
  readonly territoryPreposition: string;
  readonly nearbyMode: boolean;
  readonly onToggleNearbyMode: (active: boolean) => void;
  readonly savedBusinesses: ReadonlySet<string>;
  readonly onToggleSave: (id: string, e: React.MouseEvent) => void;
  readonly businessUrls: {
    readonly list: string;
  };
  readonly moduleUrls: {
    readonly business: string;
  };
  readonly getBusinessUrl: (business: Business, fallbackUrl: string) => string;
}

export interface EmpresasRecomendacoesSectionProps extends BaseSectionProps {
  readonly topBusinesses: readonly Business[];
  readonly moduleUrls: {
    readonly business: string;
  };
  readonly getBusinessUrl: (business: Business, fallbackUrl: string) => string;
}

export interface EmpresasBeneficiosSectionProps {
  readonly benefits: readonly Benefit[];
}

export interface EmpresasCTASectionProps extends BaseSectionProps {
  readonly user: any;
}

// ============================================
// Component Props
// ============================================

export interface CategoryCardProps {
  readonly category: Category;
  readonly onClick: () => void;
  readonly index: number;
}

export interface BusinessCardProps {
  readonly business: Business;
  readonly onClick: () => void;
  readonly onToggleSave: (id: string, e: React.MouseEvent) => void;
  readonly isSaved: boolean;
  readonly nearbyMode: boolean;
  readonly index: number;
}

export interface NeighborActivityCardProps {
  readonly activity: NeighborActivity;
  readonly index: number;
}

export interface TopBusinessCardProps {
  readonly business: Business;
  readonly rank: number;
  readonly onClick: () => void;
}

export interface BenefitCardProps {
  readonly benefit: Benefit;
}

export interface QuickFilterChipProps {
  readonly filter: QuickFilter;
  readonly isActive: boolean;
  readonly onClick: () => void;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type EmpresasSectionId =
  | "categorias"
  | "hero"
  | "filtros"
  | "stats"
  | "atividade"
  | "mapa"
  | "lista"
  | "recomendacoes"
  | "beneficios"
  | "cta";

export type SectionPropsMap = {
  readonly categorias: EmpresasCategoriasSectionProps;
  readonly hero: EmpresasHeroSectionProps;
  readonly filtros: EmpresasFiltrosSectionProps;
  readonly stats: EmpresasStatsSectionProps;
  readonly atividade: EmpresasAtividadeSectionProps;
  readonly mapa: EmpresasMapaSectionProps;
  readonly lista: EmpresasListaSectionProps;
  readonly recomendacoes: EmpresasRecomendacoesSectionProps;
  readonly beneficios: EmpresasBeneficiosSectionProps;
  readonly cta: EmpresasCTASectionProps;
};
