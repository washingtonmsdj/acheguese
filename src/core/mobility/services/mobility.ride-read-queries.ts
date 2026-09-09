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

export interface MobilityConversationSummary {
  id: string;
  ride_id: string;
  passenger_profile_id: string;
  driver_profile_id: string;
  ride_status: string;
  ride_mode: string;
  origin: string | null;
  destination: string | null;
  final_price: number | null;
  suggested_price: number | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

type RideStateAuditRow = Record<string, unknown>;
type OperationalVerificationRow = Record<string, unknown>;

export async function getMobilityConversations(): Promise<MobilityConversationSummary[]> {
  try {
    const { data, error } = await mobilityRideReadDb.rpc<MobilityConversationSummary[]>(
      "list_ride_chat_summaries",
    );

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    logger.error("MobilityQueries.getMobilityConversations", { error });
    return [];
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
