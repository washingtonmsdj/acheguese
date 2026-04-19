/**
 * usePush Hook
 * 
 * React hook for push notification operations.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PushService, type StoredPushSubscription, type PushNotificationPayload } from '../services/PushService';
import { useToast } from '@/shared/hooks/use-toast';

export function usePush(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check support and permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = PushService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const permission = await PushService.hasPermission();
        setHasPermission(permission);
      }
    };

    checkSupport();
  }, []);

  // Get subscriptions
  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useQuery<StoredPushSubscription[]>({
    queryKey: ['push-subscriptions', userId],
    queryFn: () => (userId ? PushService.getSubscriptions(userId) : Promise.resolve([])),
    enabled: !!userId && isSupported,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update isSubscribed based on subscriptions
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setIsSubscribed(true);
    } else {
      setIsSubscribed(false);
    }
  }, [subscriptions]);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return PushService.subscribe(userId);
    },
    onSuccess: (result) => {
      if (result.success) {
        setIsSubscribed(true);
        setHasPermission(true);
        queryClient.invalidateQueries({ queryKey: ['push-subscriptions', userId] });
        toast({
          title: 'Notificações Ativadas',
          description: 'Você receberá notificações push neste dispositivo.',
        });
      } else {
        toast({
          title: 'Erro ao Ativar',
          description: result.error || 'Não foi possível ativar as notificações.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return PushService.unsubscribe(subscriptionId);
    },
    onSuccess: (result) => {
      if (result.success) {
        setIsSubscribed(false);
        queryClient.invalidateQueries({ queryKey: ['push-subscriptions', userId] });
        toast({
          title: 'Notificações Desativadas',
          description: 'Você não receberá mais notificações push neste dispositivo.',
        });
      } else {
        toast({
          title: 'Erro ao Desativar',
          description: result.error || 'Não foi possível desativar as notificações.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return PushService.sendTestNotification(userId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notificação Enviada',
          description: 'Verifique se você recebeu a notificação de teste.',
        });
      } else {
        toast({
          title: 'Erro ao Enviar',
          description: result.error || 'Não foi possível enviar a notificação de teste.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  // Send notification to user
  const sendToUser = async (targetUserId: string, notification: PushNotificationPayload) => {
    return PushService.sendToUser(targetUserId, notification);
  };

  // Send notification to multiple users
  const sendToUsers = async (userIds: string[], notification: PushNotificationPayload) => {
    return PushService.sendToUsers(userIds, notification);
  };

  return {
    // State
    isSupported,
    hasPermission,
    isSubscribed,
    subscriptions: subscriptions || [],

    // Loading states
    isLoadingSubscriptions,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    isSendingTest: sendTestMutation.isPending,

    // Errors
    subscriptionsError,

    // Actions
    subscribe: () => subscribeMutation.mutate(),
    unsubscribe: (subscriptionId: string) => unsubscribeMutation.mutate(subscriptionId),
    sendTest: () => sendTestMutation.mutate(),
    refetchSubscriptions,
    sendToUser,
    sendToUsers,

    // Direct access to service
    requestPermission: PushService.requestPermission,
  };
}
