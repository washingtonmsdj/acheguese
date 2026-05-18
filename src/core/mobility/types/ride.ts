export interface MobilityRide {
  id: string;
  status: string;
  type?: string;
  ride_mode?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  final_price?: number | null;
  actual_fare?: number | null;
  price?: number | null;
  suggested_price?: number | null;
  passenger?: {
    name?: string;
    rating?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
