/**
 * useMFA Hook
 * 
 * Hook para gerenciar MFA (Multi-Factor Authentication)
 */

import { useState, useEffect } from 'react';
import { mfaService, type MFAStatus, type MFARequirement } from '../services/MFAService';
import { logger } from '@/shared/utils/logger';

export function useMFA() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [requirement, setRequirement] = useState<MFARequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar status de MFA
  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusData, requirementData] = await Promise.all([
        mfaService.getMFAStatus(),
        mfaService.checkMFARequired(),
      ]);

      setStatus(statusData);
      setRequirement(requirementData);
    } catch (err) {
      logger.error('useMFA.loadStatus', err);
      setError('Erro ao carregar status de MFA');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    loadStatus();
  }, []);

  // Iniciar enrollment
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

  // Verificar e habilitar MFA
  const verifyAndEnable = async (factorId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.verifyAndEnableMFA(factorId, code);
      
      if (!success) {
        throw new Error('Código inválido');
      }

      // Recarregar status
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

  // Desabilitar MFA
  const disable = async (factorId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.disableMFA(factorId);
      
      if (!success) {
        throw new Error('Falha ao desabilitar MFA');
      }

      // Recarregar status
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

  // Verificar código durante login
  const verifyCode = async (factorId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await mfaService.verifyMFACode(factorId, code);
      
      if (!success) {
        throw new Error('Código inválido');
      }

      return true;
    } catch (err) {
      logger.error('useMFA.verifyCode', err);
      setError('Código inválido. Tente novamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Listar fatores
  const listFactors = async () => {
    try {
      return await mfaService.listMFAFactors();
    } catch (err) {
      logger.error('useMFA.listFactors', err);
      return [];
    }
  };

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
    // Computed properties
    isMFAEnabled: status?.mfaEnabled || false,
    isMFARequired: requirement?.required || false,
    gracePeriodDaysRemaining: requirement?.daysRemaining || null,
    isInGracePeriod: (requirement?.daysRemaining || 0) > 0,
  };
}
