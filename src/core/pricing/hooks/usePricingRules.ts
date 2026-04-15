/**
 * usePricingRules - Hook para regras de precificação
 *
 * SSOT para gerenciamento de regras.
 * Usa PricingService internamente.
 *
 * Padrão: Service → Hook → Component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingService } from '../services/PricingService';
import { toast } from 'sonner';
import type { PricingMode, PricingRule } from '../types';

export function usePricingRule(mode: PricingMode) {
  return useQuery({
    queryKey: ['pricing-rule', mode],
    queryFn: () => pricingService.getRule(mode),
    staleTime: 300000, // 5 minutos
  });
}

export function usePricingRules() {
  return useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => pricingService.listRules(),
    staleTime: 300000,
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mode,
      rule,
    }: {
      mode: PricingMode;
      rule: Partial<PricingRule>;
    }) => pricingService.updateRule(mode, rule),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rule', variables.mode] });
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Regra de precificação atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar regra de precificação');
    },
  });
}