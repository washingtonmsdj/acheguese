/**
 * useTerritoryStats
 *
 * Public population metadata for a resolved territory.
 * Cross-domain counters (businesses, schools, services, classifieds) belong to
 * LandingFeaturedService and must never be estimated from population.
 */

import { useQuery } from '@tanstack/react-query';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface TerritoryStats {
  population: number;
}

function getPopulation(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

async function fetchTerritoryStats(
  resolved: ResolvedTerritory | null,
): Promise<TerritoryStats> {
  if (!resolved) {
    return { population: 0 };
  }

  if (resolved.kind === 'location') {
    return {
      population: getPopulation(resolved.location.metadata?.population),
    };
  }

  return {
    population: resolved.group.members.reduce(
      (sum, member) => sum + getPopulation(member.metadata?.population),
      0,
    ),
  };
}

export function useTerritoryStats(resolved: ResolvedTerritory | null) {
  return useQuery({
    queryKey: [
      'territory-stats',
      resolved?.kind,
      resolved?.kind === 'location' ? resolved.location.id : resolved?.group.id,
    ],
    queryFn: () => fetchTerritoryStats(resolved),
    enabled: !!resolved,
    staleTime: 5 * 60 * 1000,
  });
}
