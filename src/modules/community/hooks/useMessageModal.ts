import { useState } from "react";
import { profileService } from "@/core/profiles/services/ProfileService"; // ✅ SSOT
import { useDirectMessages } from "@/modules/community/hooks/useDirectMessages";
import type { UnifiedPost } from "@/shared/types/posts";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";
import { logger } from "@/shared/utils/logger";

type ConversationPostContext = Parameters<
  ReturnType<typeof useDirectMessages>["createOrGetConversation"]
>[0];

const postTypeMap: Partial<Record<UnifiedPost["type"], ConversationPostContext["type"]>> = {
  civic_report: "civic_report",
  recomendacao: "recomendacao",
  alerta: "alerta",
};

export function useMessageModal(currentUserId?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<DirectMessageRecipientView | null>(
    null,
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { createOrGetConversation, sendMessage, fetchMessages, messages } =
    useDirectMessages(currentUserId);

  const handleOpen = async (
    postId: string,
    recipientProfileId: string,
    sortedPosts: UnifiedPost[],
  ) => {
    if (!currentUserId) return;

    try {
      // ✅ SSOT — ProfileService para buscar dados do perfil
      const profileData =
        await profileService.getProfileById(recipientProfileId);

      if (!profileData) {
        logger.error("Profile not found:", recipientProfileId);
        return;
      }

      const post = sortedPosts.find((p) => p.id === postId);
      if (!post) return;

      const newConversationId = await createOrGetConversation(
        {
          id: postId,
          title:
            post.content.substring(0, 50) +
            (post.content.length > 50 ? "..." : ""),
          imageUrl: post.images?.[0] || post.image_url,
          type: postTypeMap[post.type] ?? "recomendacao",
        },
        recipientProfileId,
      );

      if (!newConversationId) {
        logger.error("Error create conversa");
        return;
      }

      await fetchMessages(newConversationId);

      setSelectedPost(post);
      setRecipientProfile({
        id: profileData.id,
        displayName: profileData.display_name ?? profileData.name,
        avatarUrl: profileData.avatar_url ?? null,
        verified: profileData.verified ?? false,
      });
      setConversationId(newConversationId);
      setIsOpen(true);
    } catch (error) {
      logger.error("Error iniciar conversa:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPost(null);
    setRecipientProfile(null);
    setConversationId(null);
  };

  const handleSend = async (
    messageText: string,
    messageType?: "text" | "location",
  ) => {
    if (!conversationId) return;
    const success = await sendMessage(conversationId, messageText, messageType);
    if (success) {
      if (import.meta.env.DEV) {
        logger.info("Mensagem enviada com sucesso");
      }
    }
  };

  const handleReport = async () => {
    if (import.meta.env.DEV) {
      logger.info("Conversa denunciada");
    }
    handleClose();
  };

  return {
    isOpen,
    selectedPost,
    recipientProfile,
    conversationId,
    messages,
    handleOpen,
    handleClose,
    handleSend,
    handleReport,
  };
}
