import { AdminDriverPresenceReadService } from "@/core/admin/services/AdminDriverPresenceReadService";
import { QUERYABLE_OPEN_RIDE_STATUSES } from "@/core/mobility/core/RideLifecycleStatus";
import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
};

type MobilityAdminDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const mobilityDb = supabase as unknown as MobilityAdminDbClient;

type CommunityRidePostRow = {
  id: string;
  author_profile_id: string;
  content: string;
  intent: string;
  destination: string;
  moderation_status: string;
  flag_count: number | null;
  interested_count: number | null;
  created_at: string;
  moderated_at: string | null;
  moderation_reason: string | null;
};

type CommunityPostFlagRow = {
  id: string;
  reason: string;
  description: string | null;
  flagged_by: string;
  created_at: string;
};

type DriverDataWithProfileRow = Pick<
  Tables<"driver_data">,
  "id" | "profile_id" | "rating" | "total_rides" | "is_verified"
> & {
  profiles?: { user_id: string | null } | readonly { user_id: string | null }[] | null;
};

type DriverAnalyticsProfileRelation = {
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type DriverAnalyticsDirectoryRow = Pick<
  Tables<"driver_data">,
  | "profile_id"
  | "rating"
  | "total_rides"
  | "is_verified"
  | "vehicle_model"
  | "vehicle_plate"
> & {
  profiles:
    | DriverAnalyticsProfileRelation
    | readonly DriverAnalyticsProfileRelation[]
    | null;
};

type DriverCapabilityRow = Pick<Tables<"driver_data">, "profile_id" | "can_do_delivery">;
type RideRequestRow = Tables<"ride_requests">;
type RideRatingRow = Pick<Tables<"ride_ratings">, "rating">;
type ProfileRow = Tables<"profiles">;

export interface RawCommunityPost {
  id: string;
  author_profile_id: string;
  content: string;
  intent: string;
  destination: string;
  moderation_status: string;
  flag_count: number;
  interested_count: number;
  created_at: string;
  moderated_at?: string;
  moderation_reason?: string;
}

export interface RawPostFlag {
  id: string;
  reason: string;
  description?: string;
  flagged_by: string;
  created_at: string;
}

export interface RawDriverProfile {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  total_rides: number;
  is_verified: boolean;
}

export interface AdminDriverAnalyticsRow {
  id: string;
  profile_id: string;
  name: string;
  display_name: string;
  avatar_url: string | null;
  rating: number;
  avg_rating: number;
  total_rides: number;
  is_verified: boolean;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  profile: {
    name: string;
    avatar_url: string | null;
  };
}

export interface RawRide {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string;
  status: string;
  pickup_location?: string;
  dropoff_location?: string;
  final_price?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface RawActiveDriver {
  profile_id: string;
  is_online: boolean;
  is_available: boolean | null;
  can_do_delivery: boolean;
  last_location_update: string | null;
  current_location: { lat: number; lng: number } | null;
}

export interface RawActiveRide {
  id: string;
  status: string;
  ride_mode: string;
  driver_profile_id: string | null;
  passenger_profile_id: string;
  updated_at: string;
  created_at: string;
}

function normalizeProfilesUserId(
  value: DriverDataWithProfileRow["profiles"],
): string | null {
  if (isProfilesArray(value)) {
    return value[0]?.user_id ?? null;
  }
  return value?.user_id ?? null;
}

function isProfilesArray(
  value: DriverDataWithProfileRow["profiles"],
): value is readonly { user_id: string | null }[] {
  return Array.isArray(value);
}

function normalizeDriverAnalyticsProfile(
  value: DriverAnalyticsDirectoryRow["profiles"],
): DriverAnalyticsProfileRelation | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value as DriverAnalyticsProfileRelation | null;
}

function mapCommunityPost(row: CommunityRidePostRow): RawCommunityPost {
  return {
    id: row.id,
    author_profile_id: row.author_profile_id,
    content: row.content,
    intent: row.intent,
    destination: row.destination,
    moderation_status: row.moderation_status,
    flag_count: row.flag_count ?? 0,
    interested_count: row.interested_count ?? 0,
    created_at: row.created_at,
    moderated_at: row.moderated_at ?? undefined,
    moderation_reason: row.moderation_reason ?? undefined,
  };
}

function mapPostFlag(row: CommunityPostFlagRow): RawPostFlag {
  return {
    id: row.id,
    reason: row.reason,
    description: row.description ?? undefined,
    flagged_by: row.flagged_by,
    created_at: row.created_at,
  };
}

function mapDriverProfile(row: DriverDataWithProfileRow): RawDriverProfile | null {
  if (!row.profile_id) return null;

  return {
    id: row.id,
    profile_id: row.profile_id,
    user_id: normalizeProfilesUserId(row.profiles) ?? "",
    rating: row.rating ?? 0,
    total_rides: row.total_rides ?? 0,
    is_verified: row.is_verified ?? false,
  };
}

function mapDriverAnalyticsRow(
  row: DriverAnalyticsDirectoryRow,
): AdminDriverAnalyticsRow | null {
  if (!row.profile_id) return null;

  const profile = normalizeDriverAnalyticsProfile(row.profiles);
  const name = profile?.display_name ?? profile?.name ?? "Motorista";
  const rating = row.rating ?? 0;

  return {
    id: row.profile_id,
    profile_id: row.profile_id,
    name,
    display_name: name,
    avatar_url: profile?.avatar_url ?? null,
    rating,
    avg_rating: rating,
    total_rides: row.total_rides ?? 0,
    is_verified: row.is_verified ?? false,
    vehicle_model: row.vehicle_model ?? null,
    vehicle_plate: row.vehicle_plate ?? null,
    profile: {
      name,
      avatar_url: profile?.avatar_url ?? null,
    },
  };
}

export class MobilityAdminQueryService {
  static async getCommunityPosts(
    filter?: "pending" | "approved" | "rejected" | "flagged",
  ): Promise<RawCommunityPost[]> {
    try {
      let query = mobilityDb
        .from<CommunityRidePostRow>("community_ride_posts")
        .select(
          "id, author_profile_id, content, intent, destination, moderation_status, flag_count, interested_count, created_at, moderated_at, moderation_reason",
        )
        .order("created_at", { ascending: false });

      if (filter) {
        query = query.eq("moderation_status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapCommunityPost);
    } catch (error) {
      logger.error("MobilityAdminQueryService.getCommunityPosts", error as Error);
      throw error;
    }
  }

  static async getPostFlags(postId: string): Promise<RawPostFlag[]> {
    try {
      const { data, error } = await mobilityDb
        .from<CommunityPostFlagRow>("community_post_flags")
        .select("id, reason, description, flagged_by, created_at")
        .eq("post_id", postId);

      if (error) throw error;
      return (data ?? []).map(mapPostFlag);
    } catch (error) {
      logger.error("MobilityAdminQueryService.getPostFlags", error as Error, { postId });
      throw error;
    }
  }

  static async getDriversRaw(): Promise<RawDriverProfile[]> {
    try {
      const { data, error } = await mobilityDb
        .from<DriverDataWithProfileRow>("driver_data")
        .select(
          `
            id,
            profile_id,
            rating,
            total_rides,
            is_verified,
            profiles!inner(user_id)
          `,
        )
        .order("total_rides", { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map(mapDriverProfile)
        .filter((driver): driver is RawDriverProfile => Boolean(driver));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getDriversRaw", error as Error);
      throw error;
    }
  }

  /**
   * Temporary admin analytics directory while G104 backend aggregation is pending.
   * It is intentionally explicit and presence-free: operational presence is read
   * from driver_availability by AdminDriverPresenceReadService.
   */
  static async getAllDriversComplete(): Promise<AdminDriverAnalyticsRow[]> {
    try {
      const { data, error } = await mobilityDb
        .from<DriverAnalyticsDirectoryRow>("driver_data")
        .select(
          "profile_id, rating, total_rides, is_verified, vehicle_model, vehicle_plate, profiles!inner(name, display_name, avatar_url)",
        );

      if (error) throw error;
      return (data ?? [])
        .map(mapDriverAnalyticsRow)
        .filter((driver): driver is AdminDriverAnalyticsRow => Boolean(driver));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getAllDriversComplete", error as Error);
      throw error;
    }
  }

  static async getRideStats(): Promise<{ status: string; final_price?: number }[]> {
    try {
      const { data, error } = await mobilityDb
        .from<Pick<RideRequestRow, "status" | "final_price">>("ride_requests")
        .select("status, final_price");

      if (error) throw error;
      return (data ?? []).map((ride) => ({
        status: ride.status,
        final_price: ride.final_price ?? undefined,
      }));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getRideStats", error as Error);
      throw error;
    }
  }

  static async getRecentRides(limit = 50): Promise<RawRide[]> {
    try {
      const { data, error } = await mobilityDb
        .from<RideRequestRow>("ride_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as RawRide[];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getRecentRides", error as Error, { limit });
      throw error;
    }
  }

  static async getUserRides(userId: string): Promise<RawRide[]> {
    try {
      const { data: profiles, error: profileError } = await mobilityDb
        .from<Pick<ProfileRow, "id">>("profiles")
        .select("id")
        .eq("user_id", userId);

      if (profileError) throw profileError;

      const profileIds = (profiles ?? []).map((profile) => profile.id);
      if (profileIds.length === 0) {
        return [];
      }

      const rideFilters = profileIds
        .flatMap((profileId) => [
          `passenger_profile_id.eq.${profileId}`,
          `driver_profile_id.eq.${profileId}`,
        ])
        .join(",");

      const { data, error } = await mobilityDb
        .from<RideRequestRow>("ride_requests")
        .select("*")
        .or(rideFilters)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as RawRide[];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getUserRides", error as Error, { userId });
      throw error;
    }
  }

  static async getAllRideRatings(): Promise<{ rating: number }[]> {
    try {
      const { data, error } = await mobilityDb
        .from<RideRatingRow>("ride_ratings")
        .select("rating");

      if (error) throw error;
      return (data ?? []).map((rating) => ({ rating: rating.rating }));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getAllRideRatings", error as Error);
      throw error;
    }
  }

  static async getActiveDriversForMap(): Promise<RawActiveDriver[]> {
    try {
      const presence = await AdminDriverPresenceReadService.listOnline();
      if (presence.length === 0) return [];

      const profileIds = presence.map((row) => row.profile_id);
      const { data: capabilities, error } = await mobilityDb
        .from<DriverCapabilityRow>("driver_data")
        .select("profile_id, can_do_delivery")
        .in("profile_id", profileIds);

      if (error) throw error;
      const capabilityByProfile = new Map(
        (capabilities ?? []).map((row) => [row.profile_id, row]),
      );

      return presence.map((driver) => ({
        profile_id: driver.profile_id,
        is_online: driver.is_online,
        is_available: driver.is_available,
        can_do_delivery: Boolean(
          capabilityByProfile.get(driver.profile_id)?.can_do_delivery,
        ),
        last_location_update: driver.last_location_update,
        current_location:
          driver.current_lat !== null && driver.current_lng !== null
            ? { lat: driver.current_lat, lng: driver.current_lng }
            : null,
      }));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getActiveDriversForMap", error as Error);
      throw error;
    }
  }

  static async getActiveRidesForMap(): Promise<RawActiveRide[]> {
    try {
      const { data, error } = await mobilityDb
        .from<
          Pick<
            RideRequestRow,
            | "id"
            | "status"
            | "ride_mode"
            | "driver_profile_id"
            | "passenger_profile_id"
            | "updated_at"
            | "created_at"
          >
        >("ride_requests")
        .select(
          "id, status, ride_mode, driver_profile_id, passenger_profile_id, updated_at, created_at",
        )
        .in("status", QUERYABLE_OPEN_RIDE_STATUSES)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((ride) => ({
        id: ride.id,
        status: ride.status,
        ride_mode: ride.ride_mode,
        driver_profile_id: ride.driver_profile_id,
        passenger_profile_id: ride.passenger_profile_id,
        updated_at: ride.updated_at,
        created_at: ride.created_at,
      }));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getActiveRidesForMap", error as Error);
      throw error;
    }
  }
}
