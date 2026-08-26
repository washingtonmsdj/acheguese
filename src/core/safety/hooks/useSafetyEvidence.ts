/**
 * useSafetyEvidence - Hook para gerenciar evidências de segurança
 *
 * Padrão: Banco → Service → Hook → Component
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { safetyEvidenceService } from '../services/SafetyEvidenceService';
import type { SafetyEvidence, UploadSafetyEvidenceInput } from '../types';

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
      const data = await safetyEvidenceService.listIncidentEvidence(incidentId);
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
      const result = await safetyEvidenceService.upload(input, uploadedBy);
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
