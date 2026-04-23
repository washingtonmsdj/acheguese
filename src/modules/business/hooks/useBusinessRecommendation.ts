import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { BusinessRecommendationService } from '@/core/business/services/BusinessRecommendationService';
import { logger } from '@/shared/utils/logger';

const recommendationKeys = {
  check: (businessId: string, userId: string) =>
    ['business-recommendation', 'check', businessId, userId] as const,
};

export function useBusinessRecommendation(businessId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: isRecommended = false } = useQuery({
    queryKey: recommendationKeys.check(businessId || '', userId || ''),
    queryFn: async () => {
      if (!businessId || !userId) return false;
      return BusinessRecommendationService.isRecommendedByUser(businessId, userId);
    },
    enabled: Boolean(businessId && userId),
    staleTime: 30 * 1000,
  });

  const { mutateAsync: toggleMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!businessId || !userId) {
        throw new Error('Usuario ou empresa indisponivel para recomendacao');
      }
      return BusinessRecommendationService.toggleRecommendation(businessId, userId);
    },
    onSuccess: (nextIsRecommended) => {
      if (!businessId || !userId) return;

      queryClient.setQueryData(
        recommendationKeys.check(businessId, userId),
        nextIsRecommended,
      );

      toast.success(
        nextIsRecommended
          ? 'Empresa recomendada com sucesso'
          : 'Recomendacao removida',
      );
    },
    onError: (error) => {
      logger.error('[useBusinessRecommendation] Error toggling recommendation', error);
      toast.error('Erro ao atualizar recomendacao');
    },
  });

  const toggleRecommendation = async (): Promise<boolean | null> => {
    if (!userId) {
      toast.error('Faca login para recomendar');
      return null;
    }

    return toggleMutation();
  };

  return {
    isRecommended,
    toggleRecommendation,
    loading: isPending,
  };
}
