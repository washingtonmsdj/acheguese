/**
 * Canonical contracts for national and territorial landing data.
 */

import type { LucideIcon } from 'lucide-react';

export type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
  TerritoryStats,
} from '@/core/landing/services/LandingFeaturedService';

export type NeighborhoodCommunityTabId =
  | 'all'
  | 'feed'
  | 'business'
  | 'services'
  | 'classifieds'
  | 'gastronomy'
  | 'map';

export type NeighborhoodCommunityTab = {
  id: NeighborhoodCommunityTabId;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
};

export type NeighborhoodStreamTone = 'cyan' | 'blue' | 'amber' | 'pink' | 'green';

export type NeighborhoodStreamItem = {
  id: string;
  category: Exclude<NeighborhoodCommunityTabId, 'all'>;
  label: string;
  tone: NeighborhoodStreamTone;
  title: string;
  description: string;
  href: string;
  mediaUrl?: string | null;
  mediaFallback: LucideIcon;
  meta: string;
  engagementLabel?: string;
  lockedActionLabel?: string;
};

export type NeighborhoodStreamGroups = Record<NeighborhoodCommunityTabId, NeighborhoodStreamItem[]>;

export type NeighborhoodStreamMoreConfig = {
  href: string;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
};

export interface CountryData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'country';
  geographic_path: string;
}

export interface StateData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'state';
  geographic_path: string;
  metadata: Record<string, unknown>;
  status?: string;
  city_count: number;
}

export interface CityData {
  id: string;
  name: string;
  full_name: string;
  slug: string;
  type: 'city';
  geographic_path: string;
  parent_id: string;
  parent_name?: string;
  district_count?: number;
  metadata?: Record<string, unknown>;
}

export interface TerritorialGroupData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  anchor_city_id: string;
  anchor_path?: string;
  member_count: number;
}

export interface PlatformStats {
  cities: number;
  districts: number;
  businesses: number;
  services: number;
}

export interface VerifiedBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url?: string;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  city_name?: string;
  geographic_path: string;
}

export interface NationalBusiness {
  id: string;
  name: string;
  category: string;
  logo_url?: string | null;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  slug?: string | null;
  geographic_path?: string | null;
  city_name?: string | null;
}

export interface NationalService {
  id: string;
  name: string;
  category: string;
  logo_url?: string | null;
  rating: number;
  is_verified: boolean;
  price_range: string;
  city_name?: string | null;
}

export interface NationalClassified {
  id: string;
  titulo: string;
  category: string;
  price: number;
  photos: string[];
  created_at: string;
  public_id?: string | null;
  slug?: string | null;
  geographic_path?: string | null;
  category_slug?: string | null;
  subcategory_slug?: string | null;
}

export interface NationalStats {
  businesses: number;
  services: number;
  classifieds: number;
  cities: number;
  districts: number;
}

export interface ActiveTerritoriesWithLanding {
  locations: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    geographic_path: string;
    parent_name?: string | null;
  }>;
  groups: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    member_count: number;
    anchor_path?: string | null;
  }>;
}
