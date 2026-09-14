import { lazy, Suspense, useEffect } from "react";
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

function getResolvedLocations(
  resolved: ResolvedTerritory | null | undefined,
): Location[] {
  if (!resolved) return [];
  return resolved.kind === "group" ? resolved.group.members : [resolved.location];
}

function preconnectOfficialBoundarySources(
  resolved: ResolvedTerritory | null | undefined,
): void {
  if (typeof document === "undefined" || !resolved) return;

  const locations = getResolvedLocations(resolved);
  const origins = new Set<string>();

  locations.forEach((location) => {
    const sourceUrl = location.metadata?.source_url;
    if (typeof sourceUrl !== "string" || !sourceUrl) return;

    try {
      const source = new URL(sourceUrl);
      if (source.protocol !== "https:" && source.protocol !== "http:") return;
      origins.add(source.origin);
    } catch {
      // Invalid optional metadata must never affect entry rendering.
    }
  });

  const existingPreconnectOrigins = new Set(
    Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'),
    ).flatMap((link) => {
      try {
        return [new URL(link.href).origin];
      } catch {
        return [];
      }
    }),
  );
  const existingDnsHosts = new Set(
    Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="dns-prefetch"]'),
    ).flatMap((link) => {
      try {
        return [new URL(link.href, window.location.href).host];
      } catch {
        return [];
      }
    }),
  );

  origins.forEach((origin) => {
    const source = new URL(origin);

    if (!existingDnsHosts.has(source.host)) {
      const dnsPrefetch = document.createElement("link");
      dnsPrefetch.rel = "dns-prefetch";
      dnsPrefetch.href = `//${source.host}`;
      dnsPrefetch.dataset.entryBoundaryDnsPrefetch = "true";
      document.head.appendChild(dnsPrefetch);
      existingDnsHosts.add(source.host);
    }

    if (existingPreconnectOrigins.has(origin)) return;

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = origin;
    preconnect.crossOrigin = "anonymous";
    preconnect.dataset.entryBoundaryPreconnect = "true";
    document.head.appendChild(preconnect);
    existingPreconnectOrigins.add(origin);
  });
}

function preloadEntryOfficialBoundary(
  resolved: ResolvedTerritory | null | undefined,
): void {
  const locations = getResolvedLocations(resolved);
  if (locations.length === 0) return;

  void import("@/core/geospatial/data/officialFeatureServerBoundary")
    .then(({ loadOfficialFeatureServerBoundaries }) =>
      loadOfficialFeatureServerBoundaries(locations),
    )
    .catch(() => undefined);
}

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
  const preloadResolved =
    resolvedTerritory ?? (city ? { kind: "location" as const, location: city } : null);

  useEffect(() => {
    preconnectOfficialBoundarySources(preloadResolved);

    // Boundary starts after the first paint. The map style preload is already
    // in main.tsx before React renders, while the React runtime and MapLibre
    // engine/worker/CSS start together from the lazy loader on first render.
    preloadEntryOfficialBoundary(preloadResolved);
  }, [preloadResolved]);

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
