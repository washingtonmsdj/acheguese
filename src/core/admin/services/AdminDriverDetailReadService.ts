import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  AdminDriverPresenceReadService,
  type AdminDriverPresenceRow,
} from "./AdminDriverPresenceReadService";

type QueryError = { message?: string | null; code?: string | null } | null;

type QuerySingleResult<TRow> = {
  data: TRow | null;
  error: QueryError;
};

type QueryBuilder<TRow> = {
  select(columns?: string): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  maybeSingle(): Promise<QuerySingleResult<TRow>>;
};

type DriverDetailDbClient = {
  from<TRow = Record<string, unknown>>(table: string): QueryBuilder<TRow>;
};

const driverDetailDb = supabase as unknown as DriverDetailDbClient;

interface DriverRegistrationAndStatsRow {
  profile_id: string;
  license_number: string | null;
  license_category: string | null;
  license_expiry: string | null;
  license_state: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_color: string | null;
  documents_verified: boolean | null;
  documents_verified_at: string | null;
  background_check_status: string | null;
  background_check_date: string | null;
  rating: number | null;
  total_rides: number | null;
  total_rides_completed: number | null;
  total_rides_cancelled: number | null;
  acceptance_rate: number | null;
  cancellation_rate: number | null;
  can_do_rides: boolean | null;
  can_do_delivery: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDriverDetail extends DriverRegistrationAndStatsRow {
  is_online: boolean;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  last_seen_at: string | null;
  active_ride_id: string | null;
  active_ride_mode: string | null;
}

const DRIVER_DETAIL_SELECT = [
  "profile_id",
  "license_number",
  "license_category",
  "license_expiry",
  "license_state",
  "vehicle_type",
  "vehicle_plate",
  "vehicle_model",
  "vehicle_year",
  "vehicle_color",
  "documents_verified",
  "documents_verified_at",
  "background_check_status",
  "background_check_date",
  "rating",
  "total_rides",
  "total_rides_completed",
  "total_rides_cancelled",
  "acceptance_rate",
  "cancellation_rate",
  "can_do_rides",
  "can_do_delivery",
  "created_at",
  "updated_at",
].join(",");

function emptyPresence(profileId: string): AdminDriverPresenceRow {
  return {
    profile_id: profileId,
    is_online: false,
    is_available: false,
    current_lat: null,
    current_lng: null,
    last_location_update: null,
    last_seen_at: null,
    active_ride_id: null,
    active_ride_mode: null,
  };
}

/**
 * Read model for the Admin driver detail screen.
 *
 * Registration, verification and aggregate ride counters remain sourced from
 * `driver_data`. Operational presence and live location are overlaid only from
 * `driver_availability`; this service deliberately never selects the retired
 * presence mirror fields from `driver_data`.
 */
export class AdminDriverDetailReadService {
  static async get(profileId: string): Promise<AdminDriverDetail | null> {
    try {
      const [{ data, error }, presenceRows] = await Promise.all([
        driverDetailDb
          .from<DriverRegistrationAndStatsRow>("driver_data")
          .select(DRIVER_DETAIL_SELECT)
          .eq("profile_id", profileId)
          .maybeSingle(),
        AdminDriverPresenceReadService.list([profileId]),
      ]);

      if (error) throw error;
      if (!data) return null;

      const presence = presenceRows[0] ?? emptyPresence(profileId);
      return {
        ...data,
        is_online: presence.is_online,
        is_available: presence.is_available,
        current_lat: presence.current_lat,
        current_lng: presence.current_lng,
        last_location_update: presence.last_location_update,
        last_seen_at: presence.last_seen_at,
        active_ride_id: presence.active_ride_id,
        active_ride_mode: presence.active_ride_mode,
      };
    } catch (error) {
      logger.error("AdminDriverDetailReadService.get", error as Error, { profileId });
      throw error;
    }
  }
}
