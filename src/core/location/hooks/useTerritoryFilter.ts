/**
 * useTerritoryFilter
 *
 * Camada central de resolução do filtro territorial ativo.
 *
 * Resolve o TerritoryFilter correto a partir do LocationContextStore
 * e, quando disponível, do contexto de rota territorial (TerritorialLayout).
 *
 * Regras:
 *   - group resolvido na rota → scope: 'group', location_ids = membros com rollout ativo
 *   - location resolvida na rota ou no store → scope: 'location', location_id
 *   - nenhum território resolvido → scope: 'none'
 *   - NUNCA retorna arrays vazios como filtro válido
 *   - NUNCA faz fallback silencioso para outra localidade
 *
 * Uso básico (fora de rota territorial — usa store):
 *   const filter = useTerritoryFilter();
 *
 * Uso em rota territorial (passa o resolved do TerritorialLayout):
 *   const { resolved } = useTerritorialContext();
 *   const filter = useTerritoryFilter(resolved);
 *
 * Uso em rota territorial com rollout filtrado (grupo):
 *   const filter = useTerritoryFilter(resolved, activeMemberIds);
 *   // activeMemberIds vem de useGroupAvailability().active_member_ids
 *
 * Aplicação nas queries:
 *   filter.scope === 'location' → .eq('location_id', filter.location_id)
 *   filter.scope === 'group'    → .in('location_id', filter.location_ids)
 *   filter.scope === 'none'     → não executar query
 */

import { useMemo } from 'react';
import { useLocationContext } from './useLocationContext';
import { useActiveTerritory } from './useActiveTerritory';
import { useUserTerritory } from './useUserTerritory';
import type { TerritoryFilter } from '../types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

/**
 * Hook principal — resolve o filtro territorial ativo.
 *
 * NOVA LÓGICA: Considera o modo territorial do usuário ('bairro' | 'cidade' | null)
 * 
 * Prioridades:
 * 1. Modo 'bairro' (usuário cadastrado) → força filtro pelo homeDistrict
 * 2. Modo 'cidade' (usuário cadastrado) → permite navegação por bairros da cidade
 * 3. Contexto de rota territorial (grupos, visitantes)
 * 4. Store de contexto (fallback)
 *
 * @param routeResolved - Território resolvido pela rota (opcional).
 * @param activeMemberIds - IDs dos membros com rollout ativo (opcional).
 *   Quando passado em contexto de grupo, restringe o filtro apenas aos membros ativos.
 *   Vem de useGroupAvailability().active_member_ids.
 *   Se vazio e routeResolved é group → scope: 'none' (nenhum membro ativo).
 */
export function useTerritoryFilter(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const { activeTerritory } = useLocationContext();
  const { territoryMode } = useActiveTerritory();
  const { hasHome, homeDistrict, homeCity } = useUserTerritory();

  return useMemo((): TerritoryFilter => {
    // ✅ PRIORIDADE 1: Modo Bairro (usuário cadastrado)
    // Quando em modo bairro, SEMPRE filtra pelo bairro do usuário, independente da URL
    if (hasHome && territoryMode === 'bairro' && homeDistrict) {
      console.log('[useTerritoryFilter] MODO BAIRRO ATIVO:', {
        bairro: homeDistrict.name,
        locationId: homeDistrict.id
      });
      return { scope: 'location', location_id: homeDistrict.id };
    }

    // ✅ PRIORIDADE 2: Modo Cidade (usuário cadastrado)
    // Permite navegação por bairros da cidade do usuário
    if (hasHome && territoryMode === 'cidade') {
      // Se está em um bairro específico da cidade do usuário, usar o bairro
      if (routeResolved?.kind === 'location' && 
          homeCity && 
          routeResolved.location.parent_id === homeCity.id) {
        console.log('[useTerritoryFilter] MODO CIDADE - Bairro específico:', {
          bairro: routeResolved.location.name,
          locationId: routeResolved.location.id
        });
        return { scope: 'location', location_id: routeResolved.location.id };
      }
      
      // Se está na cidade, mostrar toda a cidade
      if (homeCity) {
        console.log('[useTerritoryFilter] MODO CIDADE - Toda a cidade:', {
          cidade: homeCity.name,
          locationId: homeCity.id
        });
        return { scope: 'location', location_id: homeCity.id };
      }
    }

    // 3. Prioridade: contexto de rota territorial (group ou location via URL)
    // Para visitantes ou quando modo não está definido
    if (routeResolved) {
      if (routeResolved.kind === 'group') {
        // Se activeMemberIds foi passado, usar apenas os membros com rollout ativo
        const ids = activeMemberIds !== undefined
          ? activeMemberIds
          : routeResolved.group.members.map((m) => m.id);

        console.log('[useTerritoryFilter] GROUP:', {
          groupName: routeResolved.group.name,
          allMembers: routeResolved.group.members.length,
          activeMemberIds,
          finalIds: ids,
          scope: ids.length === 0 ? 'none' : 'group'
        });

        // Nunca retornar grupo sem membros como filtro válido
        if (ids.length === 0) return { scope: 'none' };
        return { scope: 'group', location_ids: ids };
      }

      if (routeResolved.kind === 'location') {
        console.log('[useTerritoryFilter] LOCATION:', {
          locationName: routeResolved.location.name,
          locationId: routeResolved.location.id
        });
        return { scope: 'location', location_id: routeResolved.location.id };
      }
    }

    // 2. Fallback: store de contexto (location ativa fora de rota territorial)
    if (activeTerritory?.type === 'location') {
      return { scope: 'location', location_id: activeTerritory.location.id };
    }

    // 5. Sem território resolvido — não filtrar
    return { scope: 'none' };
  }, [routeResolved, activeTerritory, activeMemberIds, territoryMode, homeDistrict, homeCity, hasHome]);
}

/**
 * Retorna true se o filtro está pronto para ser usado em queries.
 * Usar como `enabled` no TanStack Query.
 */
export function isTerritoryFilterReady(filter: TerritoryFilter): boolean {
  return filter.scope !== 'none';
}

/**
 * Retorna uma chave estável para uso em queryKey do TanStack Query.
 * Garante invalidação correta ao trocar de território.
 */
export function territoryFilterKey(filter: TerritoryFilter): string {
  if (filter.scope === 'location') return `loc:${filter.location_id}`;
  if (filter.scope === 'group') return `grp:${filter.location_ids.slice().sort().join(',')}`;
  return 'none';
}
