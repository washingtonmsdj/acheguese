import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
};

type TableClient<TRow> = {
  select(columns: string): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type RideOperationalDbClient = {
  from<TRow = Record<string, unknown>>(table: "ride_requests"): TableClient<TRow>;
};

const rideOperationalDb = supabase as unknown as RideOperationalDbClient;

export interface RideLifecycleContext {
  id: string;
  status: string;
  passenger_profile_id: string;
  driver_profile_id: string | null;
  ride_mode: string | null;
}

export interface FailedDeliveryOperationalContext extends RideLifecycleContext {
  failed_delivery_metadata: Record<string, unknown> | null;
}

const LIFECYCLE_SELECT =
  "id, status, passenger_profile_id, driver_profile_id, ride_mode";
const FAILED_DELIVERY_SELECT =
  `${LIFECYCLE_SELECT}, failed_delivery_metadata`;

/**
 * Narrow read boundary for lifecycle/actor decisions.
 *
 * This service deliberately does not expose route, contact, proof, price or
 * other ride payload fields. UI read models and delivery/order projections own
 * those concerns separately.
 */
export class RideOperationalContextReadService {
  static async getLifecycle(
    rideId: string,
  ): Promise<RideLifecycleContext | null> {
    try {
      const { data, error } = await rideOperationalDb
        .from<RideLifecycleContext>("ride_requests")
        .select(LIFECYCLE_SELECT)
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("RideOperationalContextReadService.getLifecycle", error as Error, {
        rideId,
      });
      throw error;
    }
  }

  static async getFailedDelivery(
    rideId: string,
  ): Promise<FailedDeliveryOperationalContext | null> {
    try {
      const { data, error } = await rideOperationalDb
        .from<FailedDeliveryOperationalContext>("ride_requests")
        .select(FAILED_DELIVERY_SELECT)
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(
        "RideOperationalContextReadService.getFailedDelivery",
        error as Error,
        { rideId },
      );
      throw error;
    }
  }
}
