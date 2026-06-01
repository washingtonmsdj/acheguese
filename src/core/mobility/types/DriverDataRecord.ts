export interface DriverDataRecord {
  [key: string]: unknown;
  profile_id: string | null;
  is_online: boolean | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  is_suspended?: boolean | null;
  license_number?: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  rating: number | null;
  total_rides: number | null;
  total_rides_completed: number | null;
  total_rides_cancelled: number | null;
  acceptance_rate: number | null;
  cancellation_rate: number | null;
  can_do_rides?: boolean | null;
  can_do_delivery?: boolean | null;
}
