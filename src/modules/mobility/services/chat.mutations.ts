/**
 * Chat Mutations - SSOT v2.0
 * 
 * Funções de escrita para chat de corridas
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import type { ChatMessage, SendMessageInput } from './chat.types';

/**
 * Enviar mensagem em um chat
 * 
 * @param input - Dados da mensagem
 * @returns Mensagem criada
 */
export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  try {
    if (!input.message.trim()) {
      throw new Error('Mensagem não pode estar vazia');
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
      logger.error('chat.mutations.sendMessage', error);
      throw error;
    }

    logger.info('chat.mutations.sendMessage', {
      chat_id: input.chat_id,
      sender_profile_id: input.sender_profile_id,
    });

    return data as ChatMessage;
  } catch (error) {
    logger.error('chat.mutations.sendMessage', error);
    throw error;
  }
}

/**
 * Marcar mensagens como lidas
 * 
 * @param chatId - ID do chat
 * @param userId - ID do usuário que está lendo
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('ride_chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .neq('sender_profile_id', userId)
      .is('read_at', null);

    if (error) {
      logger.error('chat.mutations.markMessagesAsRead', error);
      throw error;
    }

    logger.info('chat.mutations.markMessagesAsRead', {
      chat_id: chatId,
      user_id: userId,
    });
  } catch (error) {
    logger.error('chat.mutations.markMessagesAsRead', error);
    // Não lançar erro - marcar como lido é operação não crítica
  }
}

/**
 * Criar chat para uma corrida
 * 
 * @param rideId - ID da corrida
 * @returns Chat criado
 */
export async function createChat(rideId: string): Promise<import('./chat.types').RideChat> {
  try {
    const { data, error } = await (supabase as any)
      .from('ride_chats')
      .insert({ ride_id: rideId })
      .select()
      .single();

    if (error) {
      logger.error('chat.mutations.createChat', error);
      throw error;
    }

    logger.info('chat.mutations.createChat', { ride_id: rideId });

    return data as import('./chat.types').RideChat;
  } catch (error) {
    logger.error('chat.mutations.createChat', error);
    throw error;
  }
}


