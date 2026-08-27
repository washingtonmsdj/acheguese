/**
 * Types compartilhados para as sections de Empresa Detail Landing Page
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type { AuthUser } from "@/core/auth/services/types";
import type { Business } from "@/core/business/types";
import type { VerticalKey } from "@/core/verticals";
import type { PublicGastronomyPreviewItem } from "@/core/business/types/publicSnapshots";

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
  delivery_eta_label?: string;
  price_band_label?: string;
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

export interface RatingBreakdown {
  readonly 5?: number;
  readonly 4?: number;
  readonly 3?: number;
  readonly 2?: number;
  readonly 1?: number;
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
  readonly logoUrl?: string | null;
  readonly imageUrl?: string | null;
  readonly locationLabel?: string | null;
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
  readonly onRoute?: () => void;
  readonly onClaim?: () => void;
}

export interface EmpresaCTAsSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly isDeliveryBusiness: boolean;
  readonly gastronomyUrl: string | null;
  readonly verticalPublicUrls?: Partial<Record<VerticalKey, string>>;
  readonly embedded?: boolean;
  readonly isFavorite: boolean;
  readonly hasRecommended: boolean;
  readonly recommendLoading?: boolean;
  readonly showRouteOptions: boolean;
  readonly onToggleFavorite: () => void;
  readonly onToggleRecommended: () => void;
  readonly onToggleRouteOptions: () => void;
  readonly onRoute: () => void;
  readonly onShare?: () => void;
}

export interface EmpresaResumoSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly yearsActive: string;
  readonly embedded?: boolean;
}

export interface EmpresaInfoSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly openStatus: OpenStatus;
  readonly addressText: string | null;
  readonly locationText: string | null;
  readonly isDeliveryBusiness: boolean;
  readonly showAllHours: boolean;
  readonly copiedPhone: boolean;
  readonly embedded?: boolean;
  readonly hideAddressCard?: boolean;
  readonly showSidebar?: boolean;
  readonly sidebarClassName?: string;
  readonly onToggleShowAllHours: () => void;
  readonly onCopyPhone: () => void;
  readonly onRoute: () => void;
}

export interface EmpresaProdutosSectionProps extends BaseSectionProps {
  readonly products: readonly Product[];
  readonly selectedCategory: string;
  readonly showAllProducts: boolean;
  readonly embedded?: boolean;
  readonly onSelectCategory: (category: string) => void;
  readonly onToggleShowAll: () => void;
}

export interface EmpresaGastronomiaPreviewSectionProps extends BaseSectionProps {
  readonly items: readonly PublicGastronomyPreviewItem[];
  readonly canonicalUrl: string;
  readonly businessName: string;
  readonly isLoading?: boolean;
}

export interface EmpresaAvaliacoesSectionProps extends BaseSectionProps {
  readonly business: BusinessExtended;
  readonly reviews: readonly Review[];
  readonly user: (AuthUser & { user_metadata?: Record<string, unknown> }) | null;
  readonly reviewUrl?: string | null;
  readonly ratingBreakdown?: RatingBreakdown | null;
  readonly embedded?: boolean;
}

export interface EmpresaFotosSectionProps extends BaseSectionProps {
  readonly fotos: readonly string[];
  readonly businessName: string;
}

export interface EmpresaProximasSectionProps extends BaseSectionProps {
  readonly nearbyBusinesses: readonly NearbyBusiness[];
  readonly currentBusinessId: string;
  readonly currentBusinessGeographicPath?: string | null;
  readonly embedded?: boolean;
  readonly maxItems?: number;
  readonly layout?: "column" | "row";
}

// ============================================
// Component Props
// ============================================

export interface ProductCardProps {
  readonly product: Product;
}

export interface ReviewCardProps {
  readonly review: Review;
  readonly compact?: boolean;
}

export interface NearbyBusinessCardProps {
  readonly business: NearbyBusiness;
  readonly onClick: () => void;
  readonly compact?: boolean;
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
  readonly appearance?: 'soft' | 'solid';
  readonly layout?: 'stacked' | 'inline';
  readonly isActive?: boolean;
  readonly ariaPressed?: boolean;
  readonly disabled?: boolean;
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
  readonly ratingBreakdown?: RatingBreakdown | null;
  readonly totalReviews?: number;
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
