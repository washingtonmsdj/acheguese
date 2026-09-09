/**
 * Chat Types - SSOT
 * 
 * Tipos compartilhados para chat de corridas
 */

/**
 * Chat de uma corrida
 */
export interface RideChat {
  id: string;
  ride_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mensagem de chat
 */
export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_profile_id: string;
  message: string;
  is_system_message: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Input para enviar mensagem
 */
export interface SendMessageInput {
  ride_id: string;
  message: string;
}

export type Conversation = RideChat;

export interface CreateMessageData {
  conversation_id: string;
  content: string;
  sender_profile_id: string;
}
