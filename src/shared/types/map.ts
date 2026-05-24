import { RIDE_STATUS } from "@/shared/types/constants";
// ============================================
// MAP TYPES - Sistema de Mapas AAA
// ============================================

export type MarkerType =
  | "business"
  | "service"
  | "classificado"
  | "evento"
  | "alerta"
  | "achado_perdido"
  | "mobilidade"
  | "filho";

export type TravelMode = "foot" | "car" | "bike";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export type ContributionType =
  | "new_location"
  | "report_problem"
  | "suggest_edit"
  | "add_photo"
  | "add_review";

export type NotificationType =
  | "enter_area"
  | "new_event"
  | "new_alert"
  | "new_business"
  | "promotion";

export type CheckinVisibility = "public" | "friends" | "private";

// ── Core Map Item ──────────────────────────
export interface MapItem {
  id: string;
  type: MarkerType;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  rating?: number;
  whatsapp?: string;
  extra?: string;
  image?: string;
  status?: string;
  updatedAt?: string;
  isPremium?: boolean;
  isOpen?: boolean;
  priceRange?: PriceRange;
  distance?: number; // Calculado dinamicamente
}

// ── Saved Location ─────────────────────────
export interface SavedLocation {
  id: string;
  user_id: string;
  location_type: MarkerType;
  location_id?: string;
  custom_name?: string;
  custom_description?: string;
  latitude: number;
  longitude: number;
  notes?: string;
  tags?: string[];
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedLocationInput {
  location_type: MarkerType;
  location_id?: string;
  custom_name?: string;
  custom_description?: string;
  latitude: number;
  longitude: number;
  notes?: string;
  tags?: string[];
  color?: string;
  icon?: string;
}

// ── Visit History ──────────────────────────
export interface VisitHistory {
  id: string;
  user_id: string;
  location_type: MarkerType;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  duration_minutes?: number;
  rating?: number;
}

export interface CreateVisitInput {
  location_type: MarkerType;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  duration_minutes?: number;
  rating?: number;
}

// ── Saved Route ────────────────────────────
export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  origin_lat: number;
  origin_lng: number;
  origin_name?: string;
  destination_lat: number;
  destination_lng: number;
  destination_name?: string;
  waypoints?: Array<{ lat: number; lng: number; name?: string }>;
  travel_mode: TravelMode;
  distance_km?: number;
  duration_minutes?: number;
  favorite: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface CreateSavedRouteInput {
  name: string;
  description?: string;
  origin_lat: number;
  origin_lng: number;
  origin_name?: string;
  destination_lat: number;
  destination_lng: number;
  destination_name?: string;
  waypoints?: Array<{ lat: number; lng: number; name?: string }>;
  travel_mode: TravelMode;
  distance_km?: number;
  duration_minutes?: number;
  favorite?: boolean;
}

// ── Geo Notification ───────────────────────
export interface GeoNotification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  active: boolean;
  triggered_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface CreateGeoNotificationInput {
  notification_type: NotificationType;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  expires_at?: string;
}

// ── User Contribution ──────────────────────
export interface UserContribution {
  id: string;
  user_id: string;
  contribution_type: ContributionType;
  location_type?: MarkerType;
  location_id?: string;
  latitude?: number;
  longitude?: number;
  title: string;
  description?: string;
  photos?: string[];
  status: "pending" | "approved" | "rejected";
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  created_at: string;
}

export interface CreateContributionInput {
  contribution_type: ContributionType;
  location_type?: MarkerType;
  location_id?: string;
  latitude?: number;
  longitude?: number;
  title: string;
  description?: string;
  photos?: string[];
}

// ── Check-in ───────────────────────────────
export interface Checkin {
  id: string;
  user_id: string;
  location_type: MarkerType;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  comment?: string;
  photo_url?: string;
  visibility: CheckinVisibility;
  created_at: string;
}

export interface CreateCheckinInput {
  location_type: MarkerType;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  comment?: string;
  photo_url?: string;
  visibility?: CheckinVisibility;
}

// ── Usage Stats ────────────────────────────
export interface MapUsageStats {
  id: string;
  user_id: string;
  date: string;
  total_views: number;
  total_searches: number;
  total_routes: number;
  total_checkins: number;
  locations_explored: number;
  distance_traveled_km: number;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface MapUserStatsSummary {
  user_id: string;
  total_views: number;
  total_searches: number;
  total_routes: number;
  total_checkins: number;
  total_locations_explored: number;
  total_distance_km: number;
  total_time_minutes: number;
}

// ── Badges ─────────────────────────────────
export interface ExplorationBadge {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  requirement_type:
    | "locations_visited"
    | "distance_traveled"
    | "checkins"
    | "contributions"
    | "routes_completed";
  requirement_value: number;
  points: number;
  rarity: BadgeRarity;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: ExplorationBadge; // Populated via join
}

// ── Filters ────────────────────────────────
export interface MapFilters {
  types: Set<MarkerType>;
  minRating?: number;
  maxDistance?: number; // em km
  openNow?: boolean;
  priceRange?: PriceRange[];
  isPremium?: boolean;
  searchText?: string;
}

// ── Route Info ─────────────────────────────
export interface RouteInfo {
  distance: string;
  duration: string;
  mode: TravelMode;
}

// ── Popular Location ───────────────────────
export interface PopularLocation {
  location_type: MarkerType;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visit_count: number;
  avg_rating?: number;
  last_visit: string;
}

// ── Map Bounds ─────────────────────────────
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ── Marker Config ──────────────────────────
export interface MarkerConfig {
  abbr: string;
  label: string;
  color: string;
  hsl: string;
}

// ── API Response Types ─────────────────────
export interface MapDataResponse {
  items: MapItem[];
  total: number;
  bounds?: MapBounds;
}

export interface BadgeProgressResponse {
  badge: ExplorationBadge;
  current_value: number;
  progress_percentage: number;
  is_earned: boolean;
}
