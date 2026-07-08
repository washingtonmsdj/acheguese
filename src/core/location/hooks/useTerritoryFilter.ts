/**
 * useTerritoryFilter
 *
 * Camada central de resolucao do filtro territorial ativo.
 *
 * Resolve o TerritoryFilter correto a partir do LocationContextStore
 * e, quando disponivel, do contexto de rota territorial (TerritorialLayout).
 *
 * Regras:
 *   - group resolvido na rota -> scope: 'group', location_ids = membros com rollout ativo
 *   - location resolvida na rota ou no store -> scope: 'location', location_id
 *   - nenhum territorio resolvido -> scope: 'none'
 *   - NUNCA retorna arrays vazios como filtro valido
 *   - NUNCA faz fallback silencioso para outra localidade
 *
 * Uso basico (fora de rota territorial - usa store):
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
 * Aplicacao nas queries:
 *   filter.scope === 'location' -> .eq('location_id', filter.location_id)
 *   filter.scope === 'group'    -> .in('location_id', filter.location_ids)
 *   filter.scope === 'none'     -> nao executar query
 */

import { useMemo } from "react";

import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import type { TerritoryFilter } from "../types";
import { useActiveTerritory } from "./useActiveTerritory";
import { useLocationContext } from "./useLocationContext";
import { useUserTerritory } from "./useUserTerritory";

/**
 * Hook principal - resolve o filtro territorial ativo.
 *
 * Regra atual:
 * 1. Grupo territorial explicito na rota
 * 2. Localizacao explicita na rota
 * 3. Modo bairro do usuario
 * 4. Modo cidade do usuario
 * 5. Store de contexto (fallback)
 *
 * Em superficies publicas, a URL territorial explicita sempre vence.
 *
 * @param routeResolved - Territorio resolvido pela rota (opcional).
 * @param activeMemberIds - IDs dos membros com rollout ativo (opcional).
 *   Quando passado em contexto de grupo, restringe o filtro apenas aos membros ativos.
 *   Vem de useGroupAvailability().active_member_ids.
 *   Se vazio e routeResolved e group -> scope: 'none' (nenhum membro ativo).
 */
export function useTerritoryFilter(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const { activeTerritory } = useLocationContext();
  const { territoryMode } = useActiveTerritory();
  const { hasHome, homeDistrict, homeCity } = useUserTerritory();

  return useMemo((): TerritoryFilter => {
    if (routeResolved?.kind === "group") {
      const ids =
        activeMemberIds !== undefined
          ? activeMemberIds
          : routeResolved.group.members.map((member) => member.id);

      if (ids.length === 0) return { scope: "none" };
      return { scope: "group", location_ids: ids };
    }

    if (routeResolved?.kind === "location") {
      return { scope: "location", location_id: routeResolved.location.id };
    }

    if (hasHome && territoryMode === "bairro" && homeDistrict) {
      return { scope: "location", location_id: homeDistrict.id };
    }

    if (hasHome && territoryMode === "cidade" && homeCity) {
      return { scope: "location", location_id: homeCity.id };
    }

    if (activeTerritory?.type === "location") {
      return { scope: "location", location_id: activeTerritory.location.id };
    }

    return { scope: "none" };
  }, [
    activeMemberIds,
    activeTerritory,
    hasHome,
    homeCity,
    homeDistrict,
    routeResolved,
    territoryMode,
  ]);
}

/**
 * Retorna true se o filtro esta pronto para ser usado em queries.
 * Usar como `enabled` no TanStack Query.
 */
export function isTerritoryFilterReady(filter: TerritoryFilter): boolean {
  return filter.scope !== "none";
}

/**
 * Retorna uma chave estavel para uso em queryKey do TanStack Query.
 * Garante invalidacao correta ao trocar de territorio.
 */
export function territoryFilterKey(filter: TerritoryFilter): string {
  if (filter.scope === "location") return `loc:${filter.location_id}`;
  if (filter.scope === "group") {
    return `grp:${filter.location_ids.slice().sort().join(",")}`;
  }
  return "none";
}
