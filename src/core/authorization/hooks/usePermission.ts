/**
 * usePermission — checagem reativa para render/UI
 *
 * Retorna { allowed, isLoading, error } com cache via useQuery.
 * Ownership resolvido internamente pelo AuthorizationEngine.
 *
 * const { allowed, isLoading } = usePermission('createPost');
 * return isLoading ? <Spinner /> : allowed ? <PostButton /> : null;
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "../services/AuthorizationEngine";
import type { Action, ActionContext, TargetEntity } from "../types";

/**
 * Normaliza context e targetEntity para chave de cache estável.
 * Garante que a mesma combinação semântica produza a mesma chave.
 */
function normalizeQueryKey(
  profileId: string,
  action: Action,
  context: ActionContext,
  targetEntity?: TargetEntity,
): readonly unknown[] {
  return [
    "permission",
    profileId,
    action,
    context.communityId ?? null,
    context.businessId ?? null,
    context.eventId ?? null,
    targetEntity?.type ?? null,
    targetEntity?.id ?? null,
  ] as const;
}

export interface PermissionResult {
  allowed: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function usePermission(
  action: Action,
  context: ActionContext = {},
  targetEntity?: TargetEntity,
): PermissionResult {
  const { activeProfile } = useSessionContext();
  const profileId = activeProfile?.id ?? null;
  const targetType = targetEntity?.type;
  const targetId = targetEntity?.id;

  // Memoizar context e targetEntity para evitar re-renders desnecessários
  const stableContext = useMemo<ActionContext>(
    () => ({
      communityId: context.communityId,
      businessId: context.businessId,
      eventId: context.eventId,
    }),

    [context.communityId, context.businessId, context.eventId],
  );

  const stableTarget = useMemo<TargetEntity | undefined>(
    () => (targetType && targetId ? { type: targetType, id: targetId } : undefined),
    [targetId, targetType],
  );

  const queryKey = useMemo(
    () =>
      profileId
        ? normalizeQueryKey(profileId, action, stableContext, stableTarget)
        : null,
    [profileId, action, stableContext, stableTarget],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKey ?? ["permission", "unauthenticated"],
    queryFn: () => {
      if (!profileId) return Promise.resolve(false);
      return AuthorizationEngine.canProfilePerformAction(
        profileId,
        action,
        stableContext,
        stableTarget,
      );
    },
    enabled: !!profileId,
    staleTime: 60_000, // 1 min — alinhado com CACHE_TTL do AuthorizationEngine
    gcTime: 120_000,
  });

  return {
    allowed: data ?? false,
    isLoading,
    error: error as Error | null,
  };
}
