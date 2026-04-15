/**
 * useIdentityAvailability
 * Hook compartilhado de disponibilidade de identificador público.
 * Consome PublicIdentityService — zero validação local.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';
import type { EntityType, AvailabilityResult } from '@/core/public-identity/domain/types';

export interface UseIdentityAvailabilityOptions {
  entityType: EntityType;
  /** ID da entidade atual (para excluir da checagem ao editar) */
  excludeEntityId?: string;
  /** Debounce em ms. Default: 400 */
  debounceMs?: number;
}

export interface UseIdentityAvailabilityReturn {
  result: AvailabilityResult | null;
  isChecking: boolean;
  /** Dispara checagem manual (útil em submit) */
  check: (identifier: string) => Promise<AvailabilityResult | null>;
  reset: () => void;
}

export function useIdentityAvailability({
  entityType,
  excludeEntityId,
  debounceMs = 400,
}: UseIdentityAvailabilityOptions): UseIdentityAvailabilityReturn {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestIdentifier = useRef<string>('');

  const check = useCallback(
    async (identifier: string): Promise<AvailabilityResult | null> => {
      if (!identifier.trim()) {
        setResult(null);
        return null;
      }
      setIsChecking(true);
      try {
        const r = await PublicIdentityService.checkAvailability({
          identifier,
          entityType,
          excludeEntityId,
        });
        setResult(r);
        return r;
      } catch {
        setResult(null);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [entityType, excludeEntityId],
  );

  /** Versão debounced — chamada ao digitar */
  const checkDebounced = useCallback(
    (identifier: string) => {
      latestIdentifier.current = identifier;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!identifier.trim()) {
        setResult(null);
        return;
      }
      setIsChecking(true);
      timerRef.current = setTimeout(async () => {
        if (latestIdentifier.current !== identifier) return;
        await check(identifier);
      }, debounceMs);
    },
    [check, debounceMs],
  );

  const reset = useCallback(() => {
    setResult(null);
    setIsChecking(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { result, isChecking, check, reset };
}

// Exporta versão debounced como default de uso em inputs
export { useIdentityAvailability as default };
