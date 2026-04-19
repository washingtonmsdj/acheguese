/**
 * useSafetyIncident - Hook para incidentes de segurança
 *
 * SSOT para criação e gerenciamento de incidentes.
 * Usa SafetyService internamente.
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyService } from '../services/SafetyService';
import { toast } from 'sonner';
import type { CreateSafetyIncidentInput } from '../types';

export function useSafetyIncident() {
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: (input: CreateSafetyIncidentInput) =>
      safetyService.createSafetyIncident(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
        toast.success('Incidente reportado com sucesso');
      } else {
        logger.error('[useSafetyIncident] Error creating incident:', result.error);
        toast.error('Erro ao reportar incidente');
      }
    },
    onError: (error) => {
      logger.error('[useSafetyIncident] Error creating incident:', error);
      toast.error('Erro ao reportar incidente');
    },
  });

  return {
    createIncident,
  };
}