import { useMemo } from "react";

import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export function useEventTerritoryFilter(
  resolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const ssotTerritoryFilter = useTerritoryFilter(resolved, activeMemberIds);

  return useMemo(() => {
    if (resolved?.kind === "location") {
      return { scope: "location" as const, location_id: resolved.location.id };
    }

    if (resolved?.kind === "group") {
      const ids = activeMemberIds ?? resolved.group.members.map((member) => member.id);
      if (ids.length > 0) {
        return { scope: "group" as const, location_ids: ids };
      }
    }

    return ssotTerritoryFilter;
  }, [resolved, activeMemberIds, ssotTerritoryFilter]);
}
