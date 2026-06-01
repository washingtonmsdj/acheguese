/**
 * 📦 CLASSIFIEDS TYPES - SSOT Type Definitions
 *
 * Tipagens centrais do módulo de classificados.
 * SSOT para estrutura de dados.
 *
 */

/**
 * Dados completos de um classificado
 */
export interface ClassifiedData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  /** Armazenado como "photos" no banco — array de URLs */
  photos: string[];
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  /** Slug derivado do título, usado na URL canônica */
  slug?: string;
  /** Identificador público estável (8 chars), âncora da resolução */
  public_id?: string;
  /** FK para classified_categories */
  category_id?: string;
  /** FK para classified_subcategories */
  subcategory_id?: string;
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  /** @deprecated usar location_id — mantido para display e compatibilidade */
  location?: string;
  /** @deprecated usar location_id — mantido para display e compatibilidade */
  neighborhood?: string;
  /** geographic_path da location (para construir URL canônica) */
  geographic_path?: string;
  /** slug da categoria (para construir URL canônica) */
  category_slug?: string;
  /** slug da subcategoria (para construir URL canônica) */
  subcategory_slug?: string;
  /** Status do anúncio: active, inactive, sold */
  status?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Input para criação de classificado
 */
export interface CreateClassifiedInput {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  photos: string[];
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  /** @deprecated usar location_id */
  location?: string;
  /** @deprecated usar location_id */
  neighborhood?: string;
  /** FK para categoria */
  category_id?: string;
  /** FK para subcategoria */
  subcategory_id?: string;
}

/**
 * Input para atualização de classificado
 */
export interface UpdateClassifiedInput extends Partial<CreateClassifiedInput> {
  status?: "active" | "inactive" | "sold";
  is_active?: boolean;
}

/**
 * Bairro com contagem de classificados
 */
export interface NeighborhoodWithClassifiedCount {
  location_id: string;
  location_name: string;
  location_slug: string;
  count: number;
}

/**
 * Vendedor com anúncios
 */
export interface SellerWithAds {
  id: string;
  name: string;
  avatar_url: string | null;
  neighborhood: string;
  active_ads_count: number;
  featured_ads: ClassifiedData[];
}

/**
 * Condição do produto
 */
export type ClassifiedCondition = "new" | "like_new" | "good" | "fair" | "poor";

/**
 * Status do classificado
 */
export type ClassifiedStatus = "active" | "inactive" | "sold" | "pending" | "rejected";
