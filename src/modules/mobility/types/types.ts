/**
 * Tipos para o sistema de mobilidade
 */

export interface DriverProfile {
  id: string;
  user_id: string;
  vehicle_type: string;
  license_plate: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  is_verified: boolean;
  rating: number;
  total_trips: number;
  created_at: string;
  updated_at: string;
}

export interface LocationTracking {
  id: string;
  driver_profile_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  ride_id?: string;
  created_at: string;
}

export interface RideRequest {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string;
  source_id?: string | null;
  ride_mode?: "ride" | "motoboy" | null;
  type?: "ride" | "delivery" | "viagem" | "entrega" | null;
  origin?: string | null;
  destination?: string | null;
  origin_details?: string | null;
  destination_details?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  origin_address: string;
  destination_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  status:
    | "pending"
    | "requested"
    | "searching_driver"
    | "driver_assigned"
    | "driver_accepted"
    | "driver_arriving"
    | "driver_on_the_way"
    | "driver_arrived"
    | "passenger_boarded"
    | "passenger_on_board"
    | "pickup_confirmed"
    | "in_progress"
    | "in_delivery"
    | "delivered"
    | "completed"
    | "cancelled"
    | "failed"
    | "expired"
    | "cancelled_by_passenger"
    | "cancelled_by_driver";
  estimated_price?: number;
  suggested_price?: number;
  final_price?: number;
  estimated_duration?: number;
  actual_duration?: number;
  distance_km?: number;
  rating?: number | null;
  passenger_confirmed?: boolean | null;
  driver_rating?: number | { rating?: number; comment?: string } | null;
  driver_profile?: { name?: string | null } | null;
  driver?: {
    id?: string | null;
    name?: string | null;
    phone?: string | null;
    profile?: {
      avatar_url?: string | null;
    } | null;
    vehicle_model?: string | null;
    vehicle_plate?: string | null;
    rating?: number | null;
  } | null;
  passenger?: {
    id?: string | null;
    name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    neighborhood?: string | null;
    pontos?: number | null;
  } | null;
  share_token?: string | null;
  share_expires_at?: string | null;
  share_is_active?: boolean | null;
  driver_assigned_at?: string | null;
  driver_on_the_way_at?: string | null;
  driver_arrived_at?: string | null;
  passenger_on_board_at?: string | null;
  payment_method: string;
  departure_time?: string | null;
  observation?: string | null;
  payment_status: "pending" | "paid" | "failed";
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  driver_profile_id: string;
  type: "car" | "motorcycle" | "bicycle";
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverStatus {
  driver_profile_id: string;
  is_online: boolean;
  is_available: boolean;
  current_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  last_seen: string;
}

export interface TripStats {
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  average_rating: number;
  total_earnings: number;
  total_distance_km: number;
  total_duration_minutes: number;
}

export interface DriverDashboard {
  driver_profile_id: string;
  stats: TripStats;
  status: DriverStatus;
  recent_trips: RideRequest[];
  earnings_today: number;
  earnings_week: number;
  earnings_month: number;
}
