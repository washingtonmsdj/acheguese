/**
 * Hooks otimizados para GamificationService
 * Usa TanStack Query para cache e estado
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GamificationService } from "@/core/gamification/services/GamificationService";
import { toast } from "sonner";

// Query Keys
const GAMIFICATION_KEYS = {
  level: (userId: string) => ["gamification", "level", userId] as const,
  achievements: ["gamification", "achievements"] as const,
  userAchievements: (userId: string) =>
    ["gamification", "user-achievements", userId] as const,
  leaderboard: (limit: number) =>
    ["gamification", "leaderboard", limit] as const,
  transactions: (userId: string) =>
    ["gamification", "transactions", userId] as const,
  stats: (userId: string) => ["gamification", "stats", userId] as const,
};

/**
 * Hook para buscar nível do usuário
 */
export function useUserLevel(userId: string | undefined) {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.level(userId!),
    queryFn: () => GamificationService.getUserLevel(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar achievements disponíveis
 */
export function useAvailableAchievements() {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.achievements,
    queryFn: () => GamificationService.getAvailableAchievements(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar achievements do usuário
 */
export function useUserAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.userAchievements(userId!),
    queryFn: () => GamificationService.getUserAchievements(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar leaderboard de pontuação
 */
export function useGamificationLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.leaderboard(limit),
    queryFn: () => GamificationService.getLeaderboard(limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar transações de pontos
 */
export function usePointTransactions(
  userId: string | undefined,
  limit: number = 20,
) {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.transactions(userId!),
    queryFn: () => GamificationService.getPointTransactions(userId!, limit),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar estatísticas completas de gamificação
 */
export function useGamificationStats(userId: string | undefined) {
  return useQuery({
    queryKey: GAMIFICATION_KEYS.stats(userId!),
    queryFn: () => GamificationService.getUserGamificationStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para adicionar pontos
 */
export function useAddPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      points,
      source,
      description,
      metadata,
    }: {
      userId: string;
      points: number;
      source: string;
      description: string;
      metadata?: Record<string, any>;
    }) =>
      GamificationService.addPoints(
        userId,
        points,
        source,
        description,
        metadata,
      ),
    onSuccess: (success, variables) => {
      if (success) {
        toast.success(`+${variables.points} pontos!`);

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.level(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.transactions(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.stats(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.leaderboard(10),
        });
      } else {
        toast.error("Erro ao adicionar pontos");
      }
    },
    onError: () => {
      toast.error("Erro ao adicionar pontos");
    },
  });
}

/**
 * Hook para conceder achievement
 */
export function useGrantAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      achievementCode,
    }: {
      userId: string;
      achievementCode: string;
    }) => GamificationService.grantAchievement(userId, achievementCode),
    onSuccess: (success, variables) => {
      if (success) {
        toast.success("Achievement desbloqueado! 🏆");

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.userAchievements(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.level(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: GAMIFICATION_KEYS.stats(variables.userId),
        });
      }
    },
  });
}

/**
 * Hook para processar ação do usuário
 */
export function useProcessUserAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      action,
      metadata,
    }: {
      userId: string;
      action: string;
      metadata?: Record<string, any>;
    }) => GamificationService.processUserAction(userId, action, metadata),
    onSuccess: (result, variables) => {
      if (result.points > 0) {
        toast.success(`+${result.points} pontos!`);
      }

      if (result.achievements.length > 0) {
        result.achievements.forEach((achievement) => {
          toast.success(`Achievement desbloqueado: ${achievement} 🏆`);
        });
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: GAMIFICATION_KEYS.level(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: GAMIFICATION_KEYS.userAchievements(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: GAMIFICATION_KEYS.stats(variables.userId),
      });
    },
  });
}
