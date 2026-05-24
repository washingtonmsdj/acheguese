/**
 * useEmergencyAlert - Hook para alertas de emergência
 *
 * SSOT para criação e gerenciamento de alertas.
 * Usa SafetyService internamente.
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safetyService } from '../services/SafetyService';
import { toast } from 'sonner';
import type {
  CreateEmergencyAlertInput,
  EmergencyAlert,
  EmergencyAlertStatus,
  SafetyFilter,
} from '../types';

export function useEmergencyAlert() {
  const queryClient = useQueryClient();

  const createAlert = useMutation({
    mutationFn: (input: CreateEmergencyAlertInput) =>
      safetyService.createEmergencyAlert(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
        toast.error('Alerta de emergência enviado', {
          description: 'Sua localização e dados foram salvos.',
          duration: 8000,
        });
      } else {
        logger.error('[useEmergencyAlert] Error creating alert:', result.error);
        toast.error('Erro ao enviar alerta. Tente novamente.');
      }
    },
    onError: (error) => {
      logger.error('[useEmergencyAlert] Error creating alert:', error);
      toast.error('Erro ao enviar alerta. Tente novamente.');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({
      alertId,
      status,
      performedBy,
    }: {
      alertId: string;
      status: EmergencyAlertStatus;
      performedBy: string;
    }) => safetyService.updateAlertStatus(alertId, status, performedBy),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
        toast.success('Status do alerta atualizado');
      }
    },
  });

  return {
    createAlert,
    updateStatus,
  };
}

export function useEmergencyAlerts(filter: SafetyFilter = {}) {
  return useQuery({
    queryKey: ['emergency-alerts', filter],
    queryFn: () => safetyService.listEmergencyAlerts(filter),
    refetchInterval: 30000, // Atualiza a cada 30s
  });
}

export function useEmergencyAlertById(alertId: string | null | undefined) {
  return useQuery({
    queryKey: ['emergency-alert', alertId],
    queryFn: () => safetyService.getEmergencyAlert(alertId!),
    enabled: !!alertId,
  });
}
