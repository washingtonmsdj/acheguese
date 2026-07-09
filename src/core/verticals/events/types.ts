import type { Json, Tables } from "@/integrations/supabase";
import type { TerritoryFilter } from "@/core/location/types";

export type EventRow = Tables<"events">;

export type PublicEventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type PublicEventLocationType = "physical" | "online" | "hybrid";
export type PublicEventCoordinateSource = "exact" | "geocoded" | "approximate";
export type EventSortBy = "date" | "created_at" | "current_participants";
export type EventSortOrder = "asc" | "desc";

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date?: string | null;
  event_date?: string | null;
  location: string;
  location_id?: string | null;
  organizer_profile_id: string;
  category: string;
  image_url?: string | null;
  subtitle?: string | null;
  tags?: string[] | null;
  duration_minutes?: number | null;
  timezone?: string | null;
  location_type?: PublicEventLocationType | null;
  venue_name?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  online_url?: string | null;
  online_platform?: string | null;
  location_instructions?: string | null;
  is_free?: boolean | null;
  price?: number | null;
  waitlist_enabled?: boolean | null;
  requirements?: string[] | null;
  what_to_bring?: string[] | null;
  age_restriction?: string | null;
  dress_code?: string | null;
  accessibility_info?: string | null;
  banner_image_url?: string | null;
  video_url?: string | null;
  gallery?: Json[] | null;
  schedule?: Json[] | null;
  faq?: Json[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  features?: Record<string, Json> | null;
  organizer_contact?: Record<string, Json> | null;
  published_at?: string | null;
  max_participants?: number | null;
  current_participants: number;
  status: PublicEventStatus;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinate_source?: PublicEventCoordinateSource | null;
}

export interface EventFilters {
  category?: string;
  status?: PublicEventStatus;
  statuses?: readonly PublicEventStatus[];
  upcoming?: boolean;
  territoryFilter?: TerritoryFilter;
}

export interface EventPageInput extends EventFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: EventSortBy;
  sortOrder?: EventSortOrder;
}

export interface EventPageOutput {
  items: PublicEvent[];
  totalCount: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface EventBoundsOptions {
  limit?: number;
  statuses?: readonly PublicEventStatus[];
  territoryFilter?: TerritoryFilter;
}
