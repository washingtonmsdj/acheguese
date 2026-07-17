import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import {
  classifiedUrlService,
  getClassifiedById,
} from "@/core/classifieds/services";
import { profileService } from "@/core/profiles/services";
import { z } from "zod";
import {
  TrustIncidentService,
  type ClassifiedIncidentReason,
} from "@/core/trust";
import { realtimeService, type RealtimeSubscription } from "@/core/realtime";
import type {
  ClassifiedConversation,
  ClassifiedConversationBlockReason,
  ClassifiedConversationCursor,
  ClassifiedConversationModerationAction,
  ClassifiedConversationPreview,
  ClassifiedConversationWithDetails,
  ClassifiedMessage,
  SendClassifiedMessageInput,
} from "../types";
import type {
  ConversationInboxPort,
  ConversationInboxQuery,
  CursorPage,
  MessageThreadPort,
} from "../contracts";

type ClassifiedSummary = {
  id: string;
  public_id?: string | null;
  slug?: string | null;
  geographic_path?: string | null;
  category_slug?: string | null;
  subcategory_slug?: string | null;
  title?: string | null;
  price?: number | null;
  photos?: string[] | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const conversationPreviewRowSchema = z.object({
  id: z.string().uuid(),
  classified_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  status: z.string(),
  last_message_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  is_active: z.boolean(),
  blocked_by: z.string().uuid().nullable(),
  block_reason: z.string().nullable(),
  classified_title: z.string(),
  classified_price: z.number(),
  classified_photo: z.string(),
  classified_public_id: z.string().nullable(),
  classified_slug: z.string().nullable(),
  other_user_id: z.string().uuid(),
  other_user_name: z.string(),
  other_user_avatar: z.string(),
  last_message_text: z.string(),
  unread_count: z.number().int().nonnegative(),
});

export class ClassifiedMessagingService
  implements
    ConversationInboxPort<
      ClassifiedConversationPreview,
      ClassifiedConversationCursor
    >,
    MessageThreadPort<ClassifiedMessage, SendClassifiedMessageInput>
{
  async listConversationPreviews(
    query: ConversationInboxQuery<ClassifiedConversationCursor>,
  ): Promise<
    CursorPage<ClassifiedConversationPreview, ClassifiedConversationCursor>
  > {
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 50);
    const search = query.search?.trim() || null;
    if (!UUID_PATTERN.test(query.profileId)) {
      throw new Error("Invalid classified messaging Profile ID");
    }
    if (search && search.length > 100) {
      throw new Error("Classified messaging search exceeds 100 characters");
    }
    if (query.cursor) {
      const cursorDate = new Date(query.cursor.lastMessageAt);
      if (
        Number.isNaN(cursorDate.getTime()) ||
        !UUID_PATTERN.test(query.cursor.id)
      ) {
        throw new Error("Invalid classified conversation cursor");
      }
    }

    const { data, error } = await supabase.rpc(
      "list_classified_conversation_previews",
      {
        p_profile_id: query.profileId,
        p_limit: limit + 1,
        p_cursor_last_message_at: query.cursor?.lastMessageAt ?? null,
        p_cursor_id: query.cursor?.id ?? null,
        p_search: search,
      },
    );
    if (error) {
      trackError(error, {
        component: "ClassifiedMessagingService",
        action: "listConversationPreviews",
      });
      throw error;
    }

    const parsed = z.array(conversationPreviewRowSchema).safeParse(data ?? []);
    if (!parsed.success) {
      trackError(parsed.error, {
        component: "ClassifiedMessagingService",
        action: "validateConversationPreviews",
      });
      throw new Error("Invalid classified conversation preview response");
    }

    const hasNextPage = parsed.data.length > limit;
    const pageRows = hasNextPage ? parsed.data.slice(0, limit) : parsed.data;
    const items = pageRows.map<ClassifiedConversationPreview>((row) => ({
      id: row.id,
      classified_id: row.classified_id,
      buyer_id: row.buyer_id,
      seller_id: row.seller_id,
      status: row.status,
      last_message_at: row.last_message_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_active: row.is_active,
      blocked_by: row.blocked_by,
      block_reason: row.block_reason,
      classified_title: row.classified_title,
      classified_price: row.classified_price,
      classified_photo: row.classified_photo,
      classified_public_url: classifiedUrlService.buildPublicUrl({
        id: row.classified_id,
        public_id: row.classified_public_id,
        slug: row.classified_slug,
      }),
      other_user_id: row.other_user_id,
      other_user_name: row.other_user_name,
      other_user_avatar: row.other_user_avatar,
      last_message_text: row.last_message_text,
      unread_count: row.unread_count,
    }));
    const lastItem = items.at(-1);

    return {
      items,
      nextCursor:
        hasNextPage && lastItem
          ? { lastMessageAt: lastItem.last_message_at, id: lastItem.id }
          : null,
    };
  }

  /**
   * Busca uma conversa por ID com detalhes
   */
  async getConversationWithDetails(
    conversationId: string,
    userId: string,
  ): Promise<ClassifiedConversationWithDetails | null> {
    try {
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (error) throw error;
      if (!conversation) return null;

      // Buscar dados do classificado e do outro usuário
      const otherUserId =
        conversation.buyer_id === userId
          ? conversation.seller_id
          : conversation.buyer_id;
      const [classified, otherProfile] = await Promise.all([
        this.getClassifiedById(conversation.classified_id),
        profileService.getProfileById(otherUserId),
      ]);

      return {
        ...conversation,
        classified_title: classified?.title || "Anuncio",
        classified_price: classified?.price || 0,
        classified_photo: classified?.photos?.[0] || "",
        classified_public_url: classified
          ? classifiedUrlService.buildPublicUrl(classified)
          : null,
        other_user_id: otherUserId,
        other_user_name: otherProfile?.name || "Usuario",
        other_user_avatar: otherProfile?.avatar_url || "",
      };
    } catch (error) {
      trackError(new Error("Error fetching conversation with details"), {
        component: "ClassifiedMessagingService",
        action: "getConversationWithDetails",
        metadata: { conversationId, userId, error },
      });
      return null;
    }
  }

  /**
   * Busca mensagens de uma conversa
   */
  async listMessages(conversationId: string): Promise<ClassifiedMessage[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(new Error("Error fetching messages"), {
        component: "ClassifiedMessagingService",
        action: "listMessages",
        metadata: { conversationId, error },
      });
      return [];
    }
  }

  /**
   * Subscreve mensagens de uma conversa específica
   */
  subscribeToConversationMessages(
    conversationId: string,
    callback: (message: ClassifiedMessage) => void,
  ): RealtimeSubscription | null {
    try {
      return realtimeService.subscribeToClassifiedMessages(
        conversationId,
        (message) => callback(message as unknown as ClassifiedMessage),
      );
    } catch (error) {
      logger.error("Error subscribing to conversation messages:", error);
      return null;
    }
  }

  /**
   * Remove subscrição de mensagens
   */
  unsubscribeFromMessages(subscription: RealtimeSubscription | null): void {
    try {
      subscription?.unsubscribe();
    } catch (error) {
      logger.error("Error unsubscribing from messages:", error);
    }
  }

  /**
   * Remove um canal de realtime aberto por este adapter de Classificados.
   */
  unsubscribeChannel(subscription: RealtimeSubscription | null): void {
    this.unsubscribeFromMessages(subscription);
  }

  /**
   * Cria uma nova conversa
   */
  /**
   * Busca ou cria uma conversa entre dois usuários para um classificado
   */
  async findOrCreateConversation(
    classifiedId: string,
  ): Promise<ClassifiedConversation | null> {
    try {
      const { data, error } = await supabase.rpc(
        "create_classified_conversation",
        {
          p_classified_id: classifiedId,
        },
      );
      if (error) throw error;
      return data;
    } catch (error) {
      trackError(new Error("Error finding or creating conversation"), {
        component: "ClassifiedMessagingService",
        action: "findOrCreateConversation",
        metadata: { classifiedId, error },
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(
    input: SendClassifiedMessageInput,
  ): Promise<ClassifiedMessage | null> {
    try {
      const { data, error } = await supabase.rpc("send_classified_message", {
        p_conversation_id: input.conversation_id,
        p_text: input.text,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(new Error("Error sending message"), {
        component: "ClassifiedMessagingService",
        action: "sendMessage",
        metadata: { conversationId: input.conversation_id, error },
      });
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("mark_classified_messages_read", {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error marking messages as read"), {
        component: "ClassifiedMessagingService",
        action: "markMessagesAsRead",
        metadata: { conversationId, error },
      });
      throw error;
    }
  }

  /**
   * Bloqueia uma conversa
   */
  async blockConversation(
    conversationId: string,
    reason: ClassifiedConversationBlockReason = "user_blocked",
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("block_classified_conversation", {
        p_conversation_id: conversationId,
        p_reason: reason,
      });

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error blocking conversation"), {
        component: "ClassifiedMessagingService",
        action: "blockConversation",
        metadata: { conversationId, reason, error },
      });
      throw error;
    }
  }

  /**
   * Reporta uma mensagem
   */
  async reportMessage(
    messageId: string,
    reason: ClassifiedIncidentReason,
    description?: string,
  ): Promise<void> {
    try {
      await TrustIncidentService.reportClassifiedMessage({
        messageId,
        reason,
        description,
      });
    } catch (error) {
      trackError(new Error("Error reporting message"), {
        component: "ClassifiedMessagingService",
        action: "reportMessage",
        metadata: { messageId, reason, error },
      });
      throw error;
    }
  }

  /**
   * Fecha/desativa uma conversa de Classificado.
   */
  async moderateConversation(
    conversationId: string,
    action: ClassifiedConversationModerationAction,
    reason?: string,
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("moderate_classified_conversation", {
        p_conversation_id: conversationId,
        p_action: action,
        p_reason: reason,
      });

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error moderating conversation"), {
        component: "ClassifiedMessagingService",
        action: "moderateConversation",
        metadata: { conversationId, moderationAction: action, error },
      });
      throw error;
    }
  }

  async closeConversation(conversationId: string): Promise<void> {
    await this.moderateConversation(conversationId, "close");
  }

  /**
   * Verifica se uma conversa está bloqueada
   */
  async isConversationBlocked(conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("status")
        .eq("id", conversationId)
        .maybeSingle();

      if (error) throw error;
      return data?.status === "blocked";
    } catch (error) {
      logger.error("Error checking if conversation is blocked:", error);
      return false;
    }
  }

  /**
   * Desbloqueia uma conversa (admin only)
   * ✅ SSOT - Boundary canônico para desbloqueio de conversa
   */
  async unblockConversation(conversationId: string): Promise<void> {
    await this.moderateConversation(conversationId, "unblock");
  }

  /**
   * Reabre uma conversa (is_active = true)
   * ✅ SSOT - Boundary canônico para reabertura de conversa
   */
  async reopenConversation(conversationId: string): Promise<void> {
    await this.moderateConversation(conversationId, "reopen");
  }

  /**
   * Deleta uma conversa (hard delete - admin only)
   * ✅ SSOT - Boundary canônico para exclusão de conversa
   */
  async listConversationParticipantsByClassified(classifiedId: string): Promise<
    Array<{
      conversationId: string;
      buyerId: string;
      sellerId: string;
      buyerName: string | null;
      sellerName: string | null;
    }>
  > {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        buyer_id,
        seller_id,
        buyer:profiles!conversations_buyer_id_fkey(name),
        seller:profiles!conversations_seller_id_fkey(name)
      `,
      )
      .eq("classified_id", classifiedId);

    if (error || !data) return [];

    return data.map((row) => ({
      conversationId: row.id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      buyerName: (row.buyer as { name?: string | null } | null)?.name ?? null,
      sellerName: (row.seller as { name?: string | null } | null)?.name ?? null,
    }));
  }

  /**
   * Métodos auxiliares privados para buscar classificados via ClassifiedService
   */
  private async getClassifiedById(
    id: string,
  ): Promise<ClassifiedSummary | null> {
    try {
      return await getClassifiedById(id);
    } catch (error) {
      logger.error("Error fetching classified:", error);
      return null;
    }
  }
}

export const classifiedMessagingService = new ClassifiedMessagingService();
export default classifiedMessagingService;
