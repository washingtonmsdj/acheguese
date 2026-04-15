/**
 * useServicesRollout - Hook para integração com sistema de rollout
 *
 * Responsável por:
 * - Verificar se o módulo services está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { useState, useEffect, useCallback } from 'react';
import { servicesRolloutService } from '../services';
import { useServicesLocation } from './useServicesLocation';
import type { EffectiveRollout } from '@/core/rollout/types';

export function useServicesRollout() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [rollout, setRollout] = useState<EffectiveRollout | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [accessCheck, setAccessCheck] = useState<{ blocked: boolean; reason?: string }>({ blocked: true });
  const [isLoading, setIsLoading] = useState(true);

  const { activeLocationId } = useServicesLocation();

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
      const active = await servicesRolloutService.isServicesActive();
      setIsActive(active);

      const effectiveRollout = await servicesRolloutService.getServicesRollout();
      setRollout(effectiveRollout);

      const moduleConfig = await servicesRolloutService.getServicesConfig();
      setConfig(moduleConfig);

      const access = await servicesRolloutService.checkAccess();
      setAccessCheck(access);
    } catch (error) {
      console.error('Error checking services rollout:', error);
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Erro ao verificar disponibilidade' });
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId]);

  const isFeatureEnabled = useCallback(async (feature: string): Promise<boolean> => {
    return servicesRolloutService.isFeatureEnabled(feature);
  }, []);

  const getUsageLimits = useCallback(async (): Promise<Record<string, number> | null> => {
    return servicesRolloutService.getUsageLimits();
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
    getUsageLimits,
    rolloutSource: rollout?.source || null,
    isInherited: rollout?.source === 'inherited',
    isLocal: rollout?.source === 'local',
    inheritedFrom: rollout?.inherited_from || null,
  };
}
