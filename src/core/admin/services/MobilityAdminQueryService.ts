/**
 * MobilityAdminQueryService
 *
 * SSOT para consultas administrativas do domínio mobility.
 * Centraliza o acesso às tabelas de mobility para uso exclusivo do painel admin.
 *
 * Tabelas cobertas:
 *   - community_ride_posts
 *   - community_post_flags
 *   - driver_data / profiles
 *   - ride_requests
 *   - driver_complete_profile
 *   - ride_ratings
  *   - profiles.suspended_until (contagem de suspensões)
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
const mobilityDb = supabase as any;

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
  total_earnings: number;
  is_verified: boolean;
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
  current_location: unknown;
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

export class MobilityAdminQueryService {
  // ─── Community Posts ────────────────────────────────────────────────────

  static async getCommunityPosts(
    filter?: "pending" | "approved" | "rejected" | "flagged",
  ): Promise<RawCommunityPost[]> {
    try {
      let query = mobilityDb
        .from("community_ride_posts")
        .select(
          "id, author_profile_id, content, intent, destination, moderation_status, flag_count, interested_count, created_at, moderated_at, moderation_reason",
        )
        .order("created_at", { ascending: false });

      if (filter) query = query.eq("moderation_status", filter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getCommunityPosts", error as Error);
      throw error;
    }
  }

  static async getPostFlags(postId: string): Promise<RawPostFlag[]> {
    try {
      const { data, error } = await mobilityDb
        .from("community_post_flags")
        .select("id, reason, description, flagged_by, created_at")
        .eq("post_id", postId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getPostFlags", error as Error);
      throw error;
    }
  }

  // ─── Drivers ────────────────────────────────────────────────────────────

  static async getDriversRaw(): Promise<RawDriverProfile[]> {
    try {
      const { data, error } = await mobilityDb
        .from("driver_data")
        .select(`
          id,
          profile_id,
          rating,
          total_rides,
          is_verified,
          profiles!inner(user_id)
        `)
        .order("total_rides", { ascending: false });

      if (error) throw error;
      return (data || []).map((driver) => ({
        id: driver.id,
        profile_id: driver.profile_id,
        user_id: driver.profiles?.user_id,
        rating: driver.rating ?? 0,
        total_rides: driver.total_rides ?? 0,
        total_earnings: 0,
        is_verified: driver.is_verified ?? false,
      }));
    } catch (error) {
      logger.error("MobilityAdminQueryService.getDriversRaw", error as Error);
      throw error;
    }
  }

  static async getDriverRideStatuses(profileId: string): Promise<{ status: string }[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("status")
        .eq("driver_profile_id", profileId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getDriverRideStatuses", error as Error);
      return [];
    }
  }

  static async countDriverSuspensions(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("profile_type", "driver")
        .not("suspended_until", "is", null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("MobilityAdminQueryService.countDriverSuspensions", error as Error);
      return 0;
    }
  }

  static async getAllDriversComplete(): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from("driver_complete_profile")
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getAllDriversComplete", error as Error);
      throw error;
    }
  }

  // ─── Rides ──────────────────────────────────────────────────────────────

  static async getRideStats(): Promise<{ status: string; final_price?: number }[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("status, final_price");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getRideStats", error as Error);
      throw error;
    }
  }

  static async getRecentRides(limit = 50): Promise<RawRide[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getRecentRides", error as Error);
      throw error;
    }
  }

  static async getUserRides(userId: string): Promise<RawRide[]> {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId);

      if (profileError) throw profileError;

      const profileIds = (profiles || []).map((profile: { id: string }) => profile.id);
      if (profileIds.length === 0) {
        return [];
      }

      const rideFilters = profileIds
        .flatMap((profileId: string) => [
          `passenger_profile_id.eq.${profileId}`,
          `driver_profile_id.eq.${profileId}`,
        ])
        .join(",");

      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .or(rideFilters)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getUserRides", error as Error);
      throw error;
    }
  }

  static async getAllRides(): Promise<RawRide[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getAllRides", error as Error);
      throw error;
    }
  }

  static async getAllRideRatings(): Promise<{ rating: number }[]> {
    try {
      const { data, error } = await supabase
        .from("ride_ratings")
        .select("rating");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getAllRideRatings", error as Error);
      throw error;
    }
  }

  static async getActiveDriversForMap(): Promise<RawActiveDriver[]> {
    try {
      const { data, error } = await supabase
        .from("driver_data")
        .select(
          "profile_id, is_online, is_available, can_do_delivery, last_location_update, current_location",
        )
        .eq("is_online", true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getActiveDriversForMap", error as Error);
      throw error;
    }
  }

  static async getActiveRidesForMap(): Promise<RawActiveRide[]> {
    try {
      const activeStatuses = [
        "pending",
        "requested",
        "searching_driver",
        "driver_assigned",
        "driver_accepted",
        "driver_arriving",
        "driver_on_the_way",
        "driver_arrived",
        "passenger_boarded",
        "passenger_on_board",
        "in_progress",
        "pickup_confirmed",
        "in_delivery",
      ];

      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          "id, status, ride_mode, driver_profile_id, passenger_profile_id, updated_at, created_at",
        )
        .in("status", activeStatuses)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityAdminQueryService.getActiveRidesForMap", error as Error);
      throw error;
    }
  }
}
