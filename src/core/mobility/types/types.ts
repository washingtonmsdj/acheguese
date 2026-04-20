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
  origin_address: string;
  destination_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  status:
    | "pending"
    | "driver_assigned"
    | "driver_on_the_way"
    | "driver_arrived"
    | "passenger_on_board"
    | "in_progress"
    | "completed"
    | "cancelled";
  estimated_price: number;
  final_price?: number;
  estimated_duration: number;
  actual_duration?: number;
  distance_km: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
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
