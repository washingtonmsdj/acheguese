import {
  invokeSupabaseBroker,
  type SupabaseBrokerClient,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export interface DriverRideHistoryRow {
  id: string;
  status: string;
  ride_mode: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  delivered_at?: string | null;
  departure_time?: string | null;
  final_price?: number | null;
  actual_fare?: number | null;
  suggested_price?: number | null;
  payment_method?: string | null;
  origin: string;
  destination: string;
  location_precision: "region_label";
  feedback_roles: string[];
  type: "viagem" | "entrega";
  passenger: { name: "Passageiro" | "Cliente" };
}

type HistoryPayload = { rides?: unknown };
type DriverHistoryAction = "getDriverRideHistory";

const FUNCTION_NAME = "mobility-rpc";
const SERVICE_NAME = "DriverRideHistoryReadService";

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapHistoryRow(value: unknown): DriverRideHistoryRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;

  const id = nullableString(row.id);
  const status = nullableString(row.status);
  const createdAt = nullableString(row.created_at);
  const updatedAt = nullableString(row.updated_at);
  const origin = nullableString(row.origin);
  const destination = nullableString(row.destination);
  const precision = nullableString(row.location_precision);
  const rideMode = nullableString(row.ride_mode);

  if (
    !id ||
    !status ||
    !createdAt ||
    !updatedAt ||
    !origin ||
    !destination ||
    precision !== "region_label"
  ) {
    return null;
  }

  const feedbackRoles = Array.isArray(row.feedback_roles)
    ? row.feedback_roles.filter(
        (role): role is string => role === "customer" || role === "merchant",
      )
    : [];
  const isDelivery = rideMode === "motoboy";

  return {
    id,
    status,
    ride_mode: rideMode,
    created_at: createdAt,
    updated_at: updatedAt,
    completed_at: nullableString(row.completed_at),
    delivered_at: nullableString(row.delivered_at),
    departure_time: nullableString(row.departure_time),
    final_price: nullableNumber(row.final_price),
    actual_fare: nullableNumber(row.actual_fare),
    suggested_price: nullableNumber(row.suggested_price),
    payment_method: nullableString(row.payment_method),
    origin,
    destination,
    location_precision: "region_label",
    feedback_roles: feedbackRoles,
    type: isDelivery ? "entrega" : "viagem",
    passenger: { name: isDelivery ? "Cliente" : "Passageiro" },
  };
}

export class DriverRideHistoryReadService {
  /**
   * `driverProfileId` is a non-authoritative local selector retained for
   * compatibility with the active-ride composition layer. It is deliberately
   * never serialized to the broker. The authenticated user identity is the
   * only authority used by mobility-rpc and the database read model.
   */
  static async list(
    _driverProfileId: string,
    options: { limit?: number; offset?: number } = {},
    client?: SupabaseBrokerClient,
  ): Promise<DriverRideHistoryRow[]> {
    const data = await invokeSupabaseBroker<HistoryPayload, DriverHistoryAction>({
      action: "getDriverRideHistory",
      client,
      functionName: FUNCTION_NAME,
      noDataMessage: "Driver history broker returned no data",
      params: {
        limit: options.limit ?? 200,
        offset: options.offset ?? 0,
      },
      serviceName: SERVICE_NAME,
    });

    if (!Array.isArray(data.rides)) return [];
    return data.rides
      .map(mapHistoryRow)
      .filter((ride): ride is DriverRideHistoryRow => ride !== null);
  }
}
