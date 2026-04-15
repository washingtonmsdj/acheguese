/**
 * Hooks otimizados para CommunityService
 * Usa TanStack Query para cache e estado
 * 
 * ✅ Geographic Foundation - Integrado com fundação geográfica
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CommunityService,
  type InteractionType,
  type CommunityProfile,
} from "@/core/community/services/CommunityService";
import { useCommunityLocation } from "./useCommunityLocation";
import { toast } from "sonner";

// Query Keys
const COMMUNITY_KEYS = {
  profile: (userId: string) => ["community", "profile", userId] as const,
  stats: (userId: string) => ["community", "stats", userId] as const,
  badges: (userId: string) => ["community", "badges", userId] as const,
  leaderboard: (city?: string) => ["community", "leaderboard", city] as const,
};

/**
 * Hook para buscar perfil comunitário completo
 */
export function useCommunityProfile(userId: string | undefined) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.profile(userId!),
    queryFn: () => CommunityService.getCommunityProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar estatísticas do usuário
 */
export function useCommunityStats(userId: string | undefined) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.stats(userId!),
    queryFn: () => CommunityService.getUserStats(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar badges disponíveis com progresso
 */
export function useCommunityBadges(userId: string | undefined) {
  return useQuery({
    queryKey: COMMUNITY_KEYS.badges(userId!),
    queryFn: () => CommunityService.getAvailableBadges(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar leaderboard
 */
export function useCommunityLeaderboard(limit: number = 10, city?: string) {
  const { activeLocation } = useCommunityLocation();
  
  // Usar localização ativa da fundação geográfica se disponível
  const effectiveCity = city || (activeLocation?.type === 'city' ? activeLocation.name : undefined);
  
  return useQuery({
    queryKey: COMMUNITY_KEYS.leaderboard(effectiveCity),
    queryFn: () => CommunityService.getLeaderboard(limit, effectiveCity),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para registrar interação
 */
export function useRecordInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      interactionType,
      targetType,
      targetId,
      metadata,
    }: {
      userId: string;
      interactionType: InteractionType;
      targetType?: string;
      targetId?: string;
      metadata?: Record<string, any>;
    }) =>
      CommunityService.recordInteraction(
        userId,
        interactionType,
        targetType,
        targetId,
        metadata,
      ),
    onSuccess: (result, variables) => {
      if (result.success) {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.stats(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.profile(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.badges(variables.userId),
        });

        if (result.points && result.points > 0) {
          toast.success(`+${result.points} pontos!`);
        }
      }
    },
  });
}

/**
 * Hook para atualizar perfil comunitário
 */
export function useUpdateCommunityProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<
        Pick<
          CommunityProfile,
          "display_name" | "avatar_url" | "bio" | "city" | "neighborhood"
        >
      >;
    }) => CommunityService.updateCommunityProfile(userId, updates),
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success("Perfil atualizado com sucesso!");

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.profile(variables.userId),
        });
      } else {
        toast.error("Erro ao atualizar perfil");
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });
}

/**
 * Hook para conceder badge manualmente
 */
export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      badgeCode,
    }: {
      userId: string;
      badgeCode: string;
    }) => CommunityService.awardBadge(userId, badgeCode),
    onSuccess: (result, variables) => {
      if (result.success && !result.alreadyEarned) {
        toast.success("Badge conquistado! 🏆");

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.badges(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: COMMUNITY_KEYS.profile(variables.userId),
        });
      }
    },
  });
}
