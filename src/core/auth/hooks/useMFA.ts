/**
 * useMFA Hook
 *
 * Hook para gerenciar MFA (Multi-Factor Authentication).
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useRef } from 'react';
import { mfaService, type MFAStatus, type MFARequirement, type MFAEnrollmentData } from '../services/MFAService';

export function useMFA() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [requirement, setRequirement] = useState<MFARequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadStatusRequestIdRef = useRef(0);
  const startEnrollmentInFlightRef = useRef<Promise<MFAEnrollmentData | null> | null>(null);
  const verifyAndEnableInFlightRef = useRef<{
    key: string;
    promise: Promise<boolean>;
  } | null>(null);
  const disableInFlightRef = useRef<{
    factorId: string;
    promise: Promise<boolean>;
  } | null>(null);

  const loadStatus = async () => {
    const requestId = loadStatusRequestIdRef.current + 1;
    loadStatusRequestIdRef.current = requestId;

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      // Nunca preservar uma decisão anterior durante nova consulta. `null`
      // significa desconhecido, não "desativado" nem "dispensado".
      setStatus(null);
      setRequirement(null);
    }

    try {
      const [statusData, requirementData] = await Promise.all([
        mfaService.getMFAStatus(),
        mfaService.checkMFARequired(),
      ]);

      if (
        !mountedRef.current ||
        requestId !== loadStatusRequestIdRef.current
      ) {
        return;
      }

      setStatus(statusData);
      setRequirement(requirementData);
    } catch (err) {
      logger.error('useMFA.loadStatus', err);
      if (
        !mountedRef.current ||
        requestId !== loadStatusRequestIdRef.current
      ) {
        return;
      }
      setStatus(null);
      setRequirement(null);
      setError('Erro ao carregar status de MFA');
    } finally {
      if (
        mountedRef.current &&
        requestId === loadStatusRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void loadStatus();
    return () => {
      mountedRef.current = false;
      loadStatusRequestIdRef.current += 1;
    };
  }, []);

  const startEnrollment = async (): Promise<MFAEnrollmentData | null> => {
    const activeEnrollment = startEnrollmentInFlightRef.current;
    if (activeEnrollment) return activeEnrollment;

    const operation = (async () => {
      try {
        setLoading(true);
        setError(null);

        // Antes de criar outro fator, reconfirmar a autoridade real. Uma falha
        // de consulta não pode ser interpretada como "MFA desativado".
        const currentStatus = await mfaService.getMFAStatus();
        if (!currentStatus) {
          throw new Error('Status de MFA indisponível');
        }
        if (currentStatus.mfaEnabled) {
          if (mountedRef.current) setStatus(currentStatus);
          throw new Error('MFA já está ativado');
        }

        const enrollmentData = await mfaService.enrollMFA();
        if (!enrollmentData) {
          throw new Error('Falha ao iniciar enrollment de MFA');
        }
        return enrollmentData;
      } catch (err) {
        logger.error('useMFA.startEnrollment', err);
        if (mountedRef.current) {
          setError('Não foi possível confirmar o estado da conta para iniciar a configuração de MFA');
        }
        return null;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    startEnrollmentInFlightRef.current = operation;
    try {
      return await operation;
    } finally {
      if (startEnrollmentInFlightRef.current === operation) {
        startEnrollmentInFlightRef.current = null;
      }
    }
  };

  const verifyAndEnable = async (factorId: string, code: string) => {
    const key = `${factorId}:${code}`;
    const activeVerification = verifyAndEnableInFlightRef.current;
    if (activeVerification) {
      if (activeVerification.key === key) return activeVerification.promise;
      return false;
    }

    const operation = (async () => {
      try {
        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const success = await mfaService.verifyAndEnableMFA(factorId, code);
        if (!success) throw new Error('Código inválido');

        await loadStatus();
        return true;
      } catch (err) {
        logger.error('useMFA.verifyAndEnable', err);
        if (mountedRef.current) setError('Código inválido. Tente novamente.');
        return false;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    verifyAndEnableInFlightRef.current = { key, promise: operation };
    try {
      return await operation;
    } finally {
      if (verifyAndEnableInFlightRef.current?.promise === operation) {
        verifyAndEnableInFlightRef.current = null;
      }
    }
  };

  const disable = async (factorId: string) => {
    const activeDisable = disableInFlightRef.current;
    if (activeDisable) {
      if (activeDisable.factorId === factorId) return activeDisable.promise;
      return false;
    }

    const operation = (async () => {
      try {
        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const success = await mfaService.disableMFA(factorId);
        if (!success) throw new Error('Falha ao desabilitar MFA');

        await loadStatus();
        return true;
      } catch (err) {
        logger.error('useMFA.disable', err);
        if (mountedRef.current) setError('Erro ao desabilitar MFA');
        return false;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();

    disableInFlightRef.current = { factorId, promise: operation };
    try {
      return await operation;
    } finally {
      if (disableInFlightRef.current?.promise === operation) {
        disableInFlightRef.current = null;
      }
    }
  };

  const listFactors = async () => {
    try {
      return await mfaService.listMFAFactors();
    } catch (err) {
      logger.error('useMFA.listFactors', err);
      if (mountedRef.current) {
        setError('Não foi possível consultar os fatores de MFA');
      }
      return null;
    }
  };

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
    listFactors,
    isMFAEnabled: status?.mfaEnabled ?? false,
    isMFAStatusResolved,
    isMFARequired: requirement?.required ?? true,
    isMFARequirementResolved,
    gracePeriodDaysRemaining: requirement?.daysRemaining ?? null,
    isInGracePeriod: (requirement?.daysRemaining ?? 0) > 0,
  };
}
