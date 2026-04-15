/**
 * 🏆 CLASSIFIED TYPES - Tipos Centralizados SSOT
 *
 * ✅ Baseado na tabela classifieds
 * ✅ Tipagem completa para anúncios classificados
 * ✅ URLs canônicas com slug e public_id
 */

export interface Classified {
  id: string;
  titulo: string;
  description: string;
  price: number;
  photos: string[];
  category: string;
  status: string;
  /** Slug derivado do título, usado na URL canônica */
  slug: string;
  /** Identificador público estável (8 chars), âncora da resolução */
  public_id: string;
  /** FK para classified_categories */
  category_id?: string;
  /** FK para classified_subcategories */
  subcategory_id?: string;
  /** @deprecated usar location_id — mantido para compatibilidade com dados legados */
  neighborhood: string;
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  seller_id: string;
  created_at: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
}

export interface ClassifiedWithSeller extends Classified {
  vendedor_name: string;
  vendedor_avatar: string;
  vendedor_neighborhood: string;
  vendedor_whatsapp?: string;
  vendedor_rating: number;
  vendedor_reviews_count: number;
}

export interface CreateClassifiedInput {
  titulo: string;
  description: string;
  price: number;
  category: string;
  /** SSOT territorial — FK para locations.id */
  location_id: string;
  /** @deprecated usar location_id — mantido para compatibilidade com dados legados */
  neighborhood?: string;
  seller_id: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

export interface UpdateClassifiedInput {
  titulo?: string;
  description?: string;
  price?: number;
  category?: string;
  /** SSOT territorial — FK para locations.id */
  location_id?: string;
  /** @deprecated usar location_id */
  neighborhood?: string;
  status?: string;
  photos?: string[];
}

export interface SellerRating {
  rating: number;
  reviews_count: number;
}

export interface ClassifiedFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** SSOT territorial — filtra por locations.id */
  location_id?: string;
  /** @deprecated usar location_id */
  neighborhood?: string;
  status?: string;
  search?: string;
  sortBy?: "recente" | "menor_price" | "maior_price";
  limit?: number;
  offset?: number;
}
