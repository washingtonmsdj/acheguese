/**
 * Chat mutations - SSOT.
 *
 * Write operations for ride chat.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { ChatMessage, RideChat, SendMessageInput } from "./chat.types";

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
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  neq(column: string, value: unknown): TableClient<TRow>;
  is(column: string, value: null): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type ChatMutationsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const chatMutationsDb = supabase as unknown as ChatMutationsDbClient;

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  try {
    if (!input.message.trim()) {
      throw new Error("Mensagem nao pode estar vazia");
    }

    const { data, error } = await chatMutationsDb
      .from<ChatMessage>("ride_chat_messages")
      .insert({
        chat_id: input.chat_id,
        sender_profile_id: input.sender_profile_id,
        message: input.message.trim(),
        is_system_message: input.is_system_message ?? false,
      })
      .select()
      .single();

    if (error) {
      logger.error("chat.mutations.sendMessage", error);
      throw error;
    }

    logger.info("chat.mutations.sendMessage", {
      chat_id: input.chat_id,
      sender_profile_id: input.sender_profile_id,
    });

    return data;
  } catch (error) {
    logger.error("chat.mutations.sendMessage", error);
    throw error;
  }
}

export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  try {
    const { error } = await chatMutationsDb
      .from<ChatMessage>("ride_chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("chat_id", chatId)
      .neq("sender_profile_id", userId)
      .is("read_at", null);

    if (error) {
      logger.error("chat.mutations.markMessagesAsRead", error);
      throw error;
    }

    logger.info("chat.mutations.markMessagesAsRead", {
      chat_id: chatId,
      user_id: userId,
    });
  } catch (error) {
    logger.error("chat.mutations.markMessagesAsRead", error);
  }
}

export async function createChat(rideId: string): Promise<RideChat> {
  try {
    const { data, error } = await chatMutationsDb
      .from<RideChat>("ride_chats")
      .insert({ ride_id: rideId })
      .select()
      .single();

    if (error) {
      logger.error("chat.mutations.createChat", error);
      throw error;
    }

    logger.info("chat.mutations.createChat", { ride_id: rideId });
    return data;
  } catch (error) {
    logger.error("chat.mutations.createChat", error);
    throw error;
  }
}
