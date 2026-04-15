/**
 * useSafetyIncidents - Hook para gerenciar incidentes de segurança
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '../instance';
import type { SafetyIncident, CreateSafetyIncidentInput, SafetyFilter } from '../types';
import { logger } from '@/shared/utils/logger';

export function useSafetyIncidents(filter?: SafetyFilter) {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await safetyService.listSafetyIncidents(filter);
      setIncidents(data);
    } catch (err) {
      logger.error('[useSafetyIncidents] Error fetching incidents:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar incidentes');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const createIncident = async (input: CreateSafetyIncidentInput) => {
    const result = await safetyService.createSafetyIncident(input);
    if (result.success) {
      await fetchIncidents();
    }
    return result;
  };

  const updateStatus = async (incidentId: string, status: any, performedBy: string) => {
    const result = await safetyService.updateIncidentStatus(incidentId, status, performedBy);
    if (result.success) {
      await fetchIncidents();
    }
    return result;
  };

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    createIncident,
    updateStatus,
  };
}
