/**
 * useCommunityRollout - Hook para integração com sistema de rollout
 * 
 * Responsável por:
 * - Verificar se community está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { useState, useEffect, useCallback } from 'react';
import { communityRolloutService } from '../services';
import { useCommunityLocation } from './useCommunityLocation';
import type { EffectiveRollout } from '@/core/rollout/types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export function useCommunityRollout(resolved?: ResolvedTerritory) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [rollout, setRollout] = useState<EffectiveRollout | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [accessCheck, setAccessCheck] = useState<{ blocked: boolean; reason?: string }>({ blocked: false });
  const [isLoading, setIsLoading] = useState(true);
  
  const { activeLocationId } = useCommunityLocation();

  // Verificar status do rollout
  const checkRolloutStatus = useCallback(async () => {
    // Para grupos, resolved já contém os membros — não depende do store
    const hasContext = resolved
      ? (resolved.kind === 'location' || (resolved.kind === 'group' && resolved.group.members.length > 0))
      : !!activeLocationId;

    if (!hasContext) {
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Localização não selecionada' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const active = await communityRolloutService.isCommunityActive(resolved);
      setIsActive(active);

      const effectiveRollout = await communityRolloutService.getCommunityRollout(resolved);
      setRollout(effectiveRollout);

      const moduleConfig = await communityRolloutService.getCommunityConfig(resolved);
      setConfig(moduleConfig);

      const access = await communityRolloutService.checkAccess(resolved);
      setAccessCheck(access);
    } catch (error) {
      console.error('Error checking community rollout:', error);
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: 'Erro ao verificar disponibilidade' });
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId, resolved]);

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
    
    // Computed
    rolloutSource: rollout?.source || null,
    isInherited: rollout?.source === 'inherited',
    isLocal: rollout?.source === 'local',
    inheritedFrom: rollout?.inherited_from || null,
  };
}