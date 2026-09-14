/**
 * useMFA Hook
 *
 * Hook para gerenciar MFA (Multi-Factor Authentication).
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect } from 'react';
import { mfaService, type MFAStatus, type MFARequirement } from '../services/MFAService';

export function useMFA() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [requirement, setRequirement] = useState<MFARequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Nunca preservar uma decisão anterior durante nova consulta. `null`
      // significa desconhecido, não "desativado" nem "dispensado".
      setStatus(null);
      setRequirement(null);

      const [statusData, requirementData] = await Promise.all([
        mfaService.getMFAStatus(),
        mfaService.checkMFARequired(),
      ]);

      setStatus(statusData);
      setRequirement(requirementData);
    } catch (err) {
      logger.error('useMFA.loadStatus', err);
      setStatus(null);
      setRequirement(null);
      setError('Erro ao carregar status de MFA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const startEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);

      const enrollmentData = await mfaService.enrollMFA();
      if (!enrollmentData) {
        throw new Error('Falha ao iniciar enrollment de MFA');
      }
      return enrollmentData;
    } catch (err) {
      logger.error('useMFA.startEnrollment', err);
      setError('Erro ao iniciar configuração de MFA');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async (factorId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.verifyAndEnableMFA(factorId, code);
      if (!success) throw new Error('Código inválido');

      await loadStatus();
      return true;
    } catch (err) {
      logger.error('useMFA.verifyAndEnable', err);
      setError('Código inválido. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disable = async (factorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.disableMFA(factorId);
      if (!success) throw new Error('Falha ao desabilitar MFA');

      await loadStatus();
      return true;
    } catch (err) {
      logger.error('useMFA.disable', err);
      setError('Erro ao desabilitar MFA');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (factorId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.verifyMFACode(factorId, code);
      if (!success) throw new Error('Código inválido');
      return true;
    } catch (err) {
      logger.error('useMFA.verifyCode', err);
      setError('Código inválido. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Ações destrutivas precisam receber falha real, não uma lista vazia falsa.
  const listFactors = async () => mfaService.listMFAFactors();

  const isMFAStatusResolved = status !== null && error === null;
  const isMFARequirementResolved = requirement !== null && error === null;

  return {
    status,
    requirement,
    loading,
    error,
    loadStatus,
    startEnrollment,
    verifyAndEnable,
    disable,
    verifyCode,
    listFactors,
    isMFAEnabled: status?.mfaEnabled ?? false,
    isMFAStatusResolved,
    // Quando a política está desconhecida, required permanece true (fail-closed).
    isMFARequired: requirement?.required ?? true,
    isMFARequirementResolved,
    gracePeriodDaysRemaining: requirement?.daysRemaining ?? null,
    isInGracePeriod: (requirement?.daysRemaining ?? 0) > 0,
  };
}
