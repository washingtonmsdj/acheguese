/**
 * useIdentityCooldown
 * Hook compartilhado de cooldown de identificador público.
 * Consome PublicIdentityService — zero lógica de cooldown local.
 */

import { useQuery } from '@tanstack/react-query';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';
import type { EntityType, CooldownResult } from '@/core/public-identity/domain/types';

export interface UseIdentityCooldownOptions {
  entityType: EntityType;
  entityId: string | null | undefined;
  enabled?: boolean;
}

export interface UseIdentityCooldownReturn {
  cooldown: CooldownResult | null;
  isLoading: boolean;
  error: Error | null;
}

export function useIdentityCooldown({
  entityType,
  entityId,
  enabled = true,
}: UseIdentityCooldownOptions): UseIdentityCooldownReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['identity-cooldown', entityType, entityId],
    queryFn: () =>
      PublicIdentityService.canChangeIdentifier({ entityType, entityId: entityId! }),
    enabled: enabled && !!entityId,
    staleTime: 60 * 1000, // 1 min — cooldown não muda com frequência
    retry: false,
  });

  return {
    cooldown: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
