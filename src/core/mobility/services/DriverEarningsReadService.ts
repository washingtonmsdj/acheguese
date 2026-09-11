import {
  invokeSupabaseBroker,
  type SupabaseBrokerClient,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export interface DriverEarningReadRow {
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  final_price: number | null;
  actual_fare: number | null;
}

type EarningsPayload = { earnings?: unknown };
type DriverEarningsAction = "getDriverEarningsHistory";

const FUNCTION_NAME = "mobility-rpc";
const SERVICE_NAME = "DriverEarningsReadService";

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapEarningRow(value: unknown): DriverEarningReadRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const createdAt = nullableString(row.created_at);
  const updatedAt = nullableString(row.updated_at);
  if (!createdAt || !updatedAt) return null;

  return {
    created_at: createdAt,
    completed_at: nullableString(row.completed_at),
    updated_at: updatedAt,
    final_price: nullableNumber(row.final_price),
    actual_fare: nullableNumber(row.actual_fare),
  };
}

export class DriverEarningsReadService {
  /**
   * `driverProfileId` is intentionally not sent to the server. It remains in
   * the client API only as a local query/cache selector while migration callers
   * converge. mobility-rpc derives the driver from the authenticated user.
   */
  static async list(
    _driverProfileId: string,
    options: { sinceIso?: string; limit?: number } = {},
    client?: SupabaseBrokerClient,
  ): Promise<DriverEarningReadRow[]> {
    const data = await invokeSupabaseBroker<EarningsPayload, DriverEarningsAction>({
      action: "getDriverEarningsHistory",
      client,
      functionName: FUNCTION_NAME,
      noDataMessage: "Driver earnings broker returned no data",
      params: {
        since: options.sinceIso ?? null,
        limit: options.limit ?? 500,
      },
      serviceName: SERVICE_NAME,
    });

    if (!Array.isArray(data.earnings)) return [];
    return data.earnings
      .map(mapEarningRow)
      .filter((row): row is DriverEarningReadRow => row !== null);
  }

  static async total(
    driverProfileId: string,
    options: { sinceIso?: string; limit?: number } = {},
    client?: SupabaseBrokerClient,
  ): Promise<number> {
    const rows = await this.list(driverProfileId, options, client);
    return rows.reduce(
      (sum, row) => sum + (row.final_price ?? row.actual_fare ?? 0),
      0,
    );
  }
}
