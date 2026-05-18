/**
 * Types compartilhados para as sections de Empresa Detail Landing Page
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import type { Business } from "@/core/business/types";
import type { VerticalKey } from "@/core/verticals";
import type { GastronomyPreviewItem } from "@/modules/business/gastronomy/services";

// ============================================
// Business Extended (com campos adicionais)
// ============================================

export type BusinessExtended = Business & {
  business_role?: "branch" | "brand_hub" | "standalone";
  horario_funcionamento?: Record<string, { open: string; close: string; closed?: boolean }>;
  formas_pagamento?: readonly string[];
  especialidades?: readonly string[];
  facilidades?: readonly string[];
  modos_atendimento?: readonly string[];
  tem_delivery: boolean;
  aceita_cartao: boolean;
  aceita_pix: boolean;
  instagram?: string;
  facebook?: string;
  fotos?: readonly string[];
  parent_business_id?: string;
  business_name?: string;
};

// ============================================
// Product
// ============================================

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly promotional_price?: number;
  readonly category: string;
  readonly image_url?: string | null;
  readonly featured?: boolean;
  readonly active?: boolean;
}

// ============================================
// Review
// ============================================

export interface Review {
  readonly id: string;
  readonly user_name: string;
  readonly rating: number;
  readonly comment: string;
  readonly created_at: string;
  readonly isNeighbor?: boolean;
  readonly avatar?: string | null;
}

// ============================================
// Nearby Business
// ============================================

export interface NearbyBusiness {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly distance?: string;
  readonly rating: number;
  readonly isOpen?: boolean;
  readonly canonicalUrl?: string;
}

// ============================================
// Open Status
// ============================================

export interface OpenStatus {
  readonly open: boolean | null;
  readonly todayHours: string | null;
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

export interface EmpresaHeroSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly openStatus: OpenStatus;
  readonly yearsActive: string;
}

export interface EmpresaCTAsSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly isDeliveryBusiness: boolean;
  readonly gastronomyUrl: string | null;
  readonly verticalPublicUrls?: Partial<Record<VerticalKey, string>>;
  readonly isFavorite: boolean;
  readonly hasRecommended: boolean;
  readonly showRouteOptions: boolean;
  readonly onToggleFavorite: () => void;
  readonly onToggleRecommended: () => void;
  readonly onToggleRouteOptions: () => void;
  readonly onRoute: () => void;
}

export interface EmpresaResumoSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly yearsActive: string;
}

export interface EmpresaInfoSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly openStatus: OpenStatus;
  readonly addressText: string | null;
  readonly locationText: string | null;
  readonly isDeliveryBusiness: boolean;
  readonly showAllHours: boolean;
  readonly copiedPhone: boolean;
  readonly onToggleShowAllHours: () => void;
  readonly onCopyPhone: () => void;
  readonly onRoute: () => void;
}

export interface EmpresaProdutosSectionProps extends BaseSectionProps {
  readonly products: readonly Product[];
  readonly selectedCategory: string;
  readonly showAllProducts: boolean;
  readonly onSelectCategory: (category: string) => void;
  readonly onToggleShowAll: () => void;
}

export interface EmpresaGastronomiaPreviewSectionProps extends BaseSectionProps {
  readonly items: readonly GastronomyPreviewItem[];
  readonly canonicalUrl: string;
  readonly businessName: string;
  readonly isLoading?: boolean;
}

export interface EmpresaAvaliacoesSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly reviews: readonly Review[];
  readonly user: User | null;
  readonly reviewUrl?: string | null;
}

export interface EmpresaFotosSectionProps extends BaseSectionProps {
  readonly fotos: readonly string[];
  readonly businessName: string;
}

export interface EmpresaProximasSectionProps extends BaseSectionProps {
  readonly nearbyBusinesses: readonly NearbyBusiness[];
  readonly currentBusinessId: string;
  readonly currentBusinessGeographicPath?: string | null;
}

// ============================================
// Component Props
// ============================================

export interface ProductCardProps {
  readonly product: Product;
}

export interface ReviewCardProps {
  readonly review: Review;
}

export interface NearbyBusinessCardProps {
  readonly business: NearbyBusiness;
  readonly onClick: () => void;
}

export interface AddressCardProps {
  readonly business: BusinessExtended;
  readonly addressText: string | null;
  readonly locationText: string | null;
  readonly onRoute: () => void;
}

export interface HoursCardProps {
  readonly hours: Record<string, { open: string; close: string; closed?: boolean }>;
  readonly openStatus: OpenStatus;
  readonly showAllHours: boolean;
  readonly onToggleShowAll: () => void;
}

export interface ContactCardProps {
  readonly business: BusinessExtended;
  readonly copiedPhone: boolean;
  readonly onCopyPhone: () => void;
  readonly navigate: NavigateFunction;
}

export interface PaymentCardProps {
  readonly business: BusinessExtended;
}

export interface FacilitiesCardProps {
  readonly facilidades: readonly string[];
}

export interface ActionButtonProps {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly onClick?: () => void;
  readonly href?: string;
  readonly color?: string;
  readonly isActive?: boolean;
}

export interface RouteOptionsProps {
  readonly show: boolean;
  readonly onRoute: () => void;
}

export interface RatingSummaryProps {
  readonly rating: number;
  readonly totalReviews: number;
}

export interface RatingDistributionProps {
  readonly reviews: readonly Review[];
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type EmpresaSectionId =
  | "hero"
  | "ctas"
  | "resumo"
  | "info"
  | "produtos"
  | "gastronomiaPreview"
  | "avaliacoes"
  | "fotos"
  | "proximas";

export type SectionPropsMap = {
  readonly hero: EmpresaHeroSectionProps;
  readonly ctas: EmpresaCTAsSectionProps;
  readonly resumo: EmpresaResumoSectionProps;
  readonly info: EmpresaInfoSectionProps;
  readonly produtos: EmpresaProdutosSectionProps;
  readonly gastronomiaPreview: EmpresaGastronomiaPreviewSectionProps;
  readonly avaliacoes: EmpresaAvaliacoesSectionProps;
  readonly fotos: EmpresaFotosSectionProps;
  readonly proximas: EmpresaProximasSectionProps;
};
