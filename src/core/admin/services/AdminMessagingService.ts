/**
 * AdminMessagingService - Serviço de administração de mensagens
 *
 * ✅ SSOT COMPLIANCE: Delega para MessagingService (core/messaging)
 * Este serviço encapsula operações administrativas de mensagens,
 * delegando para o MessagingService (SSOT) sempre que possível.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient } from "../types/adminDatabase.types";
import { messagingService } from "@/core/messaging/services/MessagingService";
import type {
  Conversation,
  ConversationPreview,
  Message,
} from "@/core/messaging/types";

export interface AdminConversationData extends Conversation {
  buyer_name?: string;
  buyer_avatar?: string;
  seller_name?: string;
  seller_avatar?: string;
  classified_title?: string;
  classified_price?: number;
  message_count?: number;
  unread_count?: number;
}

export interface MessagingStats {
  totalConversations: number;
  activeConversations: number;
  blockedConversations: number;
  totalMessages: number;
}

export interface ConversationsListResult {
  data: AdminConversationData[];
  total: number;
  page: number;
  totalPages: number;
}

class AdminMessagingServiceClass {
  /**
   * Busca estatísticas de mensagens
   */
  async getStats(): Promise<MessagingStats> {
    try {
      const [convResult, msgResult] = await Promise.all([
        (supabase as unknown as AdminSupabaseClient).from("conversations").select("status, is_active"),
        (supabase as unknown as AdminSupabaseClient).from("messages").select("id", { count: "exact", head: true }),
      ]);

      if (convResult.error) {
        logger.error("Error fetching conversations stats:", convResult.error);
        throw convResult.error;
      }

      if (msgResult.error) {
        logger.error("Error fetching messages stats:", msgResult.error);
        throw msgResult.error;
      }

      const stats: MessagingStats = {
        totalConversations: convResult.data?.length || 0,
        activeConversations: convResult.data?.filter((c: any) => c.is_active).length || 0,
        blockedConversations: convResult.data?.filter((c: any) => c.status === "blocked").length || 0,
        totalMessages: msgResult.count || 0,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  /**
   * Busca todas as conversas com paginação
   */
  async getAllConversations(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ConversationsListResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("conversations")
        .select(
          `
          *,
          buyer:profiles!buyer_id (id, name, avatar_url),
          seller:profiles!seller_id (id, name, avatar_url),
          classified:classifieds (id, title, price)
          `,
          { count: "exact" }
        );

      // Aplica filtro de status se fornecido
      if (options.status === "active") {
        query = query.eq("is_active", true);
      } else if (options.status === "inactive") {
        query = query.eq("is_active", false);
      } else if (options.status === "blocked") {
        query = query.eq("status", "blocked");
      }

      // Aplica busca se fornecida
      if (options.search) {
        query = query.or(`buyer.name.ilike.%${options.search}%,seller.name.ilike.%${options.search}%`);
      }

      query = query
        .order("last_message_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error fetching conversations:", error);
        throw error;
      }

      // Buscar contagem de mensagens para cada conversa
      const conversationsWithCounts = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { count: msgCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id);

          return {
            ...conv,
            buyer_name: conv.buyer?.name,
            buyer_avatar: conv.buyer?.avatar_url,
            seller_name: conv.seller?.name,
            seller_avatar: conv.seller?.avatar_url,
            classified_title: conv.classified?.title,
            classified_price: conv.classified?.price,
            message_count: msgCount || 0,
          };
        })
      );

      return {
        data: conversationsWithCounts as AdminConversationData[],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllConversations:", error);
      throw error;
    }
  }

  /**
   * Busca uma conversa por ID
   * ✅ SSOT: Delega para MessagingService.getConversationWithDetails
   */
  async getConversationById(
    id: string,
    userId: string,
  ): Promise<AdminConversationData | null> {
    try {
      const conversation = await messagingService.getConversationWithDetails(id, userId);
      
      if (!conversation) {
        return null;
      }

      // Buscar contagem de mensagens
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", id);

      // Buscar informações de ambos os usuários
      const [buyerProfile, sellerProfile] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", conversation.buyer_id)
          .single(),
        supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", conversation.seller_id)
          .single(),
      ]);

      return {
        ...conversation,
        buyer_name: buyerProfile.data?.name,
        buyer_avatar: buyerProfile.data?.avatar_url,
        seller_name: sellerProfile.data?.name,
        seller_avatar: sellerProfile.data?.avatar_url,
        message_count: msgCount || 0,
      } as AdminConversationData;
    } catch (error) {
      logger.error("Error in getConversationById:", error);
      throw error;
    }
  }

  /**
   * Busca mensagens de uma conversa
   * ✅ SSOT: Delega para MessagingService.getMessages
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      return await messagingService.getMessages(conversationId);
    } catch (error) {
      logger.error("Error in getMessages:", error);
      throw error;
    }
  }

  /**
   * Bloqueia uma conversa
   * ✅ SSOT: Delega para MessagingService.blockConversation
   */
  async blockConversation(
    conversationId: string,
    blockedBy: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      await messagingService.blockConversation({
        conversation_id: conversationId,
        blocked_by: blockedBy as "buyer" | "seller", // Type assertion for compatibility
        block_reason: reason,
      });
      return true;
    } catch (error) {
      logger.error("Error in blockConversation:", error);
      throw error;
    }
  }

  /**
   * Desbloqueia uma conversa
   * ✅ SSOT AAA - Delega para MessagingService
   */
  async unblockConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.unblockConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in unblockConversation:", error);
      throw error;
    }
  }

  /**
   * Fecha uma conversa
   * ✅ SSOT: Delega para MessagingService.closeConversation
   */
  async closeConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.closeConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in closeConversation:", error);
      throw error;
    }
  }

  /**
   * Reabre uma conversa
   * ✅ SSOT AAA - Delega para MessagingService
   */
  async reopenConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.reopenConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in reopenConversation:", error);
      throw error;
    }
  }

  /**
   * Deleta uma conversa (hard delete - admin only)
   * ✅ SSOT AAA - Delega para MessagingService
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.deleteConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in deleteConversation:", error);
      throw error;
    }
  }
}

export const adminMessagingService = new AdminMessagingServiceClass();
