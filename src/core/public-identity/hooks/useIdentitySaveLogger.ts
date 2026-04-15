/**
 * useIdentitySaveLogger
 * Hook para facilitar logging de operações de save com mudança de identidade
 */

import { useCallback, useRef } from 'react';
import { logIdentitySaveAttempt, logIdentitySaveSuccess, logIdentitySaveError } from '../utils/identity-logger';
import type { EntityType } from '../domain/types';

interface UseIdentitySaveLoggerParams {
  entityType: EntityType;
  entityId: string;
  userId: string;
  page: string;
}

export function useIdentitySaveLogger(params: UseIdentitySaveLoggerParams) {
  const startTimeRef = useRef<number>(0);

  const logAttempt = useCallback((oldIdentifier: string, newIdentifier: string) => {
    startTimeRef.current = Date.now();
    logIdentitySaveAttempt({
      ...params,
      oldIdentifier,
      newIdentifier,
    });
  }, [params]);

  const logSuccess = useCallback((oldIdentifier: string, newIdentifier: string) => {
    const durationMs = Date.now() - startTimeRef.current;
    logIdentitySaveSuccess({
      ...params,
      oldIdentifier,
      newIdentifier,
      durationMs,
    });
  }, [params]);

  const logError = useCallback((oldIdentifier: string, newIdentifier: string, error: string, errorCode?: string) => {
    logIdentitySaveError({
      ...params,
      oldIdentifier,
      newIdentifier,
      error,
      errorCode,
    });
  }, [params]);

  return { logAttempt, logSuccess, logError };
}
