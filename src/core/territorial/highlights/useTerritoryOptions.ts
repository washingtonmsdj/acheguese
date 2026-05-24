/**
 * useTerritoryOptions
 *
 * Carrega dinamicamente os territorios disponiveis para selecao no admin:
 * - Territorial groups ativos
 * - Bairros ativos da cidade ancora
 */

import { useQuery } from "@tanstack/react-query";
import { TERRITORY_CONFIG } from "@/config/territory";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { findSelectableLocalities } from "@/core/location/helpers/territorialResolver";
import { LocationStatus } from "@/core/location/types";
import type { HighlightTerritoryType } from "./types";

export interface TerritoryOption {
  ref_id: string;
  label: string;
  type: HighlightTerritoryType;
}

async function resolveAnchorCityId(providedAnchorCityId?: string): Promise<string | null> {
  if (providedAnchorCityId?.trim()) return providedAnchorCityId.trim();

  const locationRepo = createLocationRepository();
  const anchorCityPath = `/${TERRITORY_CONFIG.launch.country}/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  const anchorCity = await locationRepo.findByPath(anchorCityPath);
  return anchorCity?.id ?? null;
}

export function useTerritoryOptions(anchorCityId?: string) {
  return useQuery({
    queryKey: ["territory-options", anchorCityId ?? "auto"],
    queryFn: async (): Promise<TerritoryOption[]> => {
      const groupRepo = createTerritorialGroupRepository();
      const locationRepo = createLocationRepository();
      const resolvedAnchorCityId = await resolveAnchorCityId(anchorCityId);

      if (!resolvedAnchorCityId) return [];

      const districts = await findSelectableLocalities(resolvedAnchorCityId);
      const groupMap = new Map<string, TerritoryOption>();

      await Promise.all(
        districts.map(async (district) => {
          const groups = await groupRepo.findGroupsContainingLocation(district.id);
          for (const group of groups) {
            if (group.status === LocationStatus.ACTIVE && !groupMap.has(group.id)) {
              groupMap.set(group.id, {
                ref_id: group.id,
                label: group.name,
                type: "group",
              });
            }
          }
        }),
      );

      const groupOptions = Array.from(groupMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label, "pt-BR"),
      );

      const districtOptions: TerritoryOption[] = districts
        .map((district) => ({ ref_id: district.id, label: district.name, type: "location" as const }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

      return [...groupOptions, ...districtOptions];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
