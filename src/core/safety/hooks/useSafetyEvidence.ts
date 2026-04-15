/**
 * useSafetyEvidence - Hook para gerenciar evidências de segurança
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '../instance';
import type { SafetyEvidence, UploadSafetyEvidenceInput } from '../types';
import { logger } from '@/shared/utils/logger';

export function useSafetyEvidence(incidentId?: string) {
  const [evidence, setEvidence] = useState<SafetyEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = useCallback(async () => {
    if (!incidentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await safetyService.listIncidentEvidence(incidentId);
      setEvidence(data);
    } catch (err) {
      logger.error('[useSafetyEvidence] Error fetching evidence:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar evidências');
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const uploadEvidence = async (input: UploadSafetyEvidenceInput, uploadedBy: string) => {
    setUploading(true);
    try {
      const result = await safetyService.uploadSafetyEvidence(input, uploadedBy);
      if (result.success) {
        await fetchEvidence();
      }
      return result;
    } finally {
      setUploading(false);
    }
  };

  return {
    evidence,
    loading,
    uploading,
    error,
    refetch: fetchEvidence,
    uploadEvidence,
  };
}
