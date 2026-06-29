/**
 * 💬 USE DIRECT MESSAGES HOOK - SSOT Migration
 */

import { useState, useEffect, useCallback } from "react";
import { realtimeService } from "@/core/realtime";
import { messagingService } from "@/core/messaging";
import { useSessionContext } from "@/core/session";
import { resolveTrustActorRoleFromProfileType, TrustEventService } from "@/core/trust";
import type {
  ConversationPreview,
  Message,
  SendMessageInput,
} from "@/core/messaging/types";

function normalizeRealtimeMessage(input: Record<string, unknown>): Message | null {
  const id = typeof input.id === "string" ? input.id : null;
  const conversationId =
    typeof input.conversation_id === "string" ? input.conversation_id : null;
  const senderProfileId =
    typeof input.sender_profile_id === "string" ? input.sender_profile_id : null;
  const text = typeof input.text === "string" ? input.text : null;
  const createdAt = typeof input.created_at === "string" ? input.created_at : null;

  if (!id || !conversationId || !senderProfileId || !text || !createdAt) {
    return null;
  }

  return {
    id,
    conversation_id: conversationId,
    sender_profile_id: senderProfileId,
    text,
    created_at: createdAt,
    read_at: typeof input.read_at === "string" ? input.read_at : null,
  };
}

interface PostContext {
  id: string;
  title: string;
  imageUrl?: string;
  type: "civic_report" | "achado" | "recomendacao" | "alerta";
}

export function useDirectMessages(_currentUserId?: string) {
  const { activeProfile } = useSessionContext();
  const profileId = activeProfile?.id;
  const actorRole = resolveTrustActorRoleFromProfileType(activeProfile?.profileType);

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    setError(null);
    try {
      const conversationPreviews =
        await messagingService.getConversationPreviews(profileId);
      setConversations(conversationPreviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar conversas");
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const messagesData = await messagingService.getMessages(conversationId);
      setMessages(messagesData);
      if (profileId) {
        await messagingService.markMessagesAsRead(conversationId, profileId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const createOrGetConversation = useCallback(async (
    postContext: PostContext,
    participantId: string,
  ): Promise<string | null> => {
    if (!profileId) return null;
    try {
      const conversation = await messagingService.findOrCreateConversation(
        postContext.id,
        profileId,
        participantId,
      );
      return conversation?.id || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conversa");
      return null;
    }
  }, [profileId]);

  const sendMessage = useCallback(async (
    conversationId: string,
    messageText: string,
    _messageType: "text" | "location" = "text",
    _locationData?: { latitude: number; longitude: number; address?: string },
  ) => {
    if (!profileId) return false;
    try {
      const messageInput: SendMessageInput = {
        conversation_id: conversationId,
        sender_profile_id: profileId,
        text: messageText,
      };
      const message = await messagingService.sendMessage(messageInput);
      if (message) {
        await fetchMessages(conversationId);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      return false;
    }
  }, [fetchMessages, profileId]);

  const reportConversation = useCallback(async (
    conversationId: string,
    _reportedUserId: string,
    reason: string,
    description?: string,
  ) => {
    if (!profileId) return false;
    try {
      const trustResult = await TrustEventService.createEvent({
        actor_profile_id: profileId,
        actor_role: actorRole,
        subject_profile_id: profileId,
        subject_role: actorRole,
        context_type: "community",
        context_id: conversationId,
        event_type: "incident",
        reason_code: "conversation_report",
        severity: "medium",
        visibility: "admin_only",
        description: description?.trim() || reason.trim(),
        evidence: {
          conversation_id: conversationId,
          reason,
          description: description ?? null,
        },
        status: "under_review",
      });

      if (trustResult.error) {
        setError(trustResult.error);
        return false;
      }

      await messagingService.blockConversation({
        conversation_id: conversationId,
        blocked_by: "buyer",
        block_reason: `Report: ${reason} - ${description || ""}`,
      });
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao denunciar conversa",
      );
      return false;
    }
  }, [actorRole, profileId]);

  const deactivateConversation = useCallback(async (conversationId: string) => {
    if (!profileId) return false;
    try {
      await messagingService.blockConversation({
        conversation_id: conversationId,
        blocked_by: "buyer",
        block_reason: "User deactivated conversation",
      });
      await fetchConversations();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao desativar conversa",
      );
      return false;
    }
  }, [fetchConversations, profileId]);

  // ✅ SSOT - Usar RealtimeService para subscriptions
  useEffect(() => {
    if (!profileId) return;

    // Subscribe to new messages
    const messageSubscription = realtimeService.subscribeToDirectMessages(
      profileId,
      (newMessage) => {
        const normalizedMessage = normalizeRealtimeMessage(newMessage);
        if (!normalizedMessage) return;

        setMessages((prev) => {
          if (prev.find((m) => m.id === normalizedMessage.id)) return prev;
          return [...prev, normalizedMessage];
        });
      },
    );

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [profileId]);

  return {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    createOrGetConversation,
    sendMessage,
    reportConversation,
    deactivateConversation,
  };
}
