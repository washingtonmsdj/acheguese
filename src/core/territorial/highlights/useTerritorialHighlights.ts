/**
 * useTerritorialHighlights
 *
 * Hook para consumir destaques editoriais do território na landing.
 * Usa TanStack Query com staleTime de 5 min — conteúdo editorial não muda a cada render.
 */

import { useQuery } from '@tanstack/react-query';
import { territorialHighlightService } from './TerritorialHighlightService';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

const STALE_TIME = 5 * 60 * 1000;

function resolvedToKey(resolved: ResolvedTerritory): string {
  if (!resolved) return 'none';
  return resolved.kind === 'group'
    ? `group:${resolved.group.id}`
    : `loc:${resolved.location.id}`;
}

export function useTerritorialHighlights(resolved: ResolvedTerritory) {
  const key = resolvedToKey(resolved);
  const enabled = resolved !== null;

  return useQuery({
    queryKey: ['territorial-highlights', key],
    queryFn: () => territorialHighlightService.getHighlightsForResolved(resolved),
    enabled,
    staleTime: STALE_TIME,
  });
}
