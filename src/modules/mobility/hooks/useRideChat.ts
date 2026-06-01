/**
 * useRideChat - Hook para gerenciar chat de corridas
 * 
 * ✅ SSOT: Database → ChatService → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from "react";
import { ChatService, type ChatMessage, type RideChat } from "@/core/mobility/services/ChatService";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

interface UseRideChatOptions {
  rideId: string;
  userId: string;
  enabled?: boolean;
}

export function useRideChat({ rideId, userId, enabled = true }: UseRideChatOptions) {
  const [chat, setChat] = useState<RideChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar chat e mensagens
  useEffect(() => {
    if (!enabled || !rideId) return;

    const loadChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar chat da corrida
        const chatData = await ChatService.getChatByRideId(rideId);

        if (chatData) {
          setChat(chatData);

          // Buscar mensagens
          const messagesData = await ChatService.getMessages(chatData.id);
          setMessages(messagesData || []);
        }
      } catch (err: unknown) {
        logger.error("Erro ao carregar chat:", err);
        setError(getErrorMessage(err, "Erro ao carregar chat"));
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [rideId, enabled]);

  // Enviar mensagem
  const sendMessage = useCallback(
    async (message: string) => {
      if (!chat || !message.trim()) return;

      try {
        setSending(true);
        setError(null);

        const data = await ChatService.sendMessage({
          chat_id: chat.id,
          sender_profile_id: userId,
          message: message.trim(),
          is_system_message: false,
        });

        // Adicionar mensagem localmente
        setMessages((prev) => [...prev, data]);
      } catch (err: unknown) {
        logger.error("Erro ao enviar mensagem:", err);
        setError(getErrorMessage(err, "Erro ao enviar mensagem"));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [chat, userId]
  );

  // Marcar mensagens como lidas
  const markAsRead = useCallback(async () => {
    if (!chat) return;

    try {
      await ChatService.markMessagesAsRead(chat.id, userId);
    } catch (err) {
      logger.error("Erro ao marcar como lido:", err);
    }
  }, [chat, userId]);

  return {
    chat,
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markAsRead,
  };
}
