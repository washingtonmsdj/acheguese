import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { Json } from "@/shared/types/mobility.generated";

const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

export type DriverModerationAction =
  | "approved"
  | "rejected"
  | "suspended"
  | "reactivated"
  | "set_online"
  | "set_offline";

export interface DriverModerationEvent {
  id: string;
  driver_profile_id: string;
  admin_profile_id: string | null;
  action: DriverModerationAction;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_name?: string;
}

export interface CreateDriverModerationEventInput {
  driverProfileId: string;
  action: DriverModerationAction;
  reason?: string;
  metadata?: Record<string, unknown>;
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string };
  if (candidate.code && MISSING_TABLE_ERROR_CODES.has(candidate.code)) {
    return true;
  }

  const haystack = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  return haystack.includes("does not exist") || haystack.includes("relation");
}

async function hydrateAdminNames(
  events: DriverModerationEvent[],
): Promise<DriverModerationEvent[]> {
  const adminProfileIds = Array.from(
    new Set(
      events
        .map((event) => event.admin_profile_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  if (adminProfileIds.length === 0) {
    return events.map((event) => ({ ...event, admin_name: "Admin" }));
  }

  let adminProfiles: Array<{ id: string; name?: string | null }> = [];
  try {
    adminProfiles = (await profileService.getProfilesByIds(adminProfileIds)) as Array<{ id: string; name?: string | null }>;
  } catch (error) {
    logger.warn("DriverModerationEventsService.hydrateAdminNames", error);
    return events.map((event) => ({ ...event, admin_name: "Admin" }));
  }

  const adminMap = new Map<string, string>();
  for (const profile of adminProfiles) {
    adminMap.set(profile.id, profile.name || "Admin");
  }

  return events.map((event) => ({
    ...event,
    admin_name: (event.admin_profile_id && adminMap.get(event.admin_profile_id)) || "Admin",
  }));
}

export class DriverModerationEventsService {
  static async createEvent(input: CreateDriverModerationEventInput): Promise<void> {
    const { error } = await supabase.rpc("append_driver_moderation_event", {
      p_driver_profile_id: input.driverProfileId,
      p_action: input.action,
      p_reason: input.reason ?? null,
      p_metadata: (input.metadata ?? {}) as Json,
    });

    if (error) throw error;
  }

  static async listLatestDecisionsByDriverProfiles(
    driverProfileIds: string[],
  ): Promise<Map<string, DriverModerationEvent>> {
    if (driverProfileIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from("driver_moderation_events")
      .select("id, driver_profile_id, admin_profile_id, action, reason, metadata, created_at")
      .in("driver_profile_id", driverProfileIds)
      .in("action", ["approved", "rejected"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const latest = new Map<string, DriverModerationEvent>();
    for (const event of (data ?? []) as DriverModerationEvent[]) {
      if (!latest.has(event.driver_profile_id)) {
        latest.set(event.driver_profile_id, event);
      }
    }
    return latest;
  }

  static async listByDriverProfile(driverProfileId: string): Promise<DriverModerationEvent[]> {
    const { data, error } = await supabase
      .from("driver_moderation_events")
      .select("id, driver_profile_id, admin_profile_id, action, reason, metadata, created_at")
      .eq("driver_profile_id", driverProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return [];
      }

      logger.warn("DriverModerationEventsService.listByDriverProfile", error);
      return [];
    }

    return hydrateAdminNames((data || []) as DriverModerationEvent[]);
  }
}





