// TIPOS DE MOBILIDADE - GERADO AUTOMATICAMENTE
// Data: 2026-03-14T23:06:43.065Z
// NÃO EDITAR MANUALMENTE

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// TABELAS DE MOBILIDADE
// ============================================

// ride_reports
export interface RideReportsRow {
  id: string;
  ride_id: string;
  reporter_id: string;
  reported_user_id: string | null;
  report_type: string;
  severity: string;
  title: string;
  description: string;
  evidence_urls: string | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideReportsInsert {
  id?: string;
  ride_id: string;
  reporter_id: string;
  reported_user_id?: string | null;
  report_type: string;
  severity: string;
  title: string;
  description: string;
  evidence_urls?: string | null;
  status: string;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RideReportsUpdate {
  id?: string;
  ride_id?: string;
  reporter_id?: string;
  reported_user_id?: string | null;
  report_type?: string;
  severity?: string;
  title?: string;
  description?: string;
  evidence_urls?: string | null;
  status?: string;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ride_requests
export interface RideRequestsRow {
  id: string;
  passenger_profile_id: string;
  driver_profile_id: string;
  origin: string;
  origin_details: string | null;
  destination: string;
  destination_details: string | null;
  departure_time: string;
  suggested_price: number;
  final_price: number;
  type: string;
  payment_method: string;
  observation: string | null;
  status: string;
  accepted_at: string | null;
  started_at: string;
  completed_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance_km: string | null;
  estimated_duration_min: string | null;
  available_seats: number;
  search_radius_km: number;
  max_wait_time_minutes: number;
  driver_assigned_at: string;
  driver_on_the_way_at: string;
  driver_arrived_at: string;
  passenger_on_board_at: string;
  cancelled_by: string | null;
  passenger_rated_driver: boolean;
  driver_rated_passenger: boolean;
  passenger_confirmed: boolean;
  passenger_confirmed_at: string;
  is_shared: boolean;
  max_passengers: number;
  current_passengers: number;
  shared_ride_parent_id: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  share_view_count: number;
  share_is_active: boolean;
}

export interface RideRequestsInsert {
  id?: string;
  passenger_profile_id: string;
  driver_profile_id: string;
  origin: string;
  origin_details?: string | null;
  destination: string;
  destination_details?: string | null;
  departure_time: string;
  suggested_price: number;
  final_price: number;
  type: string;
  payment_method: string;
  observation?: string | null;
  status: string;
  accepted_at?: string | null;
  started_at: string;
  completed_at: string;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance_km?: string | null;
  estimated_duration_min?: string | null;
  available_seats: number;
  search_radius_km: number;
  max_wait_time_minutes: number;
  driver_assigned_at: string;
  driver_on_the_way_at: string;
  driver_arrived_at: string;
  passenger_on_board_at: string;
  cancelled_by?: string | null;
  passenger_rated_driver: boolean;
  driver_rated_passenger: boolean;
  passenger_confirmed: boolean;
  passenger_confirmed_at: string;
  is_shared: boolean;
  max_passengers: number;
  current_passengers: number;
  shared_ride_parent_id?: string | null;
  share_token?: string | null;
  share_expires_at?: string | null;
  share_view_count: number;
  share_is_active: boolean;
}

export interface RideRequestsUpdate {
  id?: string;
  passenger_profile_id?: string;
  driver_profile_id?: string;
  origin?: string;
  origin_details?: string | null;
  destination?: string;
  destination_details?: string | null;
  departure_time?: string;
  suggested_price?: number;
  final_price?: number;
  type?: string;
  payment_method?: string;
  observation?: string | null;
  status?: string;
  accepted_at?: string | null;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  distance_km?: string | null;
  estimated_duration_min?: string | null;
  available_seats?: number;
  search_radius_km?: number;
  max_wait_time_minutes?: number;
  driver_assigned_at?: string;
  driver_on_the_way_at?: string;
  driver_arrived_at?: string;
  passenger_on_board_at?: string;
  cancelled_by?: string | null;
  passenger_rated_driver?: boolean;
  driver_rated_passenger?: boolean;
  passenger_confirmed?: boolean;
  passenger_confirmed_at?: string;
  is_shared?: boolean;
  max_passengers?: number;
  current_passengers?: number;
  shared_ride_parent_id?: string | null;
  share_token?: string | null;
  share_expires_at?: string | null;
  share_view_count?: number;
  share_is_active?: boolean;
}

// driver_location_tracking
export interface DriverLocationTrackingRow {
  id: string;
  driver_profile_id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  speed: string | null;
  heading: string | null;
  accuracy: string | null;
  timestamp: string;
  created_at: string;
}

export interface DriverLocationTrackingInsert {
  id?: string;
  driver_profile_id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  speed?: string | null;
  heading?: string | null;
  accuracy?: string | null;
  timestamp: string;
  created_at?: string;
}

export interface DriverLocationTrackingUpdate {
  id?: string;
  driver_profile_id?: string;
  ride_id?: string;
  latitude?: number;
  longitude?: number;
  speed?: string | null;
  heading?: string | null;
  accuracy?: string | null;
  timestamp?: string;
  created_at?: string;
}

// admin_users
export interface AdminUsersRow {
  id: string;
  profile_id: string;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUsersInsert {
  id?: string;
  profile_id: string;
  granted_by?: string | null;
  granted_at: string;
  revoked_at?: string | null;
  is_active: boolean;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUsersUpdate {
  id?: string;
  profile_id?: string;
  granted_by?: string | null;
  granted_at?: string;
  revoked_at?: string | null;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// driver_routes
export interface DriverRoutesRow {
  id: string;
  driver_profile_id: string;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  departure_time: string;
  days_of_week: string[];
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  payment_method: string;
  category: string;
  active: boolean;
  total_passengers: number;
  created_at: string;
  updated_at: string;
}

export interface DriverRoutesInsert {
  id?: string;
  driver_profile_id: string;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  departure_time: string;
  days_of_week: string[];
  total_seats: number;
  available_seats: number;
  price_per_seat: number;
  payment_method: string;
  category: string;
  active: boolean;
  total_passengers: number;
  created_at?: string;
  updated_at?: string;
}

export interface DriverRoutesUpdate {
  id?: string;
  driver_profile_id?: string;
  name?: string;
  origin?: string;
  destination?: string;
  stops?: string[];
  departure_time?: string;
  days_of_week?: string[];
  total_seats?: number;
  available_seats?: number;
  price_per_seat?: number;
  payment_method?: string;
  category?: string;
  active?: boolean;
  total_passengers?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export type MobilityTables = {
  ride_reports: {
    Row: RideReportsRow;
    Insert: RideReportsInsert;
    Update: RideReportsUpdate;
  };
  ride_requests: {
    Row: RideRequestsRow;
    Insert: RideRequestsInsert;
    Update: RideRequestsUpdate;
  };
  driver_location_tracking: {
    Row: DriverLocationTrackingRow;
    Insert: DriverLocationTrackingInsert;
    Update: DriverLocationTrackingUpdate;
  };
  admin_users: {
    Row: AdminUsersRow;
    Insert: AdminUsersInsert;
    Update: AdminUsersUpdate;
  };
  driver_routes: {
    Row: DriverRoutesRow;
    Insert: DriverRoutesInsert;
    Update: DriverRoutesUpdate;
  };
};

// Type helpers
export type MobilityTable<T extends keyof MobilityTables> =
  MobilityTables[T]["Row"];
export type MobilityInsert<T extends keyof MobilityTables> =
  MobilityTables[T]["Insert"];
export type MobilityUpdate<T extends keyof MobilityTables> =
  MobilityTables[T]["Update"];
