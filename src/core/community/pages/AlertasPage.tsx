/**
 * AlertasPage - pagina dedicada aos alertas comunitarios.
 */

import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AlertFeedSection } from "@/core/community/alerts";
import { useLocationContext } from "@/core/location";
import { useSessionContext } from "@/core/session";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { buildCommunityTerritoryPresentation } from "@/core/community/utils/communityTerritoryPresentation";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface AlertasPageProps {
  resolved?: ResolvedTerritory;
}

export default function AlertasPage({ resolved }: AlertasPageProps) {
  const { activeLocation } = useLocationContext();
  const { activeProfile } = useSessionContext();
  const territoryFilter = useTerritoryFilter(resolved);

  const resolvedLocation =
    resolved?.kind === "location"
      ? resolved.location
      : resolved?.kind === "group"
        ? resolved.group.members[0]
        : null;

  const territoryPresentation = buildCommunityTerritoryPresentation({
    resolvedLocation,
    activeLocation,
    profile: activeProfile,
  });

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
