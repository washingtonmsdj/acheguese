import type { Tables } from "@/integrations/supabase";
import type { RideRequest } from "../types/types";
import { toRideRequestContract } from "./RideRequestContractMapper";

export type RideRequestReadRow = Pick<
  Tables<"ride_requests">,
  | "id"
  | "passenger_profile_id"
  | "driver_profile_id"
  | "source_id"
  | "ride_mode"
  | "origin"
  | "destination"
  | "origin_lat"
  | "origin_lng"
  | "destination_lat"
  | "destination_lng"
  | "status"
  | "suggested_price"
  | "final_price"
  | "driver_assigned_at"
  | "passenger_boarded_at"
  | "payment_method"
  | "departure_time"
  | "observation"
  | "driver_accepted_at"
  | "started_at"
  | "completed_at"
  | "passenger_confirmed_at"
  | "cancelled_at"
  | "created_at"
  | "updated_at"
> & {
  cancellation_reason: string | null;
};

export const RIDE_REQUEST_READ_SELECT = [
  "id",
  "passenger_profile_id",
  "driver_profile_id",
  "source_id",
  "ride_mode",
  "origin",
  "destination",
  "origin_lat",
  "origin_lng",
  "destination_lat",
  "destination_lng",
  "status",
  "suggested_price",
  "final_price",
  "driver_assigned_at",
  "passenger_boarded_at",
  "payment_method",
  "departure_time",
  "observation",
  "driver_accepted_at",
  "started_at",
  "completed_at",
  "passenger_confirmed_at",
  "cancelled_at",
  "cancellation_reason",
  "created_at",
  "updated_at",
].join(", ");

/**
 * Converts the bounded database projection into the public/runtime RideRequest
 * contract. The mapper declares the generated ride row, while this bounded
 * projection contains every field it reads. Keep the unavoidable widening at
 * this single database read boundary instead of fabricating unselected fields.
 */
export function toRideRequestReadModel(row: RideRequestReadRow): RideRequest {
  return {
    ...toRideRequestContract(row as unknown as Tables<"ride_requests">),
    cancellation_reason: row.cancellation_reason,
  };
}
