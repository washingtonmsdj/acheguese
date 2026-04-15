import { useQuery } from "@tanstack/react-query";

import type { TerritoryFilter } from "@/core/location/types";
import { GastronomyFacade } from "../services";

export interface GastronomyFoodCatalogFilters {
  territoryFilter: TerritoryFilter;
  searchQuery?: string;
  cuisineType?: string;
  deliveryEnabled?: boolean;
  isOpenNow?: boolean;
  sortBy?: string;
}

interface UseGastronomyFoodCatalogOptions {
  enabled?: boolean;
}

export function useGastronomyFoodCatalog(
  filters: GastronomyFoodCatalogFilters,
  options: UseGastronomyFoodCatalogOptions = {},
) {
  const isQueryEnabled =
    (options.enabled ?? true) &&
    filters.territoryFilter.scope !== "none";

  return useQuery({
    queryKey: ["gastronomy", "food-catalog", filters],
    queryFn: () => GastronomyFacade.queries.getPublicFoodCatalog(filters),
    enabled: isQueryEnabled,
  });
}
