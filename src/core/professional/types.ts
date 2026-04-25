/**
 * 🏆 PROFESSIONAL TYPES - SSOT (Single Source of Truth)
 *
 * ✅ Tipos centralizados para profissionais
 * ✅ Baseado na estrutura professional_data
 * ✅ Compatível com BusinessService
 * ✅ ZERO uso de any
 *
 * @version 1.0.0 - SSOT Migration
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type ProfessionalCategory =
  | "eletricista"
  | "encanador"
  | "pedreiro"
  | "pintor"
  | "diarista"
  | "tecnico_celular"
  | "mecanico"
  | "chaveiro"
  | "jardineiro"
  | "saude"
  | "beleza"
  | "educacao"
  | "tecnologia"
  | "construcao"
  | "consultoria"
  | "design"
  | "fotografia"
  | "juridico"
  | "contabilidade"
  | "outros";

export type ProfessionalStatus =
  | "active"
  | "inactive"
  | "pending"
  | "suspended";

// ============================================================================
// DATABASE RECORD TYPES (professional_data table)
// ============================================================================

export interface ProfessionalDataRecord {
  id: string;
  profile_id: string;
  slug: string | null;
  professional_name: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  description: string | null;
  certifications: string[] | null;
  experience_years: number | null;
  education: string | null;
  price_range: string | null;
  service_areas: string[] | null;
  service_radius_km: number | null;
  available_hours: Record<string, unknown> | null;
  whatsapp: string | null;
  email: string | null;
  rating?: number | null;
  is_verified: boolean;
  verified_at: string | null;
  is_accepting_clients: boolean;
  
  // Modelo canônico (ETAPA 7)
  /** FK para addresses (endereço físico do consultório/escritório) */
  address_id?: string | null;
  /** FK para locations (território principal de atuação) */
  location_id: string;
  
  metadata: ProfessionalMetadata;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalDataWithProfiles extends ProfessionalDataRecord {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  // FK joins canônicos (ETAPA 9)
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
  } | null;
}

// ============================================================================
// METADATA TYPE
// ============================================================================

export interface ProfessionalMetadata {
  logo_url?: string;
  banner_url?: string;
  portfolio_images?: string[];
  social_links?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  location?: {
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  total_reviews?: number;
  total_jobs?: number;
  response_time?: string;
  languages?: string[];
  [key: string]: unknown;
}

// ============================================================================
// APPLICATION TYPES (for frontend use)
// ============================================================================

export interface Professional {
  /** PK canonico de professional_data. SSOT para identidade publica do profissional. */
  professional_data_id: string;
  id: string;
  profile_id: string;
  slug?: string;
  name: string;
  description: string;
  category: ProfessionalCategory;
  subcategory?: string;

  // Contact
  phone?: string;
  whatsapp?: string;
  email?: string;

  // Location
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;

  // Professional Info
  certifications: string[];
  experience_years?: number;
  education?: string;
  price_range?: string;
  service_areas: string[];
  service_radius_km?: number;
  available_hours?: Record<string, unknown>;

  // Media
  logo_url?: string;
  banner_url?: string;
  portfolio_images: string[];

  // Social
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;

  // Status
  status: ProfessionalStatus;
  is_verified: boolean;
  verified_at?: string;
  is_accepting_clients: boolean;

  // Metrics
  rating: number;
  total_reviews: number;
  total_jobs: number;
  response_time?: string;

  // Meta
  languages: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INPUT TYPES (for create/update operations)
// ============================================================================

export interface CreateProfessionalInput {
  name: string;
  slug?: string;
  description: string;
  category: ProfessionalCategory;
  subcategory?: string;

  // Contact
  phone?: string;
  whatsapp?: string;
  email?: string;

  // Location
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  address_id?: string;

  // Professional Info
  certifications?: string[];
  experience_years?: number;
  education?: string;
  price_range?: string;
  service_areas?: string[];
  service_radius_km?: number;
  available_hours?: Record<string, unknown>;

  // Media
  logo_url?: string;
  banner_url?: string;
  portfolio_images?: string[];

  // Social
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;

  // Status
  is_accepting_clients?: boolean;

  // Meta
  languages?: string[];
}

export type UpdateProfessionalInput = Partial<CreateProfessionalInput>;

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface ProfessionalFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  city?: string;
  neighborhood?: string;
  is_verified?: boolean;
  is_accepting_clients?: boolean;
  price_range?: string;
  has_portfolio?: boolean;
  min_rating?: number;
  sortBy?: "created_at" | "rating" | "name" | "experience_years";
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  /** Filtro territorial canônico — eq ou in por location_id */
  territoryFilter?: import('@/core/location/types').TerritoryFilter;
}

// ============================================================================
// STATS AND METRICS
// ============================================================================

export interface ProfessionalStats {
  profile_id: string;
  views_count: number;
  contacts_count: number;
  favorites_count: number;
  shares_count: number;
  jobs_completed: number;
  response_rate: number;
  average_response_time: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface ProfessionalReview {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  comment: string;
  job_type?: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
}

export interface ProfessionalReviewRecord {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  job_type: string | null;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

export interface ProfessionalReviewWithUser extends ProfessionalReviewRecord {
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

// ============================================================================
// JOB/SERVICE TYPES
// ============================================================================

export interface ProfessionalJob {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  duration?: string;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProfessionalJobRecord {
  id: string;
  profile_id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  duracao: string | null;
  imagens: string[] | null;
  destaque: boolean;
  ativo: boolean;
  created_at: string;
}

export interface CreateProfessionalJobInput {
  titulo: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  duracao?: string;
  imagens?: string[];
  destaque?: boolean;
  ativo?: boolean;
}
