import type { RideRequest } from "../types/types";
import {
  toRideRequestContract,
  type RideRequestContractSource,
} from "./RideRequestContractMapper";

export type RideRequestReadRow = RideRequestContractSource & {
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

export function toRideRequestReadModel(row: RideRequestReadRow): RideRequest {
  return {
    ...toRideRequestContract(row),
    cancellation_reason: row.cancellation_reason,
  };
}
