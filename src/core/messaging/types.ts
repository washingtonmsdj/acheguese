/**
 * 🏆 MESSAGING TYPES - Tipos Centralizados SSOT
 *
 * ✅ Baseado nas tabelas conversations e messages
 * ✅ Tipagem completa para sistema de mensagens
 */

export interface ClassifiedConversation {
  id: string;
  classified_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  blocked_by: string | null;
  block_reason: string | null;
}

export interface ClassifiedMessage {
  id: string;
  conversation_id: string;
  sender_profile_id: string;
  text: string;
  created_at: string;
  read_at: string | null;
}

export interface ClassifiedConversationWithDetails extends ClassifiedConversation {
  classified_title: string;
  classified_price: number;
  classified_photo: string;
  classified_public_url: string | null;
  other_user_name: string;
  other_user_avatar: string;
  other_user_id: string;
}

export interface ClassifiedConversationPreview
  extends ClassifiedConversationWithDetails {
  last_message_text: string;
  unread_count: number;
}

export interface ClassifiedConversationCursor {
  lastMessageAt: string;
  id: string;
}

export interface SendClassifiedMessageInput {
  conversation_id: string;
  text: string;
}

export type ClassifiedConversationBlockReason =
  | "user_blocked"
  | "unsafe_contact"
  | "spam"
  | "harassment";

export type ClassifiedConversationModerationAction =
  | "block"
  | "unblock"
  | "close"
  | "reopen";
