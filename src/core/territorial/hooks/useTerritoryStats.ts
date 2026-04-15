/**
 * useTerritoryStats
 * 
 * Hook para buscar estatísticas de um território (location ou group).
 * Retorna população total, número de escolas, e outras métricas.
 * 
 * ✅ SSOT COMPLIANT - Não acessa banco diretamente
 */

import { useQuery } from '@tanstack/react-query';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export interface TerritoryStats {
  population: number;
  schools: number;
  businesses: number;
  services: number;
}

async function fetchTerritoryStats(resolved: ResolvedTerritory | null): Promise<TerritoryStats> {
  if (!resolved) {
    return { population: 0, schools: 0, businesses: 0, services: 0 };
  }

  if (resolved.kind === 'location') {
    // Para location individual, busca população do metadata
    const population = (resolved.location.metadata?.population as number) ?? 0;
    
    // Busca escolas (assumindo que existe uma tabela ou campo para isso)
    // Por enquanto, valor estimado baseado na população
    const schools = Math.floor(population / 2000); // ~1 escola a cada 2000 habitantes
    
    return {
      population,
      schools,
      businesses: 0, // Será preenchido pelo useLandingFeatured
      services: 0,   // Será preenchido pelo useLandingFeatured
    };
  }

  // Para group, soma a população de todos os membros
  const totalPopulation = resolved.group.members.reduce((sum, member) => {
    const pop = (member.metadata?.population as number) ?? 0;
    return sum + pop;
  }, 0);

  const schools = Math.floor(totalPopulation / 2000);

  return {
    population: totalPopulation,
    schools,
    businesses: 0,
    services: 0,
  };
}

export function useTerritoryStats(resolved: ResolvedTerritory | null) {
  return useQuery({
    queryKey: ['territory-stats', resolved?.kind, resolved?.kind === 'location' ? resolved.location.id : resolved?.group.id],
    queryFn: () => fetchTerritoryStats(resolved),
    enabled: !!resolved,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
