/**
 * useEmergencyAlerts - Hook para gerenciar alertas de emergência
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '../instance';
import type { EmergencyAlert, CreateEmergencyAlertInput, SafetyFilter } from '../types';
import { logger } from '@/shared/utils/logger';

export function useEmergencyAlerts(filter?: SafetyFilter) {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await safetyService.listEmergencyAlerts(filter);
      setAlerts(data);
    } catch (err) {
      logger.error('[useEmergencyAlerts] Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (input: CreateEmergencyAlertInput) => {
    const result = await safetyService.createEmergencyAlert(input);
    if (result.success) {
      await fetchAlerts();
    }
    return result;
  };

  const updateStatus = async (alertId: string, status: any, performedBy: string) => {
    const result = await safetyService.updateAlertStatus(alertId, status, performedBy);
    if (result.success) {
      await fetchAlerts();
    }
    return result;
  };

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    createAlert,
    updateStatus,
  };
}
