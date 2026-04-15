/**
 * useTerritoryAIContent
 * 
 * Hook para buscar e gerenciar conteúdo gerado por IA para um território.
 * 
 * ✅ SSOT COMPLIANT - Usa TerritorialAIService para acesso ao banco e edge functions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TerritorialAIService, type TerritoryAIContent } from '@/core/territorial/services/TerritorialAIService';

export type { TerritoryAIContent } from '@/core/territorial/services/TerritorialAIService';

export function useTerritoryAIContent(territorySlug: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['territory-ai-content', territorySlug],
    queryFn: () => territorySlug ? TerritorialAIService.getAIContent(territorySlug) : null,
    enabled: !!territorySlug,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  const generateWithAI = useMutation({
    mutationFn: (params: {
      territory_slug: string;
      territory_name: string;
      members?: string[];
    }) => TerritorialAIService.generateAIContent(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territory-ai-content', territorySlug] });
    },
  });

  const updateContent = useMutation({
    mutationFn: (updates: Partial<TerritoryAIContent>) => {
      if (!territorySlug) throw new Error('No territory slug');
      return TerritorialAIService.updateAIContent(territorySlug, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territory-ai-content', territorySlug] });
    },
  });

  return {
    content: query.data,
    isLoading: query.isLoading,
    generateWithAI,
    updateContent,
  };
}
