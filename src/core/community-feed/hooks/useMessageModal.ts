import { useState } from "react";
import { profileService } from "@/core/profiles/services/ProfileService"; // SSOT
import { useDirectMessages } from "@/core/community/hooks/useDirectMessages";
import type { UnifiedPost } from "@/shared/types/posts";
import type { DirectMessageRecipientView } from "@/core/profiles/views/DirectMessageRecipientView";
import { logger } from "@/shared/utils/logger";

type ConversationPostContext = Parameters<
  ReturnType<typeof useDirectMessages>["createOrGetConversation"]
>[0];

function resolveConversationPostType(
  postType: UnifiedPost["type"],
): ConversationPostContext["type"] {
  if ((postType as string) === "alerta") return "alerta";
  if ((postType as string) === "achado") return "achado";
  if ((postType as string) === "civic_report") return "civic_report";
  return "recomendacao";
}

export function useMessageModal(
  currentProfileId?: string,
  communityId?: string,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UnifiedPost | null>(null);
  const [recipientProfile, setRecipientProfile] =
    useState<DirectMessageRecipientView | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const {
    createOrGetConversation,
    sendMessage,
    fetchMessages,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,
    reportConversation,
    messages,
  } = useDirectMessages(communityId);

  const handleOpen = async (
    postId: string,
    recipientProfileId: string,
    sortedPosts: UnifiedPost[],
  ) => {
    if (!currentProfileId || !communityId) return;

    try {
      // SSOT: ProfileService para buscar dados do perfil
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
          type: resolveConversationPostType(post.type),
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

  const handleSend = async (messageText: string) => {
    if (!conversationId) return false;
    const success = await sendMessage(conversationId, messageText);
    if (success) {
      if (import.meta.env.DEV) {
        logger.info("Mensagem enviada com sucesso");
      }
    }
    return success;
  };

  const handleReport = async () => {
    if (!conversationId) return;
    const reported = await reportConversation(
      conversationId,
      "inappropriate_content",
    );
    if (reported) handleClose();
  };

  return {
    isOpen,
    selectedPost,
    recipientProfile,
    conversationId,
    messages,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlder,
    handleOpen,
    handleClose,
    handleSend,
    handleReport,
  };
}
