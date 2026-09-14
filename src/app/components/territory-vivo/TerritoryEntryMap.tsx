import { lazy, Suspense } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  TerritoryEntryMapArrival,
  type TerritoryEntryArrivalStage,
} from "./TerritoryEntryMapArrival";

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
  isLoading: boolean;
  className?: string;
}

function EntryMapArrivalSurface({
  className,
  stage,
  label,
}: {
  className: string;
  stage: TerritoryEntryArrivalStage;
  label: string;
}) {
  const statusText =
    stage === "community"
      ? "Reconhecendo sua comunidade"
      : "Preparando o mapa oficial do território";

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
        stage={stage}
        statusText={statusText}
      />
    </section>
  );
}

export default function TerritoryEntryMap({
  city,
  resolvedTerritory = null,
  label,
  isLoading,
  className = "",
}: TerritoryEntryMapProps) {
  const territoryLabel = label ?? "Complexo do Nordeste de Amaralina";

  return (
    <Suspense
      fallback={
        <EntryMapArrivalSurface
          className={className}
          stage={isLoading ? "community" : "map"}
          label={territoryLabel}
        />
      }
    >
      <LazyTerritoryEntryMapRuntime
        city={city}
        resolvedTerritory={resolvedTerritory}
        label={territoryLabel}
        isLoading={isLoading}
        className={className}
      />
    </Suspense>
  );
}
