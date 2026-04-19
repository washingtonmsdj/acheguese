/**
 * 🏆 MESSAGING SERVICE - SSOT para Sistema de Mensagens
 *
 * ✅ Fonte única de verdade para conversas e mensagens
 * ✅ Acesso centralizado às tabelas conversations e messages
 * ✅ Lógica de negócio: contagem de não lidas, bloqueios, relatórios
 * ✅ Integração com ProfileService e ClassifiedService
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";
import { getClassifiedById } from "@/core/classifieds/services";
import { ALERT_STATUS } from "@/shared/types/constants";
import type {
  Conversation,
  Message,
  ConversationWithDetails,
  ConversationPreview,
  CreateConversationInput,
  SendMessageInput,
  BlockConversationInput,
} from "../types";

class MessagingService {
  /**
   * Busca conversas de um usuário com detalhes
   */
  async getConversationPreviews(
    userId: string,
  ): Promise<ConversationPreview[]> {
    try {
      // Buscar conversas do usuário
      const { data: conversations, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      if (!conversations || conversations.length === 0) return [];

      // Coletar IDs únicos
      const classifiedIds = [
        ...new Set(conversations.map((c: any) => c.classified_id)),
      ] as string[];
      const otherUserIds = [
        ...new Set(
          conversations.map((c: any) =>
            c.buyer_id === userId ? c.seller_id : c.buyer_id,
          ),
        ),
      ] as string[];

      // Buscar dados em paralelo
      const [classifieds, profiles] = await Promise.all([
        classifiedIds.length > 0
          ? this.getClassifiedsByIds(classifiedIds)
          : Promise.resolve([]),
        otherUserIds.length > 0
          ? profileService.getProfilesSummary(otherUserIds)
          : Promise.resolve([]),
      ]);

      // Criar previews com dados completos
      const previews: ConversationPreview[] = await Promise.all(
        conversations.map(async (conv) => {
          // Buscar última mensagem e contagem de não lidas
          const [lastMessage, unreadCount] = await Promise.all([
            this.getLastMessage(conv.id),
            this.getUnreadCount(conv.id, userId),
          ]);

          const classified = classifieds.find(
            (c) => c?.id === conv.classified_id,
          );
          const otherUserId =
            conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
          const otherProfile = profiles.find((p) => p.id === otherUserId);

          return {
            ...conv,
            classified_title: classified?.title || "Anúncio",
            classified_price: classified?.price || 0,
            classified_photo: classified?.photos?.[0] || "",
            other_user_name: otherProfile?.name || "Usuário",
            other_user_avatar: otherProfile?.avatarUrl || "",
            last_message_text: lastMessage?.text || "",
            unread_count: unreadCount,
          };
        }),
      );

      return previews;
    } catch (error) {
      trackError(new Error("Error fetching conversation previews"), {
        component: "MessagingService",
        action: "getConversationPreviews",
        metadata: { userId, error },
      });
      return [];
    }
  }

  /**
   * Busca uma conversa por ID com detalhes
   */
  async getConversationWithDetails(
    conversationId: string,
    userId: string,
  ): Promise<ConversationWithDetails | null> {
    try {
      const { data: conversation, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (error) throw error;
      if (!conversation) return null;

      // Buscar dados do classificado e do outro usuário
      const [classified, otherProfile] = await Promise.all([
        this.getClassifiedById(conversation.classified_id),
        (() => {
          const otherUserId =
            conversation.buyer_id === userId
              ? conversation.seller_id
              : conversation.buyer_id;
          return profileService.getProfileById(otherUserId);
        })(),
      ]);

      return {
        ...conversation,
        classified_title: classified?.title || "Anúncio",
        classified_price: classified?.price || 0,
        classified_photo: classified?.photos?.[0] || "",
        other_user_name: otherProfile?.name || "Usuário",
        other_user_avatar: otherProfile?.avatar_url || "",
      };
    } catch (error) {
      trackError(new Error("Error fetching conversation with details"), {
        component: "MessagingService",
        action: "getConversationWithDetails",
        metadata: { conversationId, userId, error },
      });
      return null;
    }
  }

  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(new Error("Error fetching messages"), {
        component: "MessagingService",
        action: "getMessages",
        metadata: { conversationId, error },
      });
      return [];
    }
  }

  /**
   * Busca última mensagem de uma conversa
   */
  async getLastMessage(conversationId: string): Promise<Message | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error fetching last message:", error);
      return null;
    }
  }

  /**
   * Conta mensagens não lidas de uma conversa
   */
  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_profile_id", userId)
        .is("read_at", null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Conta total de mensagens não lidas de um usuário
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // Buscar todas as conversas do usuário
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return 0;

      // Contar mensagens não lidas em todas as conversas
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((c) => c.id),
        )
        .neq("sender_profile_id", userId)
        .is("read_at", null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error fetching total unread count:", error);
      return 0;
    }
  }

  /**
   * Conta mensagens não lidas de um usuário (alias para compatibilidade)
   */
  async getUnreadMessagesCount(userId: string): Promise<number> {
    return this.getTotalUnreadCount(userId);
  }

  /**
   * Subscreve a mudanças em mensagens para um usuário
   */
  subscribeToMessages(userId: string, callback: () => void): any {
    try {
      const channel = supabase
        .channel(`messages-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          callback,
        )
        .subscribe();

      return channel;
    } catch (error) {
      logger.error("Error subscribing to messages:", error);
      return null;
    }
  }

  /**
   * Subscreve mensagens de uma conversa específica
   */
  subscribeToConversationMessages(
    conversationId: string,
    callback: (message: Message) => void,
  ): any {
    try {
      const channel = supabase
        .channel(`chat-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            callback(payload.new as Message);
          },
        )
        .subscribe();

      return channel;
    } catch (error) {
      logger.error("Error subscribing to conversation messages:", error);
      return null;
    }
  }

  /**
   * Remove subscrição de mensagens
   */
  unsubscribeFromMessages(subscription: any): void {
    try {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    } catch (error) {
      logger.error("Error unsubscribing from messages:", error);
    }
  }

  /**
   * Remove qualquer canal de realtime criado pelo MessagingService
   */
  unsubscribeChannel(subscription: any): void {
    this.unsubscribeFromMessages(subscription);
  }

  /**
   * Cria uma nova conversa
   */
  async createConversation(
    input: CreateConversationInput,
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("conversations")
        .insert({
          classified_id: input.classified_id,
          buyer_id: input.buyer_id,
          seller_id: input.seller_id,
          status: ALERT_STATUS.ACTIVE,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(new Error("Error creating conversation"), {
        component: "MessagingService",
        action: "createConversation",
        metadata: { input, error },
      });
      throw error;
    }
  }

  /**
   * Busca ou cria uma conversa entre dois usuários para um classificado
   */
  async findOrCreateConversation(
    classifiedId: string,
    buyerId: string,
    sellerId: string,
  ): Promise<Conversation | null> {
    try {
      // Tentar encontrar conversa existente
      const { data: existing, error: findError } = await (supabase as any)
        .from("conversations")
        .select("*")
        .eq("classified_id", classifiedId)
        .or(
          `and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`,
        )
        .maybeSingle();

      if (findError) throw findError;
      if (existing) return existing;

      // Criar nova conversa
      return await this.createConversation({
        classified_id: classifiedId,
        buyer_id: buyerId,
        seller_id: sellerId,
      });
    } catch (error) {
      trackError(new Error("Error finding or creating conversation"), {
        component: "MessagingService",
        action: "findOrCreateConversation",
        metadata: { classifiedId, buyerId, sellerId, error },
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(input: SendMessageInput): Promise<Message | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .insert({
          conversation_id: input.conversation_id,
          sender_profile_id: input.sender_profile_id,
          text: input.text,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar timestamp da conversa
      await (supabase as any)
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", input.conversation_id);

      return data;
    } catch (error) {
      trackError(new Error("Error sending message"), {
        component: "MessagingService",
        action: "sendMessage",
        metadata: { input, error },
      });
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_profile_id", userId)
        .is("read_at", null);

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error marking messages as read"), {
        component: "MessagingService",
        action: "markMessagesAsRead",
        metadata: { conversationId, userId, error },
      });
      throw error;
    }
  }

  /**
   * Bloqueia uma conversa
   */
  async blockConversation(input: BlockConversationInput): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .update({
          status: "blocked",
          blocked_by: input.blocked_by,
          block_reason: input.block_reason || "Bloqueado pelo usuário",
        })
        .eq("id", input.conversation_id);

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error blocking conversation"), {
        component: "MessagingService",
        action: "blockConversation",
        metadata: { input, error },
      });
      throw error;
    }
  }

  /**
   * Reporta uma mensagem
   */
  async reportMessage(
    messageId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any).from("message_reports").insert({
        message_id: messageId,
        reporter_id: reporterId,
        reason: reason,
      });

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error reporting message"), {
        component: "MessagingService",
        action: "reportMessage",
        metadata: { messageId, reporterId, reason, error },
      });
      throw error;
    }
  }

  /**
   * Fecha/desativa uma conversa (is_active = false)
   * ✅ LOTE 7 - Boundary canônico para encerramento de conversa de mobilidade
   */
  async closeConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .update({ is_active: false })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error) {
      trackError(new Error("Error closing conversation"), {
        component: "MessagingService",
        action: "closeConversation",
        metadata: { conversationId, error },
      });
      throw error;
    }
  }

  /**
   * Verifica se uma conversa está bloqueada
   */
  async isConversationBlocked(conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
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
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .update({
          status: "active",
          blocked_by: null,
          block_reason: null,
        })
        .eq("id", conversationId);

      if (error) throw error;
      logger.info(`Conversation ${conversationId} unblocked`);
    } catch (error) {
      trackError(new Error("Error unblocking conversation"), {
        component: "MessagingService",
        action: "unblockConversation",
        metadata: { conversationId, error },
      });
      throw error;
    }
  }

  /**
   * Reabre uma conversa (is_active = true)
   * ✅ SSOT - Boundary canônico para reabertura de conversa
   */
  async reopenConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .update({ is_active: true })
        .eq("id", conversationId);

      if (error) throw error;
      logger.info(`Conversation ${conversationId} reopened`);
    } catch (error) {
      trackError(new Error("Error reopening conversation"), {
        component: "MessagingService",
        action: "reopenConversation",
        metadata: { conversationId, error },
      });
      throw error;
    }
  }

  /**
   * Deleta uma conversa (hard delete - admin only)
   * ✅ SSOT - Boundary canônico para exclusão de conversa
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      logger.info(`Conversation ${conversationId} deleted`);
    } catch (error) {
      trackError(new Error("Error deleting conversation"), {
        component: "MessagingService",
        action: "deleteConversation",
        metadata: { conversationId, error },
      });
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados para buscar classificados via ClassifiedService
   */
  private async getClassifiedById(id: string): Promise<any | null> {
    try {
      // ✅ SSOT — usa queries diretas
      return await getClassifiedById(id);
    } catch (error) {
      logger.error("Error fetching classified:", error);
      return null;
    }
  }

  private async getClassifiedsByIds(ids: string[]): Promise<any[]> {
    try {
      // ✅ SSOT — usa queries diretas
      const results = await Promise.all(
        ids.map((id) => getClassifiedById(id)),
      );
      return results.filter(Boolean);
    } catch (error) {
      logger.error("Error fetching classifieds:", error);
      return [];
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService;
