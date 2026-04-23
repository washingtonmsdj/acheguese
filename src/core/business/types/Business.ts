/**
 * BUSINESS TYPES - Tipos Compartilhados SSOT
 *
 * Tipos basicos de Business usados transversalmente na aplicacao.
 * Para tipos especificos do dominio business, veja os tipos locais do core.
 */

export type BusinessCategory =
  | "restaurante"
  | "mercado"
  | "farmacia"
  | "saude"
  | "educacao"
  | "servicos"
  | "lazer"
  | "outros";

export type BusinessCompanyType =
  | "mei"
  | "ltda"
  | "sa"
  | "eireli"
  | "other";

export type BusinessEmployeeCount =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "500+";

export type BusinessRole = "standalone" | "brand_hub" | "branch";
export type BusinessStatus = "active" | "inactive" | "pending" | "suspended";

/**
 * Horario de funcionamento por dia da semana
 */
export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

/**
 * BUSINESS - Entidade basica compartilhada
 *
 * Modelo canonico:
 * - location_id: territorio principal da empresa
 * - address_id: endereco fisico opcional
 * - business_role: suporte a standalone, hub de marca e filiais
 */
export interface Business {
  id: string;
  profile_id: string;
  name: string;
  legal_name?: string;
  cnpj?: string;
  company_type?: BusinessCompanyType;
  industry?: string;
  employee_count?: BusinessEmployeeCount;
  founded_year?: number;
  description: string;
  category: BusinessCategory;
  subcategoria?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;

  // Modelo canonico
  location_id: string | null;
  address_id?: string | null;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;

  // Campos de rede/filiais
  business_role?: BusinessRole;
  parent_business_id?: string | null;
  is_headquarters?: boolean;
  unit_name?: string | null;

  // Relacoes carregadas (quando necessario)
  address?: {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  location?: {
    name: string;
    full_name: string;
    geographic_path?: string | null;
    canonical_lat?: number | null;
    canonical_lng?: number | null;
  };

  // Campo derivado para URLs (carregado via join com locations)
  geographic_path?: string | null;

  horario_funcionamento?: BusinessHours;
  tem_delivery: boolean;
  aceita_cartao: boolean;
  aceita_pix: boolean;
  logo_url?: string;
  banner_url?: string;
  fotos?: string[];
  status: BusinessStatus;
  rating: number;
  total_reviews: number;
  favorites_count?: number;
  recommendations_count?: number;
  total_products: number;
  is_premium: boolean;
  is_verified: boolean;
  can_post_vagas: boolean;
  is_featured?: boolean;
  slug?: string;
  formas_pagamento: string[];
  especialidades: string[];
  facilidades: string[];
  modos_atendimento: string[];
  instagram?: string;
  facebook?: string;
  created_at: string;
  updated_at: string;
}
