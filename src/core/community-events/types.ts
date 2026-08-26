import type { Json, Tables } from "@/integrations/supabase";
import type { TerritoryFilter } from "@/core/location/types";

export type EventRow = Tables<"events">;
export type EventParticipantTableRow = Tables<"event_participants">;

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

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  end_date?: string;
  event_date?: string;
  location: string;
  category: string;
  image_url?: string;
  subtitle?: string;
  tags?: string[];
  duration_minutes?: number;
  timezone?: string;
  location_type?: PublicEventLocationType;
  venue_name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  online_url?: string;
  online_platform?: string;
  location_instructions?: string;
  is_free?: boolean;
  price?: number;
  waitlist_enabled?: boolean;
  requirements?: string[];
  what_to_bring?: string[];
  age_restriction?: string;
  dress_code?: string;
  accessibility_info?: string;
  banner_image_url?: string;
  video_url?: string;
  gallery?: Json[];
  schedule?: Json[];
  faq?: Json[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  features?: Record<string, Json>;
  organizer_contact?: Record<string, Json>;
  max_participants?: number;
  latitude?: number;
  longitude?: number;
  coordinate_source?: PublicEventCoordinateSource;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface EventParticipantProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface EventParticipantRow {
  profile_id: string;
  joined_at: string;
  checked_in_at: string | null;
  profiles: EventParticipantProfile | EventParticipantProfile[] | null;
}

export interface EventCheckInByCodeResult {
  profileId: string;
  checkedInAt: string;
}
