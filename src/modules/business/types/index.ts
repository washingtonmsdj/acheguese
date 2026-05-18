/**
 * 🏆 BUSINESS MODULE TYPES - SSOT Re-exports
 *
 * Este arquivo re-exporta tipos do core para manter compatibilidade
 * com imports existentes no módulo business.
 *
 * ✅ SSOT: Todos os tipos vêm de @/core/business/types
 * ✅ Zero duplicação
 * ✅ TypeScript strict
 *
 * @version 4.0.0 - Limpeza completa
 * @author Kiro AI
 * @date 2026-04-10
 */

// ============================================
// CORE BUSINESS TYPES - Use these
// ============================================

export type {
  Business,
  BusinessCategory,
  BusinessCompanyType,
  BusinessEmployeeCount,
  BusinessHours,
  BusinessRole,
  BusinessStatus,
} from "@/core/business/types/Business";
import type { Business } from "@/core/business/types/Business";

export type {
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessInput,
  BusinessFilters,
  BusinessStats,
  BusinessDataRecord,
  BusinessDataWithProfiles,
  BusinessMetadata,
  Product,
  ProductRecord,
  CreateProductInput,
  Review,
  ReviewRecord,
  ReviewWithUser,
} from "@/core/business/types";

// ============================================
// MODULE-SPECIFIC TYPES
// ============================================

/**
 * Service type for business services
 */
export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: string | null;
  business_id: string;
  active: boolean;
  category: string;
  featured: boolean;
  image_url: string | null;
}

/**
 * Gallery photo type
 */
export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
}

/**
 * Compatibilidade de componentes legados de business.
 */
export type BizData = Omit<Business, "address"> & {
  logo?: string;
  capa?: string;
  neighborhood?: string;
  address?: Business["address"] | string;
  latitude?: number;
  longitude?: number;
  schedule?: string;
  aberto?: boolean;
  schedule_fechamento?: string;
  whatsapp?: string;
  secoes_ativas?: {
    services?: boolean;
    products?: boolean;
    cardapio?: boolean;
    portfolio?: boolean;
    promocoes?: boolean;
  };
  total_avaliacoes?: number;
  ano_fundacao?: number | null;
  verified?: boolean;
  specialties?: string[];
};

/**
 * Sort options for business lists
 */
export type SortOption =
  | "recentes"
  | "name_az"
  | "name_za"
  | "price_asc"
  | "price_desc";
