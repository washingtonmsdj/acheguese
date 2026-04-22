/**
 * Types compartilhados para as sections de Classificados
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";

// ============================================
// Base Props (compartilhadas por todas)
// ============================================

export interface BaseSectionProps {
  readonly territoryName: string;
  readonly navigate: NavigateFunction;
}

// ============================================
// Classificado (item da listagem)
// ============================================

export type Classificado = ClassificadoWithVendedor;

// ============================================
// Vendedor
// ============================================

export interface Vendedor {
  readonly id: string;
  readonly nome: string;
  readonly avatar?: string;
  readonly rating?: number;
  readonly totalAds?: number;
  readonly memberSince?: string;
}

// ============================================
// Filters (filtros de busca)
// ============================================

export interface ClassifiedsFilters {
  readonly search: string;
  readonly category: string | null;
  readonly sort: string;
  readonly priceMin: string;
  readonly priceMax: string;
  readonly condition: string;
  readonly hasPhoto: boolean;
}

// ============================================
// Sort Options
// ============================================

export interface SortOption {
  readonly id: string;
  readonly label: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: "recente", label: "Mais recentes" },
  { id: "menor_price", label: "Mais baratos" },
  { id: "maior_price", label: "Mais caros" },
  { id: "relevante", label: "Mais relevantes" },
] as const;

// ============================================
// Condition Options
// ============================================

export interface ConditionOption {
  readonly id: string;
  readonly label: string;
}

export const CONDITION_OPTIONS: readonly ConditionOption[] = [
  { id: "todos", label: "Todos" },
  { id: "novo", label: "Novo" },
  { id: "seminovo", label: "Seminovo" },
  { id: "usado", label: "Usado" },
] as const;

// ============================================
// Highlight Categories
// ============================================

export interface HighlightCategory {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly bg: string;
  readonly iconColor: string;
}

// ============================================
// View Mode
// ============================================

export type ViewMode = "anuncios" | "vendedores";

// ============================================
// Status Config
// ============================================

export interface StatusConfig {
  readonly label: string;
  readonly color: string;
  readonly dot: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    label: "Disponível",
    color: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  reserved: {
    label: "Reservado",
    color: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  sold: {
    label: "Vendido",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
} as const;

// ============================================
// Section Props Específicas
// ============================================

export interface ClassifiedsHeroSectionProps extends BaseSectionProps {
  readonly activeCount: number;
  readonly onNewClassificado: () => void;
}

export interface ClassifiedsCategoriesSectionProps extends BaseSectionProps {
  readonly categories: readonly HighlightCategory[];
  readonly selectedCategory: string | null;
  readonly onCategoryChange: (categoryId: string) => void;
}

export interface ClassifiedsFiltrosSectionProps extends BaseSectionProps {
  readonly filters: ClassifiedsFilters;
  readonly onSearchChange: (search: string) => void;
  readonly onSortChange: (sort: string) => void;
  readonly onPriceMinChange: (value: string) => void;
  readonly onPriceMaxChange: (value: string) => void;
  readonly onConditionChange: (condition: string) => void;
  readonly onHasPhotoChange: (hasPhoto: boolean) => void;
  readonly onClearFilters: () => void;
  readonly onCategoryChange: (categoryId: string) => void;
}

export interface ClassifiedsHorizontalSectionProps extends BaseSectionProps {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ReactNode;
  readonly ads: readonly Classificado[];
  readonly badgeText: string;
  readonly badgeColor: string;
  readonly onAdClick: (ad: Classificado) => void;
}

export interface ClassifiedsSponsoredSectionProps extends BaseSectionProps {
  readonly ads: readonly Classificado[];
  readonly onAdClick: (ad: Classificado) => void;
}

export interface ClassifiedsListagemSectionProps extends BaseSectionProps {
  readonly viewMode: ViewMode;
  readonly onViewModeChange: (mode: ViewMode) => void;
  readonly classificados: readonly Classificado[];
  readonly vendedores: readonly Vendedor[];
  readonly adsCount: number;
  readonly sellersCount: number;
  readonly isLoading: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly onLoadMore: () => void;
  readonly onClassificadoClick: (ad: Classificado) => void;
}

export interface ClassifiedsFooterSectionProps extends BaseSectionProps {
  readonly onNewClassificado: () => void;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type ClassifiedsSectionId =
  | "hero"
  | "categories"
  | "filtros"
  | "trending"
  | "popular"
  | "featured"
  | "sponsored"
  | "listagem"
  | "footer";

export type SectionPropsMap = {
  readonly hero: ClassifiedsHeroSectionProps;
  readonly categories: ClassifiedsCategoriesSectionProps;
  readonly filtros: ClassifiedsFiltrosSectionProps;
  readonly trending: ClassifiedsHorizontalSectionProps;
  readonly popular: ClassifiedsHorizontalSectionProps;
  readonly featured: ClassifiedsHorizontalSectionProps;
  readonly sponsored: ClassifiedsSponsoredSectionProps;
  readonly listagem: ClassifiedsListagemSectionProps;
  readonly footer: ClassifiedsFooterSectionProps;
};


