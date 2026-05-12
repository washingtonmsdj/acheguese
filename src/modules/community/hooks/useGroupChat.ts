// Hook profissional para chat de grupos
import { useState, useEffect, useCallback, useRef } from "react";
import { useSessionContext } from "@/core/session";
import { realtimeService } from "@/core/realtime";
import {
  useGroups,
  useGroup,
  useGroupMessages,
  useGroupMembers,
  useIsGroupMember,
  useSendGroupMessage,
  useJoinGroup,
  useLeaveGroup,
} from "@/modules/community/hooks/useGroupQueries";
import { logger } from "@/shared/utils/logger";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; // ✅ SSOT
import { GroupService } from "@/core/social/services/GroupService"; // ✅ SSOT
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_profile_id: string; // ✅ GATE 3 FASE 3C - Atualizado para novo modelo
  content: string;
  message_type?: "text" | "image" | "audio" | "poll" | "system";
  media_url?: string | null;
  media_mime_type?: string | null;
  audio_duration_seconds?: number | null;
  created_at: string;
  profile?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export function useGroupChat(groupId: string | undefined) {
  const { user, activeProfile } = useSessionContext();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
      const messagesData = await SocialInteractionsService.getGroupMessages(
        groupId,
        100,
        0,
      );
      setMessages(messagesData);
    } catch (err) {
      logger.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Subscribe to realtime
  useEffect(() => {
    if (!groupId) return;
    loadMessages();

    // ✅ SSOT - Usar RealtimeService
    const subscription = realtimeService.subscribeToGroupMessages(
      groupId,
      async (newMessage) => {
        // ✅ SSOT — GroupService busca mensagem completa
        const data = await GroupService.getGroupMessageById(newMessage.id);
        if (data) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      },
    );

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [groupId, loadMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!groupId || !user || !activeProfile || !content.trim()) return;
      setSending(true);
      try {
        // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
        const result = await SocialInteractionsService.sendGroupMessage(
          {
            groupId,
            content: content.trim(),
          },
          activeProfile.id,
        );

        if (!result.success) {
          throw new Error(result.error || "Erro ao enviar mensagem");
        }
      } catch (err) {
        logger.error("Error sending message:", err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, user, activeProfile],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
      const result = await SocialInteractionsService.deleteGroupMessage(
        messageId,
        activeProfile?.id,
      );
      if (!result.success) {
        throw new Error(result.error || "Erro ao deletar mensagem");
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [activeProfile],
  );

  return {
    messages,
    loading,
    sending,
    sendMessage,
    deleteMessage,
    refetch: loadMessages,
  };
}
