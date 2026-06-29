/**
 * Chat queries - SSOT.
 *
 * Read operations for ride chat.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { ChatMessage, RideChat } from "./chat.types";

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
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type ChatQueriesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const chatQueriesDb = supabase as unknown as ChatQueriesDbClient;

export async function getChatByRideId(rideId: string): Promise<RideChat | null> {
  try {
    const { data, error } = await chatQueriesDb
      .from<RideChat>("ride_chats")
      .select("*")
      .eq("ride_id", rideId)
      .maybeSingle();

    if (error) {
      logger.error("chat.queries.getChatByRideId", error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("chat.queries.getChatByRideId", error);
    throw error;
  }
}

export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await chatQueriesDb
      .from<ChatMessage>("ride_chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("chat.queries.getMessages", error);
      throw error;
    }

    return data ?? [];
  } catch (error) {
    logger.error("chat.queries.getMessages", error);
    throw error;
  }
}
