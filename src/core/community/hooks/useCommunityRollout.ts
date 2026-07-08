/**
 * useCommunityRollout - Hook para integração com sistema de rollout
 *
 * Responsável por:
 * - Verificar se community está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */
import { logger } from "@/shared/utils/logger";
import { useState, useEffect, useCallback } from "react";
import { communityRolloutService } from "../services";
import { useCommunityLocation } from "./useCommunityLocation";
import type { EffectiveRollout } from "@/core/rollout/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

type CommunityRolloutConfig = Awaited<
  ReturnType<(typeof communityRolloutService)["getCommunityConfig"]>
>;

export function useCommunityRollout(
  resolved?: ResolvedTerritory,
  fallbackLocationId?: string | null,
) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [rollout, setRollout] = useState<EffectiveRollout | null>(null);
  const [config, setConfig] = useState<CommunityRolloutConfig>(null);
  const [accessCheck, setAccessCheck] = useState<{ blocked: boolean; reason?: string }>({ blocked: false });
  const [isLoading, setIsLoading] = useState(true);

  const { activeLocationId } = useCommunityLocation();

  const checkRolloutStatus = useCallback(async () => {
    const locationId = fallbackLocationId ?? activeLocationId;
    const hasContext = resolved
      ? (resolved.kind === "location" || (resolved.kind === "group" && resolved.group.members.length > 0))
      : !!locationId;

    if (!hasContext) {
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: "Localização não selecionada" });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const active = resolved
        ? await communityRolloutService.isCommunityActive(resolved)
        : await communityRolloutService.isCommunityActiveForLocation(locationId!);
      setIsActive(active);

      const effectiveRollout = resolved
        ? await communityRolloutService.getCommunityRollout(resolved)
        : await communityRolloutService.getCommunityRolloutForLocation(locationId!);
      setRollout(effectiveRollout);

      const moduleConfig = resolved
        ? await communityRolloutService.getCommunityConfig(resolved)
        : await communityRolloutService.getCommunityConfigForLocation(locationId!);
      setConfig(moduleConfig);

      const access = resolved
        ? await communityRolloutService.checkAccess(resolved)
        : await communityRolloutService.checkAccessForLocation(locationId!);
      setAccessCheck(access);
    } catch (error: unknown) {
      logger.error("Error checking community rollout:", error);
      setIsActive(false);
      setRollout(null);
      setConfig(null);
      setAccessCheck({ blocked: true, reason: "Erro ao verificar disponibilidade" });
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId, fallbackLocationId, resolved]);

  useEffect(() => {
    checkRolloutStatus();
  }, [checkRolloutStatus]);

  return {
    isActive,
    rollout,
    config,
    isLoading,
    isBlocked: accessCheck.blocked,
    blockReason: accessCheck.reason,
    canUseFeatures: !accessCheck.blocked,
    refresh: checkRolloutStatus,
    rolloutSource: rollout?.source || null,
    isInherited: rollout?.source === "inherited",
    isLocal: rollout?.source === "local",
    inheritedFrom: rollout?.inherited_from || null,
  };
}
