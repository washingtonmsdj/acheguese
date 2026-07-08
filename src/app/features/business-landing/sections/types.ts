import type { LucideIcon } from "lucide-react";
import type { TerritoryPolygon as MapTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface Business {
  readonly id: string;
  readonly business_data_id?: string;
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
  readonly statusText?: string;
  readonly neighborRecs: number;
  readonly favoritesCount: number;
  readonly lastVisit: string;
  readonly coords: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly website?: string;
  readonly logoUrl?: string | null;
  readonly is_premium?: boolean;
  readonly is_verified?: boolean;
  readonly isFeatured?: boolean;
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
  readonly createdAt?: string;
}

export interface Category {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly count?: string;
  readonly iconColor: string;
  readonly bg: string;
  readonly slug: string;
}

export interface HeroStat {
  readonly label: string;
  readonly value: string;
}

export interface QuickFilter {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export type BusinessSortOption =
  | "relevance"
  | "recommendations"
  | "rating"
  | "distance"
  | "recent";

export interface BusinessHighlight {
  readonly business: Business;
  readonly label: string;
  readonly description: string;
  readonly tone: "teal" | "cyan" | "emerald";
}

export type TerritoryPolygon = MapTerritoryPolygon;

export interface EmpresasCategoriasSectionProps {
  readonly categories: readonly Category[];
  readonly activeCategory: string;
  readonly onSelectCategory: (slug: string) => void;
}

export interface EmpresasHeroSectionProps {
  readonly territoryName: string;
  readonly businesses: readonly Business[];
  readonly territoryPolygons: readonly TerritoryPolygon[];
  readonly resolved: ResolvedTerritory | null | undefined;
  readonly isLoadingBounds: boolean;
  readonly stats: readonly HeroStat[];
  readonly primaryHref: string;
  readonly primaryLabel: string;
  readonly secondaryHref: string;
  readonly secondaryLabel: string;
  readonly mapHref: string;
  readonly onOpenLocationDialog: () => void;
  readonly onOpenBusiness: (business: Business) => void;
}

export interface EmpresasFiltrosSectionProps {
  readonly filters: readonly QuickFilter[];
  readonly activeFilters: readonly string[];
  readonly onToggleFilter: (id: string) => void;
  readonly resultCount: number;
  readonly sortBy: BusinessSortOption;
  readonly onSortChange: (value: BusinessSortOption) => void;
}

export interface EmpresasRecomendacoesSectionProps {
  readonly highlights: readonly BusinessHighlight[];
  readonly savedBusinesses: ReadonlySet<string>;
  readonly onToggleSave: (id: string, event: React.MouseEvent) => void;
  readonly onOpenBusiness: (business: Business) => void;
}

export interface EmpresasListaSectionProps {
  readonly businesses: readonly Business[];
  readonly mapHref: string;
  readonly savedBusinesses: ReadonlySet<string>;
  readonly onToggleSave: (id: string, event: React.MouseEvent) => void;
  readonly onOpenBusiness: (business: Business) => void;
}

export interface CategoryCardProps {
  readonly category: Category;
  readonly isActive: boolean;
  readonly onClick: () => void;
}

export interface BusinessCardProps {
  readonly business: Business;
  readonly onClick: () => void;
  readonly onToggleSave: (id: string, event: React.MouseEvent) => void;
  readonly isSaved: boolean;
}

export interface TopBusinessCardProps {
  readonly highlight: BusinessHighlight;
  readonly onClick: () => void;
  readonly onToggleSave: (id: string, event: React.MouseEvent) => void;
  readonly isSaved: boolean;
}

export interface QuickFilterChipProps {
  readonly filter: QuickFilter;
  readonly isActive: boolean;
  readonly onClick: () => void;
}
