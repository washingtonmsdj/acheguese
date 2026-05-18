/**
 * Chat Queries - SSOT v2.0
 * 
 * Funções de leitura para chat de corridas
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import type { RideChat, ChatMessage } from './chat.types';

/**
 * Buscar chat de uma corrida
 * 
 * @param rideId - ID da corrida
 * @returns Chat da corrida ou null se não existir
 */
export async function getChatByRideId(rideId: string): Promise<RideChat | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('ride_chats')
      .select('*')
      .eq('ride_id', rideId)
      .maybeSingle();

    if (error) {
      logger.error('chat.queries.getChatByRideId', error);
      throw error;
    }

    return data as RideChat | null;
  } catch (error) {
    logger.error('chat.queries.getChatByRideId', error);
    throw error;
  }
}

/**
 * Buscar mensagens de um chat
 * 
 * @param chatId - ID do chat
 * @returns Array de mensagens ordenadas por data
 */
export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('ride_chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('chat.queries.getMessages', error);
      throw error;
    }

    return (data || []) as ChatMessage[];
  } catch (error) {
    logger.error('chat.queries.getMessages', error);
    throw error;
  }
}


