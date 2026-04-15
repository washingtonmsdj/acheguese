// Types for the Mobilidade do Bairro (neighborhood mobility) module

export type RideType =
  | "viagem"
  | "entrega"
  | "carona_compartilhada"
  | "agendada";
export type RideStatus =
  | "pending"
  | "driver_assigned"
  | "driver_on_the_way"
  | "driver_arrived"
  | "passenger_on_board"
  | "in_progress"
  | "completed"
  | "cancelled";
export type DriverPlan = "padrao" | "prioritario";
export type PaymentMethod = "pix" | "dinheiro";
export type NeighborRank = "bronze" | "prata" | "ouro" | "elite";

export interface Driver {
  id: string;
  profile_id: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_year: number;
  cnh_image_url?: string;
  is_verified: boolean;
  is_online: boolean;
  subscription_plan: DriverPlan;
  subscription_active: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
  created_at: string;
  profile?: {
    name: string;
    avatar_url: string;
    neighborhood: string;
    city: string;
  };
}

export interface RideRequest {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string;
  origin: string;
  origin_details?: string;
  destination: string;
  destination_details?: string;
  departure_time: string;
  requested_time?: string;
  suggested_price: number;
  final_price?: number;
  price?: number;
  type: RideType;
  payment_method?: PaymentMethod;
  observation?: string;
  status: RideStatus;
  // Coordenadas geográficas
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  search_radius_km?: number;
  // Timestamps da máquina de estados
  driver_assigned_at?: string;
  driver_on_the_way_at?: string;
  driver_arrived_at?: string;
  passenger_on_board_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Carona compartilhada
  shared_ride_id?: string;
  available_seats?: number;
  // Viagem agendada
  is_scheduled?: boolean;
  scheduled_for?: string;
  // Dados relacionados
  passenger?: {
    id: string;
    name: string;
    avatar_url: string;
    neighborhood: string;
    phone?: string;
    pontos?: number;
    rank?: NeighborRank;
  };
  driver?: Driver;
  rating?: RideRating;
  passenger_confirmed?: boolean;
}

export interface SharedRide {
  id: string;
  origin_region: string;
  destination_region: string;
  departure_time: string;
  ride_ids: string[];
  suggested_savings: number;
  driver_bonus: number;
  status: "pending_match" | "matched" | "completed";
  created_at: string;
}

export interface RideRating {
  id: string;
  ride_id: string;
  from_profile_id: string;
  to_profile_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface NeighborProfile {
  id: string;
  name: string;
  avatar_url?: string;
  neighborhood: string;
  rank: NeighborRank;
  points: number;
  total_rides: number;
  avg_rating: number;
  member_since: string;
}

export interface DriverEarnings {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface DriverStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  avgRating: number;
  acceptanceRate: number;
  onlineHoursToday: number;
}

export interface MobilidadeFilters {
  type: RideType | "all";
  status: RideStatus | "all";
}

export interface EmergencyAlert {
  id: string;
  ride_id: string;
  triggered_by: string;
  location?: { lat: number; lng: number };
  created_at: string;
}
