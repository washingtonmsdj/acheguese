import { lazy, Suspense } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { TerritoryEntryMapArrival } from "./TerritoryEntryMapArrival";

const loadTerritoryEntryMapRuntime = async () => {
  const [runtimeModule] = await Promise.all([
    import("./TerritoryEntryMapRuntime"),
    import("@/core/maps/components/v3/MapLibreAdapter").then(
      ({ preloadPassiveMapLibreAdapterRuntime }) =>
        preloadPassiveMapLibreAdapterRuntime(),
    ),
  ]);

  return runtimeModule;
};
const LazyTerritoryEntryMapRuntime = lazy(loadTerritoryEntryMapRuntime);

interface TerritoryEntryMapProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  className?: string;
}

function EntryMapArrivalSurface({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  const statusText = "Conectando o mapa para sua chegada";

  return (
    <section
      className={`territory-entry-map relative h-full min-h-[12rem] w-full overflow-hidden bg-territory-raised md:min-h-[18rem] lg:min-h-[24rem] ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${statusText} de ${label}`}
    >
      <TerritoryEntryMapArrival
        label={label}
        statusText={statusText}
      />
    </section>
  );
}

function resolveTerritoryLabel(
  resolvedTerritory: ResolvedTerritory,
  city: Location | null,
): string {
  if (resolvedTerritory?.kind === "group") {
    return resolvedTerritory.group.name;
  }
  if (resolvedTerritory?.kind === "location") {
    return resolvedTerritory.location.name;
  }
  return city?.name ?? "Território";
}

export default function TerritoryEntryMap({
  city,
  resolvedTerritory = null,
  label,
  className = "",
}: TerritoryEntryMapProps) {
  const territoryLabel = label ?? resolveTerritoryLabel(resolvedTerritory, city);

  return (
    <Suspense
      fallback={
        <EntryMapArrivalSurface
          className={className}
          label={territoryLabel}
        />
      }
    >
      <LazyTerritoryEntryMapRuntime
        city={city}
        resolvedTerritory={resolvedTerritory}
        label={territoryLabel}
        className={className}
      />
    </Suspense>
  );
}
