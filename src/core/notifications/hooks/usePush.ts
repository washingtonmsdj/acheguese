/**
 * usePush Hook
 *
 * React hook for the current user's push subscription and self-test flow.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PushService, type StoredPushSubscription } from '../services/PushService';
import { useToast } from '@/shared/hooks/use-toast';

interface SubscriptionTarget {
  id: string;
  endpoint: string;
}

export function usePush(userId?: string) {
  const [isSupportResolved, setIsSupportResolved] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentBrowserEndpoint, setCurrentBrowserEndpoint] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refreshBrowserState = async () => {
    try {
      const supported = PushService.isSupported();
      setIsSupported(supported);

      if (!supported) {
        setHasPermission(false);
        setCurrentBrowserEndpoint(null);
        return;
      }

      const [permission, endpoint] = await Promise.all([
        PushService.hasPermission(),
        PushService.getCurrentBrowserSubscriptionEndpoint(),
      ]);
      setHasPermission(permission);
      setCurrentBrowserEndpoint(endpoint);
    } finally {
      setIsSupportResolved(true);
    }
  };

  useEffect(() => {
    void refreshBrowserState();
  }, []);

  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useQuery<StoredPushSubscription[]>({
    queryKey: ['push-subscriptions', userId],
    queryFn: () => (userId ? PushService.getSubscriptions(userId) : Promise.resolve([])),
    enabled: !!userId && isSupportResolved && isSupported,
    staleTime: 1000 * 60 * 5,
  });

  const activeSubscriptions = subscriptions || [];
  const currentSubscription = useMemo(
    () =>
      currentBrowserEndpoint
        ? activeSubscriptions.find((subscription) => subscription.endpoint === currentBrowserEndpoint) ?? null
        : null,
    [activeSubscriptions, currentBrowserEndpoint],
  );
  const isSubscribed = currentSubscription !== null;

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return PushService.subscribe(userId);
    },
    onSuccess: async (result) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['push-subscriptions', userId] }),
          refreshBrowserState(),
        ]);
        toast({
          title: 'Notificações ativadas',
          description: 'Este dispositivo foi registrado para receber notificações push.',
        });
      } else {
        toast({
          title: 'Erro ao ativar',
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

  const unsubscribeMutation = useMutation({
    mutationFn: async ({ id, endpoint }: SubscriptionTarget) =>
      PushService.unsubscribe(id, endpoint),
    onSuccess: async (result, target) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['push-subscriptions', userId] });
        if (target.endpoint === currentBrowserEndpoint) {
          await refreshBrowserState();
        }
        toast({
          title: 'Dispositivo removido',
          description:
            target.endpoint === currentBrowserEndpoint
              ? 'Este dispositivo não receberá mais notificações push.'
              : 'O dispositivo selecionado não receberá mais notificações push.',
        });
      } else {
        toast({
          title: 'Erro ao desativar',
          description: result.error || 'Não foi possível remover o dispositivo.',
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

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID is required');
      return PushService.sendTestNotification(userId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Notificação enviada',
          description: 'Verifique se você recebeu a notificação de teste.',
        });
      } else {
        toast({
          title: 'Erro ao enviar',
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

  return {
    isSupportResolved,
    isSupported,
    hasPermission,
    isSubscribed,
    currentBrowserEndpoint,
    currentSubscriptionId: currentSubscription?.id ?? null,
    subscriptions: activeSubscriptions,
    isLoadingSubscriptions,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    isSendingTest: sendTestMutation.isPending,
    subscriptionsError,
    subscribe: () => subscribeMutation.mutate(),
    unsubscribe: (subscriptionId: string, endpoint: string) =>
      unsubscribeMutation.mutate({ id: subscriptionId, endpoint }),
    sendTest: () => sendTestMutation.mutate(),
    refetchSubscriptions,
    refreshBrowserState,
    requestPermission: PushService.requestPermission,
  };
}
