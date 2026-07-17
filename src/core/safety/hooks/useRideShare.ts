/**
 * useRideShare - Hook para compartilhamento de viagens
 *
 * SSOT para criação e gerenciamento de compartilhamentos.
 * Usa SafetyService internamente.
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safetyService } from '../services/SafetyService';
import { toast } from 'sonner';
import type { CreateRideShareInput, SharedRideData } from '../types';

export function useRideShare() {
  const queryClient = useQueryClient();

  const createShare = useMutation({
    mutationFn: (input: CreateRideShareInput) =>
      safetyService.createRideShare(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['ride-shares'] });
        toast.success('Link de compartilhamento criado!');
      } else {
        logger.error('[useRideShare] Error creating share:', result.error);
        toast.error('Erro ao criar link de compartilhamento');
      }
    },
    onError: (error) => {
      logger.error('[useRideShare] Error creating share:', error);
      toast.error('Erro ao criar link de compartilhamento');
    },
  });

  const revokeShare = useMutation({
    mutationFn: (shareId: string) => safetyService.revokeRideShare(shareId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['ride-shares'] });
        toast.success('Compartilhamento revogado');
      }
    },
  });

  return {
    createShare,
    revokeShare,
  };
}

export function useSharedRideData(shareToken: string | null | undefined) {
  return useQuery({
    queryKey: ['shared-ride', shareToken],
    queryFn: () => safetyService.getSharedRideData(shareToken!),
    enabled: !!shareToken,
    refetchInterval: 10000, // Atualiza a cada 10s para tracking em tempo real
  });
}
