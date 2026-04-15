/**
 * ChatService - Fachada SSOT v2.0
 * 
 * Ponto único de entrada para chat de corridas.
 * Exporta queries, mutations e types organizados.
 * 
 * @example
 * import { getChatByRideId, sendMessage, createChat } from '@/modules/mobility/services/ChatService';
 * import type { RideChat, ChatMessage, SendMessageInput } from '@/modules/mobility/services/ChatService';
 */

// ============================================================
// QUERIES - Operações de Leitura
// ============================================================
export {
  getChatByRideId,
  getMessages,
} from './chat.queries';

// ============================================================
// MUTATIONS - Operações de Escrita
// ============================================================
export {
  sendMessage,
  markMessagesAsRead,
  createChat,
} from './chat.mutations';

// ============================================================
// TYPES
// ============================================================
export type {
  RideChat,
  ChatMessage,
  SendMessageInput,
} from './chat.types';

// ============================================================
// FACADE UNIFICADA (compatibilidade legada)
// ============================================================
import * as chatQueries from './chat.queries';
import * as chatMutations from './chat.mutations';

/**
 * ChatFacade - Fachada unificada para chat de corridas
 * @deprecated Use funções individuais de chat.queries ou chat.mutations
 */
export const ChatFacade = {
  queries: chatQueries,
  mutations: chatMutations,
} as const;

// ============================================================
// LEGACY EXPORTS (manter para compatibilidade)
// ============================================================
export {
  ChatService,
  chatService,
} from './ChatService.impl';

// Backward-compatible aliases for older mobility API exports.
export type Conversation = import("./chat.types").RideChat;
export interface CreateMessageData {
  conversation_id: string;
  content: string;
  sender_profile_id: string;
}
