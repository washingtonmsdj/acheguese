/**
 * useMobilityConversations
 * 
 * Hook para buscar conversas de mobilidade
 * Substitui queries diretas no banco em MobilityChatList
 * 
 * SSOT: Database → MobilityService → Hook → Component
 */

import { useQuery } from '@tanstack/react-query';
import { getMobilityConversations, getLastMessage, getUnreadCount } from '@/core/mobility/services/mobility.queries';
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from '@/core/mobility/constants';

export function useMobilityConversations(profileId: string | null | undefined) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.mobilityConversations(profileId!),
    queryFn: () => getMobilityConversations(profileId!),
    enabled: !!profileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });
}

export function useLastMessage(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.lastMessage(conversationId!),
    queryFn: () => getLastMessage(conversationId!),
    enabled: !!conversationId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_SHORT,
  });
}

export function useUnreadCount(conversationId: string | null | undefined, profileId: string | null | undefined) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.unreadCount(conversationId!, profileId!),
    queryFn: () => getUnreadCount(conversationId!, profileId!),
    enabled: !!conversationId && !!profileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_SHORT,
  });
}
