/**
 *  ChatService - SSOT para chat de corridas
 *
 *  IMPLEMENTAO REAL - No importar diretamente
 *  Use: import { ChatService } from './ChatService'
 *
 *  Responsabilidades:
 *  - Gerenciar chats de corridas
 *  - Enviar e receber mensagens
 *  - Marcar mensagens como lidas
 *
 *  @module modules/mobility/services
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import * as chatQueries from './chat.queries';
import * as chatMutations from './chat.mutations';

export interface RideChat {
  id: string;
  ride_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_profile_id: string;
  message: string;
  is_system_message: boolean;
  read_at: string | null;
  created_at: string;
}

export interface SendMessageInput {
  chat_id: string;
  sender_profile_id: string;
  message: string;
  is_system_message?: boolean;
}

export class ChatService {
  /**
   *  Buscar chat de uma corrida
   *
   *  @param rideId - ID da corrida
   *  @returns Chat da corrida ou null se no existir
   */
  static async getChatByRideId(rideId: string): Promise<RideChat | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_chats')
        .select('*')
        .eq('ride_id', rideId)
        .maybeSingle();

      if (error) {
        logger.error('ChatService.getChatByRideId', error);
        throw error;
      }

      return data as RideChat | null;
    } catch (error) {
      logger.error('ChatService.getChatByRideId', error);
      throw error;
    }
  }

  /**
   *  Buscar mensagens de um chat
   *
   *  @param chatId - ID do chat
   *  @returns Array de mensagens ordenadas por data
   */
  static async getMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('ChatService.getMessages', error);
        throw error;
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      logger.error('ChatService.getMessages', error);
      throw error;
    }
  }

  /**
   *  Enviar mensagem em um chat
   *
   *  @param input - Dados da mensagem
   *  @returns Mensagem criada
   */
  static async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    try {
      if (!input.message.trim()) {
        throw new Error('Mensagem nao pode estar vazia');
      }

      const { data, error } = await (supabase as any)
        .from('ride_chat_messages')
        .insert({
          chat_id: input.chat_id,
          sender_profile_id: input.sender_profile_id,
          message: input.message.trim(),
          is_system_message: input.is_system_message ?? false,
        })
        .select()
        .single();

      if (error) {
        logger.error('ChatService.sendMessage', error);
        throw error;
      }

      logger.info('ChatService.sendMessage', {
        chat_id: input.chat_id,
        sender_profile_id: input.sender_profile_id,
      });

      return data as ChatMessage;
    } catch (error) {
      logger.error('ChatService.sendMessage', error);
      throw error;
    }
  }

  /**
   *  Marcar mensagens como lidas
   *
   *  @param chatId - ID do chat
   *  @param userId - ID do usurio que est lendo
   */
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('ride_chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_profile_id', userId)
        .is('read_at', null);

      if (error) {
        logger.error('ChatService.markMessagesAsRead', error);
        throw error;
      }

      logger.info('ChatService.markMessagesAsRead', {
        chat_id: chatId,
        user_id: userId,
      });
    } catch (error) {
      logger.error('ChatService.markMessagesAsRead', error);
      //  No lanar erro - marcar como lido operao no crtica
    }
  }

  /**
   *  Criar chat para uma corrida
   *
   *  @param rideId - ID da corrida
   *  @returns Chat criado
   */
  static async createChat(rideId: string): Promise<RideChat> {
    try {
      const { data, error } = await (supabase as any)
        .from('ride_chats')
        .insert({ ride_id: rideId })
        .select()
        .single();

      if (error) {
        logger.error('ChatService.createChat', error);
        throw error;
      }

      logger.info('ChatService.createChat', { ride_id: rideId });

      return data as RideChat;
    } catch (error) {
      logger.error('ChatService.createChat', error);
      throw error;
    }
  }
}

export const chatService = ChatService;

export const ChatFacade = {
  queries: chatQueries,
  mutations: chatMutations,
} as const;
