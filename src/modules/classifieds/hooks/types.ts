export interface ClassificadosFilters {
  category: string;
  search: string;
  sortBy: string;
  sort: string;
  priceMin: string;
  priceMax: string;
}

/**
 * Vendedor com anúncios destacados
 */
export interface VendedorWithAds {
  id: string;
  name: string;
  avatar_url: string | null;
  neighborhood: string;
  active_ads_count: number;
  featured_ads: Array<{
    id: string;
    title: string;
    price: number;
    photos: string[];
  }>;
}
