/**
 * useGastronomyReviews — Hooks para gerenciar avaliações de gastronomia
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSessionContext } from '@/core/session';
import {
  ReviewQueryService,
  type Review,
  type CreateReviewInput,
  type UpdateReviewInput,
  type BusinessResponseInput,
  type ReportReviewInput,
  type VoteReviewInput,
} from '../services/review.queries';

const QUERY_KEYS = {
  businessReviews: (businessProfileId: string) => [
    'gastronomy',
    'reviews',
    'business',
    businessProfileId,
  ],
  businessReviewStats: (businessProfileId: string) => [
    'gastronomy',
    'reviews',
    'stats',
    businessProfileId,
  ],
  canUserReview: (userId: string, businessProfileId: string) => [
    'gastronomy',
    'reviews',
    'can-review',
    userId,
    businessProfileId,
  ],
  userReviewVote: (reviewId: string, voterProfileId: string) => [
    'gastronomy',
    'reviews',
    'vote',
    reviewId,
    voterProfileId,
  ],
};

/**
 * Hook para obter avaliações de um negócio
 */
export function useBusinessReviews(params: {
  businessProfileId: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.businessReviews(params.businessProfileId),
    queryFn: () => ReviewQueryService.getBusinessReviews(params),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter estatísticas de avaliações
 */
export function useBusinessReviewStats(businessProfileId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.businessReviewStats(businessProfileId),
    queryFn: () => ReviewQueryService.getBusinessReviewStats(businessProfileId),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para verificar se usuário pode avaliar
 */
export function useCanUserReview(params: {
  userId: string;
  businessProfileId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.canUserReview(params.userId, params.businessProfileId),
    queryFn: () => ReviewQueryService.canUserReviewBusiness(params),
    enabled: params.enabled !== false && !!params.userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para criar avaliação
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      ReviewQueryService.createReview(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.businessReviews(variables.reviewed_profile_id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.businessReviewStats(variables.reviewed_profile_id),
      });
      // Invalidar canUserReview para todos os usuários deste negócio
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'reviews', 'can-review'],
      });

      toast.success('Avaliação publicada com sucesso!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao publicar avaliação. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para atualizar avaliação
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { reviewId: string; input: UpdateReviewInput }) =>
      ReviewQueryService.updateReview(params.reviewId, params.input),
    onSuccess: () => {
      // Invalidar todas as reviews (não sabemos qual negócio)
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'reviews'],
      });

      toast.success('Avaliação atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar avaliação. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para deletar avaliação
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => ReviewQueryService.deleteReview(reviewId),
    onSuccess: () => {
      // Invalidar todas as reviews
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'reviews'],
      });

      toast.success('Avaliação removida com sucesso!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao remover avaliação. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para adicionar resposta do estabelecimento
 */
export function useAddBusinessResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { reviewId: string; input: BusinessResponseInput }) =>
      ReviewQueryService.addBusinessResponse(params.reviewId, params.input),
    onSuccess: () => {
      // Invalidar todas as reviews
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'reviews'],
      });

      toast.success('Resposta publicada com sucesso!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao publicar resposta. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para denunciar avaliação
 */
export function useReportReview() {
  return useMutation({
    mutationFn: (input: ReportReviewInput) =>
      ReviewQueryService.reportReview(input),
    onSuccess: () => {
      toast.success('Denúncia enviada. Obrigado por nos ajudar a manter a qualidade!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao enviar denúncia. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para votar em avaliação (útil/não útil)
 */
export function useVoteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VoteReviewInput) => ReviewQueryService.voteReview(input),
    onSuccess: (_, variables) => {
      // Invalidar reviews para atualizar contadores
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'reviews'],
      });

      // Invalidar voto do usuário
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userReviewVote(
          variables.review_id,
          variables.voter_profile_id,
        ),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao registrar voto. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para obter voto do usuário em uma avaliação
 */
export function useUserReviewVote(params: {
  reviewId: string;
  voterProfileId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.userReviewVote(params.reviewId, params.voterProfileId),
    queryFn: () => ReviewQueryService.getUserReviewVote(params),
    enabled: params.enabled !== false && !!params.voterProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook completo para gerenciar reviews de um negócio
 */
export function useReviewsManager(businessProfileId: string) {
  const { user, activeProfile } = useSessionContext();

  const reviews = useBusinessReviews({ businessProfileId });
  const stats = useBusinessReviewStats(businessProfileId);
  const canReview = useCanUserReview({
    userId: user?.id || '',
    businessProfileId,
    enabled: !!user?.id,
  });

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const reportReview = useReportReview();
  const voteReview = useVoteReview();

  return {
    // Data
    reviews: reviews.data || [],
    stats: stats.data,
    canReview: canReview.data || false,

    // Loading states
    isLoadingReviews: reviews.isLoading,
    isLoadingStats: stats.isLoading,
    isCheckingCanReview: canReview.isLoading,

    // Mutations
    createReview: createReview.mutateAsync,
    updateReview: updateReview.mutateAsync,
    deleteReview: deleteReview.mutateAsync,
    reportReview: reportReview.mutateAsync,
    voteReview: voteReview.mutateAsync,

    // Mutation states
    isCreating: createReview.isPending,
    isUpdating: updateReview.isPending,
    isDeleting: deleteReview.isPending,
    isReporting: reportReview.isPending,
    isVoting: voteReview.isPending,

    // User context
    user,
    activeProfile,
  };
}
