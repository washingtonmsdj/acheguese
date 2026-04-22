/**
 * AlertasPage — Página dedicada aos alertas comunitários de segurança
 * Usa o módulo community-alerts (AlertFeedSection) como única fonte de alertas.
 *
 * MIGRAÇÃO: usa locationContextStore (fundação geográfica) em vez de profile.city.
 */

import React from "react";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AlertFeedSection } from "@/modules/community/alerts";
import { useLocationContext } from "@/core/location";
import { useSessionContext } from "@/core/session";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface AlertasPageProps {
  resolved?: ResolvedTerritory;
}

function formatSlug(slug?: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

  const locationForUi = resolvedLocation ?? activeLocation;
  const pathParts = locationForUi?.geographic_path?.split("/").filter(Boolean) ?? [];

  const city =
    locationForUi?.type === "city"
      ? locationForUi.name
      : locationForUi?.type === "district"
      ? formatSlug(pathParts[2]) || activeProfile?.city || ""
      : formatSlug(pathParts[2]) || activeProfile?.city || "";

  const neighborhood =
    locationForUi?.type === "district" ? locationForUi.name : activeProfile?.neighborhood;
  const alertLocationId =
    locationForUi?.type === "district"
      ? locationForUi.id
      : (activeProfile as { location_id?: string } | null)?.location_id;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <div className="container mx-auto max-w-2xl px-4 py-6">
          {territoryFilter.scope !== "none" ? (
            <AlertFeedSection
              territoryFilter={territoryFilter}
              city={city}
              neighborhood={neighborhood}
              locationId={alertLocationId}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              Selecione uma localização para ver os alertas da sua região.
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

