/**
 * 🏆 MESSAGING TYPES - Tipos Centralizados SSOT
 *
 * ✅ Baseado nas tabelas conversations e messages
 * ✅ Tipagem completa para sistema de mensagens
 */

export interface Conversation {
  id: string;
  classified_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  blocked_by?: string;
  block_reason?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_profile_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
}

export interface ConversationWithDetails extends Conversation {
  classified_title: string;
  classified_price: number;
  classified_photo: string;
  classified_public_url: string | null;
  other_user_name: string;
  other_user_avatar: string;
}

export interface ConversationPreview extends ConversationWithDetails {
  last_message_text: string;
  unread_count: number;
}

export interface CreateConversationInput {
  classified_id: string;
  buyer_id: string;
  seller_id: string;
}

export interface SendMessageInput {
  conversation_id: string;
  sender_profile_id: string;
  text: string;
}

export interface BlockConversationInput {
  conversation_id: string;
  blocked_by: "buyer" | "seller";
  block_reason?: string;
}
