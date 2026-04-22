/**
 * useIdentityHistory
 * Hook compartilhado de histórico de mudanças de identificador.
 * Consome o adapter via PublicIdentityService - zero acesso direto a DB.
 */

import { useQuery } from '@tanstack/react-query';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';
import type { EntityType, IdentityChangeRecord } from '@/core/public-identity/domain/types';

export interface UseIdentityHistoryOptions {
  entityType: EntityType;
  entityId: string | null | undefined;
  enabled?: boolean;
}

export interface UseIdentityHistoryReturn {
  history: IdentityChangeRecord[];
  isLoading: boolean;
  error: Error | null;
}

export function useIdentityHistory({
  entityType,
  entityId,
  enabled = true,
}: UseIdentityHistoryOptions): UseIdentityHistoryReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['identity-history', entityType, entityId],
    queryFn: async () => {
      return PublicIdentityService.getIdentifierHistory({ entityType, entityId: entityId! });
    },
    enabled: enabled && !!entityId,
    staleTime: 30 * 1000,
    retry: false,
  });

  return {
    history: data ?? [],
    isLoading,
    error: error as Error | null,
  };
}

