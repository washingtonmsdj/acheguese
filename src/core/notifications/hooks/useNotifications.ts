/**
 * ══════════════════════════════════════════════════════════════════════════
 * USE NOTIFICATIONS HOOK
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Hook React para gerenciar notificações do usuário.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService, NotificationFilters, Notification } from '../services/NotificationService';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useToast } from '@/shared/hooks/use-toast';

export function useNotifications(filters?: NotificationFilters) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Obter notificações
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id, filters],
    queryFn: () => NotificationService.getUserNotifications(filters),
    enabled: !!user,
  });

  // Query: Contagem de não lidas
  const {
    data: unreadCount,
    refetch: refetchUnreadCount,
  } = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => NotificationService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Mutation: Marcar como lida
  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao marcar como lida',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Marcar todas como lidas
  const markAllAsRead = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificações marcadas como lidas',
        description: `${count} notificação(ões) marcada(s) como lida(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao marcar todas como lidas',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Deletar notificação
  const deleteNotification = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificação deletada',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao deletar notificação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (notification: Notification) => {
        // Invalidar queries para atualizar lista
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Mostrar toast para notificações importantes
        if (notification.type === 'error' || notification.type === 'warning') {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      }
    );

    return unsubscribe;
  }, [user, queryClient, toast]);

  return {
    // Data
    notifications,
    unreadCount,
    isLoading,
    error,

    // Mutations
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Helpers
    refetch,
    refetchUnreadCount,
  };
}
