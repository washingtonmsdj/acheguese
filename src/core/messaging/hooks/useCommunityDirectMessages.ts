import { useCallback, useEffect, useState } from "react";

import {
  communityDirectMessagingService,
  type CommunityDirectMessage,
  type CommunityDirectMessageCursor,
  type CommunityDirectReportReason,
  type CommunityDirectThreadPreview,
} from "@/core/messaging";
import { useSessionContext } from "@/core/session";

interface PostContext {
  id: string;
  title: string;
  imageUrl?: string;
  type: "civic_report" | "achado" | "recomendacao" | "alerta";
}

export function useCommunityDirectMessages(communityId?: string) {
  const { activeProfile } = useSessionContext();
  const profileId = activeProfile?.id;
  const [conversations, setConversations] = useState<
    CommunityDirectThreadPreview[]
  >([]);
  const [messages, setMessages] = useState<CommunityDirectMessage[]>([]);
  const [messageCursor, setMessageCursor] =
    useState<CommunityDirectMessageCursor | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    setError(null);
    try {
      const page =
        await communityDirectMessagingService.listConversationPreviews({
          profileId,
          limit: 50,
        });
      setConversations(page.items);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Erro ao buscar conversas",
      );
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const fetchMessages = useCallback(
    async (threadId: string) => {
      if (!profileId) return;
      setActiveThreadId(threadId);
      setIsLoading(true);
      setError(null);
      try {
        const page = await communityDirectMessagingService.listMessagePage({
          profileId,
          threadId,
          limit: 50,
        });
        setMessages(page.items);
        setMessageCursor(page.nextCursor);
        await communityDirectMessagingService.markThreadRead(
          profileId,
          threadId,
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Erro ao buscar mensagens",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [profileId],
  );

  const loadOlderMessages = useCallback(async () => {
    if (!profileId || !activeThreadId || !messageCursor || isLoadingOlder) {
      return;
    }
    setIsLoadingOlder(true);
    try {
      const page = await communityDirectMessagingService.listMessagePage({
        profileId,
        threadId: activeThreadId,
        limit: 50,
        cursor: messageCursor,
      });
      setMessages((current) => {
        const knownIds = new Set(current.map((message) => message.id));
        return [
          ...page.items.filter((message) => !knownIds.has(message.id)),
          ...current,
        ];
      });
      setMessageCursor(page.nextCursor);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erro ao buscar mensagens anteriores",
      );
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeThreadId, isLoadingOlder, messageCursor, profileId]);

  const createOrGetConversation = useCallback(
    async (
      postContext: PostContext,
      participantId: string,
    ): Promise<string | null> => {
      if (!profileId || !communityId) return null;
      setError(null);
      try {
        return await communityDirectMessagingService.createOrGetThread({
          profileId,
          communityId,
          postId: postContext.id,
          recipientProfileId: participantId,
        });
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Erro ao criar conversa",
        );
        return null;
      }
    },
    [communityId, profileId],
  );

  const sendMessage = useCallback(
    async (threadId: string, messageText: string) => {
      if (!profileId) return false;
      try {
        const message = await communityDirectMessagingService.sendMessage({
          profileId,
          threadId,
          body: messageText,
        });
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Erro ao enviar mensagem",
        );
        return false;
      }
    },
    [profileId],
  );

  const reportConversation = useCallback(
    async (
      threadId: string,
      reason: CommunityDirectReportReason,
      description?: string,
    ) => {
      if (!profileId) return false;
      try {
        await communityDirectMessagingService.reportThread({
          profileId,
          threadId,
          reason,
          description,
        });
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Erro ao denunciar conversa",
        );
        return false;
      }
    },
    [profileId],
  );

  const deactivateConversation = useCallback(
    async (threadId: string) => {
      if (!profileId) return false;
      try {
        await communityDirectMessagingService.setThreadBlocked(
          profileId,
          threadId,
          true,
        );
        await fetchConversations();
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Erro ao bloquear conversa",
        );
        return false;
      }
    },
    [fetchConversations, profileId],
  );

  useEffect(() => {
    if (!profileId || !activeThreadId) return;

    const subscription = communityDirectMessagingService.subscribeToMessages(
      activeThreadId,
      (message) => {
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
        if (message.sender_profile_id !== profileId) {
          void communityDirectMessagingService.markThreadRead(
            profileId,
            activeThreadId,
          );
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [activeThreadId, profileId]);

  return {
    conversations,
    messages,
    isLoading,
    isLoadingOlder,
    hasOlderMessages: messageCursor !== null,
    error,
    fetchConversations,
    fetchMessages,
    loadOlderMessages,
    createOrGetConversation,
    sendMessage,
    reportConversation,
    deactivateConversation,
  };
}
