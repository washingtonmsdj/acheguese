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

export type ProfessionalVisibility =
  | "public_listed"
  | "public_unlisted"
  | "private";

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
  availability_notes?: string | null;
  portfolio_items?: Array<{
    url: string;
    caption?: string;
    media_type?: "image" | "video" | "document";
    is_cover?: boolean;
  }> | null;
  whatsapp: string | null;
  email: string | null;
  rating?: number | null;
  is_verified: boolean;
  verified_at: string | null;
  is_accepting_clients: boolean;
  visibility?: ProfessionalVisibility;
  
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
  /** FK canonica para locations.id. Define o territorio principal do profissional. */
  location_id?: string;
  /** Caminho territorial canonico da location. Ex: /br/ba/salvador/pituba */
  geographic_path?: string;
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
  visibility?: ProfessionalVisibility;
  availability_notes?: string;

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
  visibility?: ProfessionalVisibility;
  availability_notes?: string;

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

// ============================================================================
// LEAD / QUOTE REQUEST TYPES
// ============================================================================

export type ProfessionalLeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "archived";

export type ProfessionalLeadPriority = "low" | "normal" | "high" | "urgent";

export interface ProfessionalLeadRecord {
  id: string;
  professional_id: string;
  requester_user_id: string | null;
  requester_profile_id: string | null;
  requester_name: string;
  requester_phone: string | null;
  requester_email: string | null;
  service_needed: string;
  description: string;
  preferred_date: string | null;
  preferred_time_window: string | null;
  neighborhood: string | null;
  location_id: string | null;
  source_channel: string;
  status: ProfessionalLeadStatus;
  priority: ProfessionalLeadPriority;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalLeadMessageRecord {
  id: string;
  lead_id: string;
  sender_user_id: string | null;
  sender_role: "requester" | "professional" | "system";
  message: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export type ProfessionalLeadQuoteStatus =
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

export interface ProfessionalLeadQuoteRecord {
  id: string;
  lead_id: string;
  professional_user_id: string | null;
  amount_cents: number;
  currency: string;
  description: string;
  estimated_start_date: string | null;
  estimated_duration: string | null;
  status: ProfessionalLeadQuoteStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ProfessionalServiceEngagementStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ProfessionalServiceEngagementRecord {
  id: string;
  lead_id: string;
  quote_id: string;
  professional_id: string;
  professional_user_id: string | null;
  requester_user_id: string | null;
  requester_profile_id: string | null;
  amount_cents: number;
  currency: string;
  service_description: string;
  scheduled_date: string | null;
  estimated_duration: string | null;
  status: ProfessionalServiceEngagementStatus;
  completed_at: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalLeadDetails extends ProfessionalLeadRecord {
  professional?: {
    id: string;
    professional_name: string | null;
    service_category: string | null;
    service_subcategory: string | null;
    profile_id: string;
  } | null;
}

export interface CreateProfessionalLeadInput {
  professionalId: string;
  requesterName: string;
  requesterPhone?: string;
  requesterEmail?: string;
  serviceNeeded: string;
  description: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  neighborhood?: string;
  locationId?: string;
  sourceChannel?: "public_profile" | "service_profile" | "central" | string;
  priority?: ProfessionalLeadPriority;
  metadata?: Record<string, unknown>;
}

export interface UpdateProfessionalLeadStatusInput {
  leadId: string;
  status: ProfessionalLeadStatus;
  note?: string;
}

export interface SendProfessionalLeadMessageInput {
  leadId: string;
  message: string;
}

export interface CreateProfessionalLeadQuoteInput {
  leadId: string;
  amountCents: number;
  description: string;
  estimatedStartDate?: string;
  estimatedDuration?: string;
}

export interface UpdateProfessionalLeadQuoteStatusInput {
  quoteId: string;
  status: Extract<ProfessionalLeadQuoteStatus, "accepted" | "declined" | "cancelled">;
}

export interface UpdateProfessionalServiceEngagementStatusInput {
  engagementId: string;
  status: ProfessionalServiceEngagementStatus;
  note?: string;
}

export interface SubmitProfessionalEngagementReviewInput {
  engagementId: string;
  rating: number;
  comment?: string;
}
