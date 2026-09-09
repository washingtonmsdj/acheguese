/**
 * Chat mutations - SSOT.
 *
 * All writes are server-owned. The browser never supplies sender identity
 * or mutates read receipts directly.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { ChatMessage, RideChat, SendMessageInput } from "./chat.types";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type RpcResult<T> = {
  data: T | null;
  error: ErrorLike;
};

type ChatRpcClient = {
  rpc<T = unknown>(
    functionName: string,
    args?: Record<string, unknown>,
  ): Promise<RpcResult<T>>;
};

const chatRpc = supabase as unknown as ChatRpcClient;

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  const message = input.message.trim();
  if (!message) throw new Error("Mensagem nao pode estar vazia");

  const { data, error } = await chatRpc.rpc<ChatMessage>(
    "send_ride_chat_message",
    {
      p_ride_id: input.ride_id,
      p_message: message,
    },
  );

  if (error) {
    logger.error("chat.mutations.sendMessage", error);
    throw error;
  }
  if (!data) throw new Error("Resposta vazia ao enviar mensagem");

  return data;
}

export async function markMessagesAsRead(rideId: string): Promise<void> {
  const { error } = await chatRpc.rpc<number>(
    "mark_ride_chat_messages_read",
    { p_ride_id: rideId },
  );

  if (error) {
    logger.error("chat.mutations.markMessagesAsRead", error);
    throw error;
  }
}

export async function createChat(rideId: string): Promise<RideChat> {
  const { data, error } = await chatRpc.rpc<RideChat>(
    "ensure_ride_chat",
    { p_ride_id: rideId },
  );

  if (error) {
    logger.error("chat.mutations.createChat", error);
    throw error;
  }
  if (!data) throw new Error("Resposta vazia ao criar chat");

  return data;
}
