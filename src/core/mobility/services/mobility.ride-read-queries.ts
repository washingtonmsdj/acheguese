import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { mobilityService } from "./MobilityRuntimeService";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  neq(column: string, value: unknown): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type MobilityRideReadDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<TRow = Record<string, unknown>>(
    fn: string,
    params?: Record<string, unknown>,
  ): Promise<{ data: TRow | null; error: ErrorLike }>;
};

const mobilityRideReadDb = supabase as unknown as MobilityRideReadDbClient;

type MobilityConversationRow = {
  id: string;
  ride_id: string | null;
  passenger_profile_id: string | null;
  driver_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

type MobilityMessagePreviewRow = {
  message: string | null;
};

type RideStateAuditRow = Record<string, unknown>;
type OperationalVerificationRow = Record<string, unknown>;

export async function getMobilityConversations(profileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await mobilityRideReadDb
      .from<MobilityConversationRow>("mobility_conversations")
      .select(
        [
          "id",
          "ride_id",
          "passenger_profile_id",
          "driver_profile_id",
          "created_at",
          "updated_at",
        ].join(", "),
      )
      .or(`passenger_profile_id.eq.${profileId},driver_profile_id.eq.${profileId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    logger.error("MobilityQueries.getMobilityConversations", { profileId, error });
    return [];
  }
}

export async function getLastMessage(conversationId: string): Promise<unknown | null> {
  try {
    const { data, error } = await mobilityRideReadDb
      .from<MobilityMessagePreviewRow>("mobility_messages")
      .select("message")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getLastMessage", { conversationId, error });
    return null;
  }
}

export async function getUnreadCount(conversationId: string, profileId: string): Promise<number> {
  try {
    const { count, error } = await mobilityRideReadDb
      .from<{ id: string }>("mobility_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("read", false)
      .neq("sender_profile_id", profileId);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    logger.error("MobilityQueries.getUnreadCount", { conversationId, profileId, error });
    return 0;
  }
}

export async function getRideWithAddresses(rideId: string): Promise<unknown | null> {
  try {
    return await mobilityService.getRideWithAddresses(rideId);
  } catch (error) {
    logger.error("MobilityQueries.getRideWithAddresses", error as Error);
    return null;
  }
}

export async function getRideBasicInfo(rideId: string): Promise<unknown | null> {
  try {
    return await mobilityService.getRideBasicInfo(rideId);
  } catch (error) {
    logger.error("MobilityQueries.getRideBasicInfo", error as Error);
    return null;
  }
}


export async function getRideAvailableSeats(rideId: string): Promise<number> {
  try {
    return await mobilityService.getRideAvailableSeats(rideId);
  } catch (error) {
    logger.error("MobilityQueries.getRideAvailableSeats", error as Error);
    return 0;
  }
}

export async function getRideStateAuditEntries(
  rideId: string,
  limit = 30,
): Promise<unknown[]> {
  const { data, error } = await mobilityRideReadDb
    .from<RideStateAuditRow>("ride_state_audit")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getOperationalVerificationEntries(
  rideId: string,
  limit = 5,
): Promise<unknown[]> {
  if (limit <= 0) return [];

  const { data, error } = await mobilityRideReadDb.rpc<OperationalVerificationRow>(
    "get_operational_verification_status",
    { p_ride_id: rideId },
  );

  if (error) throw error;
  return data ? [data] : [];
}
