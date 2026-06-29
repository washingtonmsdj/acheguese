import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import { messagingService } from "@/core/messaging/services/MessagingService";
import type { Conversation, Message } from "@/core/messaging/types";
import type { AdminSupabaseClient } from "../types/adminDatabase.types";

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

interface ConversationStatsRow {
  status: string | null;
  is_active: boolean | null;
}

interface ConversationListRow extends AdminConversationData {
  buyer?: { name?: string | null; avatar_url?: string | null } | null;
  seller?: { name?: string | null; avatar_url?: string | null } | null;
  classified?: { title?: string | null; price?: number | null } | null;
}

type ProfileSummaryRow = {
  name?: string | null;
  avatar_url?: string | null;
};

class AdminMessagingServiceClass {
  private readonly db = supabase as unknown as AdminSupabaseClient;

  async getStats(): Promise<MessagingStats> {
    try {
      const [convResult, msgResult] = await Promise.all([
        this.db.from("conversations").select("status, is_active"),
        this.db.from("messages").select("id", { count: "exact", head: true }),
      ]);

      if (convResult.error) {
        logger.error("Error fetching conversations stats:", convResult.error);
        throw convResult.error;
      }

      if (msgResult.error) {
        logger.error("Error fetching messages stats:", msgResult.error);
        throw msgResult.error;
      }

      const rows: ConversationStatsRow[] = convResult.data || [];
      return {
        totalConversations: rows.length,
        activeConversations: rows.filter((conversation) => conversation.is_active).length,
        blockedConversations: rows.filter((conversation) => conversation.status === "blocked").length,
        totalMessages: msgResult.count || 0,
      };
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

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

      let query = this.db
        .from("conversations")
        .select(
          `
          *,
          buyer:profiles!buyer_id (id, name, avatar_url),
          seller:profiles!seller_id (id, name, avatar_url),
          classified:classifieds (id, title, price)
          `,
          { count: "exact" },
        );

      if (options.status === "active") {
        query = query.eq("is_active", true);
      } else if (options.status === "inactive") {
        query = query.eq("is_active", false);
      } else if (options.status === "blocked") {
        query = query.eq("status", "blocked");
      }

      if (options.search) {
        const searchFilter = buildSafeOrILikeFilter(["buyer.name", "seller.name"], options.search);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }

      query = query.order("last_message_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) {
        logger.error("Error fetching conversations:", error);
        throw error;
      }

      const rows = (data || []) as ConversationListRow[];
      const conversations = await Promise.all(
        rows.map(async (conversation) => {
          const { count: messageCount } = await this.db
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conversation.id);

          const result: AdminConversationData = {
            ...conversation,
            buyer_name: conversation.buyer?.name ?? undefined,
            buyer_avatar: conversation.buyer?.avatar_url ?? undefined,
            seller_name: conversation.seller?.name ?? undefined,
            seller_avatar: conversation.seller?.avatar_url ?? undefined,
            classified_title: conversation.classified?.title ?? undefined,
            classified_price: conversation.classified?.price ?? undefined,
            message_count: messageCount || 0,
          };

          return result;
        }),
      );

      return {
        data: conversations,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllConversations:", error);
      throw error;
    }
  }

  async getConversationById(id: string, userId: string): Promise<AdminConversationData | null> {
    try {
      const conversation = await messagingService.getConversationWithDetails(id, userId);
      if (!conversation) return null;

      const { count: messageCount } = await this.db
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", id);

      const [buyerProfile, sellerProfile] = await Promise.all([
        this.db.from("profiles").select("name, avatar_url").eq("id", conversation.buyer_id).single(),
        this.db.from("profiles").select("name, avatar_url").eq("id", conversation.seller_id).single(),
      ]);
      const buyerData: ProfileSummaryRow | null = (buyerProfile.data as ProfileSummaryRow | null) ?? null;
      const sellerData: ProfileSummaryRow | null = (sellerProfile.data as ProfileSummaryRow | null) ?? null;

      const result: AdminConversationData = {
        ...conversation,
        buyer_name: buyerData?.name ?? undefined,
        buyer_avatar: buyerData?.avatar_url ?? undefined,
        seller_name: sellerData?.name ?? undefined,
        seller_avatar: sellerData?.avatar_url ?? undefined,
        message_count: messageCount || 0,
      };

      return result;
    } catch (error) {
      logger.error("Error in getConversationById:", error);
      throw error;
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      return await messagingService.getMessages(conversationId);
    } catch (error) {
      logger.error("Error in getMessages:", error);
      throw error;
    }
  }

  async blockConversation(
    conversationId: string,
    blockedBy: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      await messagingService.blockConversation({
        conversation_id: conversationId,
        blocked_by: blockedBy as "buyer" | "seller",
        block_reason: reason,
      });
      return true;
    } catch (error) {
      logger.error("Error in blockConversation:", error);
      throw error;
    }
  }

  async unblockConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.unblockConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in unblockConversation:", error);
      throw error;
    }
  }

  async closeConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.closeConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in closeConversation:", error);
      throw error;
    }
  }

  async reopenConversation(conversationId: string): Promise<boolean> {
    try {
      await messagingService.reopenConversation(conversationId);
      return true;
    } catch (error) {
      logger.error("Error in reopenConversation:", error);
      throw error;
    }
  }

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
