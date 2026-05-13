/**
 * AlertasPage - pagina dedicada aos alertas comunitarios.
 */

import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AlertFeedSection } from "@/core/community/alerts";
import { useLocationContext } from "@/core/location";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useSessionContext } from "@/core/session";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { buildCommunityTerritoryPresentation } from "@/core/community/utils/communityTerritoryPresentation";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";

interface AlertasPageProps {
  resolved?: ResolvedTerritory;
}

export default function AlertasPage({ resolved }: AlertasPageProps) {
  const { activeLocation } = useLocationContext();
  const { activeProfile } = useSessionContext();
  const { homeDistrict, homeCity } = useUserTerritory();
  const routeTerritoryFilter = useTerritoryFilter(resolved);
  const territoryFilter: TerritoryFilter = resolved
    ? routeTerritoryFilter
    : homeDistrict
      ? { scope: "location", location_id: homeDistrict.id }
      : routeTerritoryFilter;

  const resolvedLocation =
    resolved?.kind === "location"
      ? resolved.location
      : resolved?.kind === "group"
        ? resolved.group.members[0]
        : null;

  const routeTerritoryPresentation = buildCommunityTerritoryPresentation({
    resolvedLocation,
    activeLocation,
    profile: activeProfile,
  });
  const territoryPresentation = !resolved && homeDistrict
    ? {
      city: homeCity?.name ?? "",
      neighborhood: homeDistrict.name,
      locationId: homeDistrict.id,
    }
    : routeTerritoryPresentation;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          {territoryFilter.scope !== "none" ? (
            <AlertFeedSection
              territoryFilter={territoryFilter}
              city={territoryPresentation.city}
              neighborhood={territoryPresentation.neighborhood}
              locationId={territoryPresentation.locationId}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Selecione uma localizacao para ver os alertas da sua regiao.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
