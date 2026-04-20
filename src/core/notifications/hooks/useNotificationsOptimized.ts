/**
 * SSOT - Optimized Notifications Hook
 * 
 * Hook otimizado para notificações usando estratégias de cache do SSOT.
 * 
 * Estratégia: REALTIME (staleTime: 0, sempre fresh)
 * - Notificações devem ser sempre atualizadas
 * - Usa realtime subscriptions
 * - Cache mínimo (5 minutos gcTime)
 * 
 * @see src/config/reactQuery.config.ts - Configuração de cache
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { NotificationService, type Notification, type NotificationFilters } from '../services/NotificationService';
import { QUERY_KEYS, createQueryOptions } from '@/config/reactQuery.config';
import { useAuth } from '@/core/auth/hooks/useAuth';

/**
 * Hook para buscar notificações do usuário
 * 
 * Usa estratégia REALTIME (sempre fresh)
 * Inclui realtime subscription automática
 */
export function useNotifications(filters?: NotificationFilters) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Query com estratégia REALTIME
  const query = useQuery({
    ...createQueryOptions(
      QUERY_KEYS.notifications.list(userId || 'anonymous'),
      () => NotificationService.getUserNotifications(filters),
      'REALTIME',
      {
        enabled: !!userId,
      }
    ),
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      userId,
      (newNotification) => {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.notifications.list(userId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.notifications.unreadCount(userId),
        });
      }
    );

    return unsubscribe;
  }, [userId, queryClient]);

  return query;
}

/**
 * Hook para buscar contagem de notificações não lidas
 * 
 * Usa estratégia REALTIME (sempre fresh)
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.notifications.unreadCount(userId || 'anonymous'),
      () => NotificationService.getUnreadCount(),
      'REALTIME',
      {
        enabled: !!userId,
        refetchInterval: 30000, // Refetch a cada 30s como backup
      }
    ),
  });
}

/**
 * Hook para marcar notificação como lida
 * 
 * Usa optimistic update para UX instantânea
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (notificationId: string) => 
      NotificationService.markAsRead(notificationId),
    
    // Optimistic update
    onMutate: async (notificationId) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.notifications.list(userId),
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(
        QUERY_KEYS.notifications.list(userId)
      );

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.notifications.list(userId),
        (old: Notification[] | undefined) => {
          if (!old) return old;
          return old.map((n) =>
            n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
          );
        }
      );

      // Update unread count
      queryClient.setQueryData(
        QUERY_KEYS.notifications.unreadCount(userId),
        (old: number | undefined) => Math.max(0, (old || 0) - 1)
      );

      return { previousNotifications };
    },

    // Rollback on error
    onError: (err, notificationId, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(
        QUERY_KEYS.notifications.list(userId),
        context.previousNotifications
      );
    },

    // Refetch on success
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.list(userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.unreadCount(userId),
      });
    },
  });
}

/**
 * Hook para marcar todas as notificações como lidas
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: () => NotificationService.markAllAsRead(),
    
    onSuccess: () => {
      if (!userId) return;
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });
}

/**
 * Hook para deletar notificação
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (notificationId: string) => 
      NotificationService.deleteNotification(notificationId),
    
    // Optimistic update
    onMutate: async (notificationId) => {
      if (!userId) return;

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.notifications.list(userId),
      });

      const previousNotifications = queryClient.getQueryData(
        QUERY_KEYS.notifications.list(userId)
      );

      // Remove from list
      queryClient.setQueryData(
        QUERY_KEYS.notifications.list(userId),
        (old: Notification[] | undefined) => {
          if (!old) return old;
          return old.filter((n) => n.id !== notificationId);
        }
      );

      return { previousNotifications };
    },

    onError: (err, notificationId, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(
        QUERY_KEYS.notifications.list(userId),
        context.previousNotifications
      );
    },

    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.list(userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.unreadCount(userId),
      });
    },
  });
}

/**
 * Hook para criar notificação
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NotificationService.createNotification,
    
    onSuccess: (_, variables) => {
      // Invalidate notifications for the target user
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.list(variables.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.unreadCount(variables.user_id),
      });
    },
  });
}
