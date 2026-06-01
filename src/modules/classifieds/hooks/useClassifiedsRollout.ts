/**
 * useClassifiedsRollout
 *
 * Hook para integração do módulo classifieds com o sistema de rollout.
 * Responsável por:
 * - Verificar se o módulo classifieds está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { classifiedsRolloutService } from '@/core/classifieds/services';
import { useClassifiedsLocation } from './useClassifiedsLocation';
import type { EffectiveRollout } from '@/core/rollout/types';
export function useClassifiedsRollout() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [rollout, setRollout] = useState<EffectiveRollout | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [accessCheck, setAccessCheck] = useState<{ blocked: boolean; reason?: string }>({ blocked: true });
  const [isLoading, setIsLoading] = useState(true);

  const { activeLocationId } = useClassifiedsLocation();

  const checkRolloutStatus = useCallback(async () => {
    if (!activeLocationId) {
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Localização não selecionada' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const active = await classifiedsRolloutService.isClassifiedsActive();
      setIsActive(active);

      const effectiveRollout = await classifiedsRolloutService.getClassifiedsRollout();
      setRollout(effectiveRollout);

      const moduleConfig = await classifiedsRolloutService.getClassifiedsConfig();
      setConfig(moduleConfig);

      const access = await classifiedsRolloutService.checkAccess();
      setAccessCheck(access);
    } catch (error) {
      logger.error('Error checking classifieds rollout:', error);
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Erro ao verificar disponibilidade' });
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId]);

  const isFeatureEnabled = useCallback(async (feature: string): Promise<boolean> => {
    return classifiedsRolloutService.isFeatureEnabled(feature);
  }, []);

  useEffect(() => { checkRolloutStatus(); }, [checkRolloutStatus]);

  return {
    isActive,
    rollout,
    config,
    isLoading,
    isBlocked: accessCheck.blocked,
    blockReason: accessCheck.reason,
    canUseFeatures: !accessCheck.blocked,
    refresh: checkRolloutStatus,
    isFeatureEnabled,
    rolloutSource: rollout?.source || null,
    isInherited: rollout?.source === 'inherited',
    isLocal: rollout?.source === 'local',
    inheritedFrom: rollout?.inherited_from || null,
  };
}
