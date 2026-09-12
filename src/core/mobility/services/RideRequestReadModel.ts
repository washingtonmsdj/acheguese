import type { Tables } from "@/integrations/supabase";
import type { RideRequest } from "../types/types";
import { toRideRequestContract } from "./RideCanonicalAdapter";

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
>;

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
  "created_at",
  "updated_at",
].join(", ");

/**
 * Converts the bounded database projection into the public/runtime RideRequest
 * contract. The cast is intentionally isolated at this adapter boundary: the
 * canonical adapter only reads fields guaranteed by RIDE_REQUEST_READ_SELECT.
 */
export function toRideRequestReadModel(row: RideRequestReadRow): RideRequest {
  return toRideRequestContract(row as Tables<"ride_requests">);
}
