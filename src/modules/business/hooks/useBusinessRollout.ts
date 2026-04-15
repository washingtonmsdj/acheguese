/**
 * useBusinessRollout - Hook para integração com sistema de rollout
 * 
 * Responsável por:
 * - Verificar se business está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { useState, useEffect, useCallback } from 'react';
import { businessRolloutService } from '../services';
import { useBusinessLocation } from './useBusinessLocation';
import { logger } from '@/shared/utils/logger';
import type { EffectiveRollout } from '@/core/rollout/types';

export function useBusinessRollout() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [rollout, setRollout] = useState<EffectiveRollout | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [accessCheck, setAccessCheck] = useState<{ blocked: boolean; reason?: string }>({ blocked: true });
  const [isLoading, setIsLoading] = useState(true);
  
  const { activeLocationId } = useBusinessLocation();

  // Verificar status do rollout
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
      // Verificar se está ativo
      const active = await businessRolloutService.isBusinessActive();
      setIsActive(active);

      // Obter rollout efetivo
      const effectiveRollout = await businessRolloutService.getBusinessRollout();
      setRollout(effectiveRollout);

      // Obter configuração
      const moduleConfig = await businessRolloutService.getBusinessConfig();
      setConfig(moduleConfig);

      // Verificar acesso
      const access = await businessRolloutService.checkAccess();
      setAccessCheck(access);
    } catch (error) {
      logger.error('Error checking business rollout', error as Error, {
        hook: 'useBusinessRollout',
        businessId,
      });
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Erro ao verificar disponibilidade' });
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId]);

  // Verificar se funcionalidade está habilitada
  const isFeatureEnabled = useCallback(async (feature: string): Promise<boolean> => {
    return businessRolloutService.isFeatureEnabled(feature);
  }, []);

  // Obter limites de uso
  const getUsageLimits = useCallback(async (): Promise<Record<string, number> | null> => {
    return businessRolloutService.getUsageLimits();
  }, []);

  // Atualizar quando localização mudar
  useEffect(() => {
    checkRolloutStatus();
  }, [checkRolloutStatus]);

  return {
    // Estado
    isActive,
    rollout,
    config,
    isLoading,
    
    // Acesso
    isBlocked: accessCheck.blocked,
    blockReason: accessCheck.reason,
    canUseFeatures: !accessCheck.blocked,
    
    // Métodos
    refresh: checkRolloutStatus,
    isFeatureEnabled,
    getUsageLimits,
    
    // Computed
    rolloutSource: rollout?.source || null,
    isInherited: rollout?.source === 'inherited',
    isLocal: rollout?.source === 'local',
    inheritedFrom: rollout?.inherited_from || null,
  };
}