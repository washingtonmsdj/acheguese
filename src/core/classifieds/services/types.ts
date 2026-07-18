/** Canonical domain contracts for Classifieds. */

import type { ClassifiedStatusValue } from "../constants/statuses";

export interface ClassifiedTerritory {
  id: string;
  name: string;
  slug: string;
  type: string;
  parent_id: string | null;
  geographic_path: string;
}

export interface ClassifiedData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  photos: string[];
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  slug?: string;
  public_id?: string;
  category_id?: string;
  subcategory_id?: string;
  location_id: string;
  territory: ClassifiedTerritory;
  category_slug?: string;
  subcategory_slug?: string;
  status: ClassifiedStatusValue;
  is_active: boolean;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
  reach?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClassifiedInput {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  photos: string[];
  location_id: string;
  category_id?: string;
  subcategory_id?: string;
}

export interface UpdateClassifiedInput extends Partial<CreateClassifiedInput> {
  status?: "active" | "inactive" | "sold";
}

export interface NeighborhoodWithClassifiedCount {
  location_id: string;
  location_name: string;
  location_slug: string;
  count: number;
}

export interface SellerWithAds {
  id: string;
  name: string;
  avatar_url: string | null;
  territory_name: string;
  active_ads_count: number;
  featured_ads: ClassifiedData[];
}

export type ClassifiedCondition = "new" | "like_new" | "good" | "fair" | "poor";

export type ClassifiedStatus = ClassifiedStatusValue;
