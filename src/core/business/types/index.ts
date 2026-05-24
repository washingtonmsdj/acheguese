// Re-export de tipos de business do modulo
// Isso permite que core e outros modulos acessem tipos sem depender do modulo business

export type {
  Business,
  BusinessCategory,
  BusinessCompanyType,
  BusinessEmployeeCount,
  BusinessHours,
  BusinessRole,
} from "./Business";

// ============================================
// INPUT TYPES
// ============================================

export interface BusinessInput {
  name: string;
  legal_name?: string;
  cnpj?: string;
  company_type?: import("./Business").BusinessCompanyType;
  industry?: string;
  employee_count?: import("./Business").BusinessEmployeeCount;
  founded_year?: number;
  description?: string;
  category: import("./Business").BusinessCategory;
  subcategoria?: string;

  /** SSOT de identidade publica */
  slug?: string;

  /** SSOT territorial - FK para locations.id */
  location_id?: string;
  /** FK para addresses (opcional) */
  address_id?: string;

  /** Campos canonicos para criacao/atualizacao de endereco fisico */
  city?: string;
  state?: string;
  postal_code?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;

  /** Compatibilidade legada - evitar em novos fluxos */
  address?: string;
  neighborhood?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;

  /** Estrutura da empresa */
  business_role?: import("./Business").BusinessRole;
  parent_business_id?: string | null;
  is_headquarters?: boolean;
  unit_name?: string;

  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  horario_funcionamento?: unknown;
  formas_pagamento?: string[];
  especialidades?: string[];
  facilidades?: string[];
  modos_atendimento?: string[];
  tem_delivery?: boolean;
  aceita_cartao?: boolean;
  aceita_pix?: boolean;
  can_post_vagas?: boolean;
  logo_url?: string;
  banner_url?: string;
  fotos?: string[];
  status?: "active" | "inactive" | "pending" | "suspended";
  /** Campos administrativos — apenas super_admin/admin */
  is_verified?: boolean;
  is_premium?: boolean;
}

export type CreateBusinessInput = BusinessInput;
export type UpdateBusinessInput = Partial<BusinessInput>;

// Types used by BusinessService
export interface BusinessFilters {
  category?: string;
  search?: string;
  neighborhood?: string;
  hasDelivery?: boolean;
  sortBy?: "rating" | "name" | "distancia" | "created_at" | "recommendations_count";
  /** SSOT - Filtro territorial canonico */
  territoryFilter?: import("@/core/location/types").TerritoryFilter;
}

export interface BusinessStats {
  total: number;
  active: number;
  premium: number;
  by_category: Record<string, number>;
}

export interface BusinessDataRecord {
  id?: string;
  profile_id: string;
  business_name?: string;
  legal_name?: string | null;
  cnpj?: string | null;
  company_type?: string | null;
  industry?: string | null;
  employee_count?: string | null;
  founded_year?: number | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;

  // Modelo canonico
  address_id?: string | null;
  location_id: string | null;
  business_address?: string | null;
  business_city?: string | null;
  business_state?: string | null;
  business_zip?: string | null;

  // Rede/Filiais
  business_role?: import("./Business").BusinessRole;
  parent_business_id?: string | null;
  is_headquarters?: boolean;
  unit_name?: string | null;

  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  business_hours?: unknown;
  opening_hours?: unknown;
  payment_methods?: string[] | null;
  specialties?: string[] | null;
  facilities?: string[] | null;
  is_premium?: boolean;
  is_verified?: boolean;
  can_post_vagas?: boolean;
  metadata?: Record<string, unknown> | null;
  status?: string;
  rating?: number;
  total_reviews?: number;
  favorites_count?: number;
  recommendations_count?: number;
  total_products?: number;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessDataWithProfiles extends BusinessDataRecord {
  profiles?: {
    id: string;
    name: string;
    avatar_url?: string;
    phone?: string;
    whatsapp?: string;
    bio?: string;
  };
  // FK joins canonicos
  address?: {
    id: string;
    location_id: string;
    postal_code: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    address_type: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  location?: {
    id: string;
    name: string;
    full_name: string;
    type: string;
    slug: string;
    geographic_path?: string | null;
    canonical_lat?: number | null;
    canonical_lng?: number | null;
  } | null;
}

export interface BusinessMetadata {
  logo_url?: string;
  banner_url?: string;
  fotos?: string[];
  modos_atendimento?: string[];
  tem_delivery?: boolean;
  aceita_cartao?: boolean;
  aceita_pix?: boolean;
  neighborhood?: string;
  cep?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
}

export interface Product {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number;
  image_url?: string;
  category: string;
  stock?: number;
  active: boolean;
  featured: boolean;
  promotion: boolean;
  created_at: string;
}

export interface ProductRecord {
  id: string;
  profile_id: string;
  nome: string;
  descricao?: string;
  preco?: number;
  preco_promocional?: number;
  imagem?: string;
  categoria?: string;
  estoque?: number;
  ativo: boolean;
  destaque: boolean;
  promocao: boolean;
  created_at: string;
}

export interface CreateProductInput {
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  imagem?: string;
  categoria?: string;
  estoque?: number;
  ativo?: boolean;
  destaque?: boolean;
  promocao?: boolean;
}

export interface Review {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
}

export interface ReviewRecord {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ReviewWithUser extends ReviewRecord {
  profiles: {
    name: string;
    avatar_url?: string;
  };
}

// ============================================
// GASTRONOMY TYPES - Re-export from gastronomy.ts
// ============================================
export type {
  PriceRange,
  GastronomyStatus,
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
  GastronomyBusiness,
  GastronomyBusinessFilters,
  TerritorySlugParams,
  PaginatedGastronomyBusinesses,
} from "./gastronomy";
