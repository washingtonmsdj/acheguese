import type { Business } from "@/core/business/types/Business";

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
