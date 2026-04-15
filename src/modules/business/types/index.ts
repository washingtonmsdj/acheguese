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
 * Sort options for business lists
 */
export type SortOption =
  | "recentes"
  | "name_az"
  | "name_za"
  | "price_asc"
  | "price_desc";
