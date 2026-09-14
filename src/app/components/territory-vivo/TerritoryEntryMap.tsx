import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Map, MapPin } from "lucide-react";
import { LocationType, type Location } from "@/core/location/types";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import {
  DEFAULT_TILE_STYLE,
  NEIGHBORHOOD_COLORS,
} from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

const SALVADOR_VIEWPORT = {
  center: { latitude: -12.95, longitude: -38.48 },
  zoom: 10.1,
};

const LazyMapLibreAdapter = lazy(() =>
  import("@/core/maps/components/v3/MapLibreAdapter").then((module) => ({
    default: module.MapLibreAdapter,
  })),
);

interface TerritoryEntryMapProps {
  city: Location | null;
  territory?: Location | null;
  label?: string;
  isLoading: boolean;
  className?: string;
}

export default function TerritoryEntryMap({
  city,
  territory = null,
  label,
  isLoading,
  className = "",
}: TerritoryEntryMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const activeTerritory = territory ?? city;
  const resolved = useMemo<ResolvedTerritory>(
    () =>
      activeTerritory ? { kind: "location", location: activeTerritory } : null,
    [activeTerritory],
  );
  const { polygons } = useTerritoryPolygon(resolved);
  const territoryMapColor = useMemo(() => {
    if (typeof document === "undefined") return NEIGHBORHOOD_COLORS[1];

    const brandToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--territory-brand")
      .trim();

    const sunToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--territory-sun")
      .trim();

    return sunToken
      ? `hsl(${sunToken})`
      : brandToken
        ? `hsl(${brandToken})`
        : NEIGHBORHOOD_COLORS[1];
  }, []);
  const entryPolygons = useMemo(
    () =>
      polygons.map((polygon) => ({
        ...polygon,
        color: territoryMapColor,
        fillOpacity: 0.14,
        lineWidth: 3,
        lineOpacity: 1,
      })),
    [polygons, territoryMapColor],
  );
  const isCity = !activeTerritory || activeTerritory.type === LocationType.CITY;
  const territoryName = activeTerritory?.name ?? "Salvador";
  const territoryLabel = label ?? territoryName;
  useEffect(() => {
    setMapReady(false);
    setMapUnavailable(false);
  }, [activeTerritory?.geographic_path, isLoading]);

  useEffect(() => {
    if (isLoading || mapReady) return;

    const timeoutId = window.setTimeout(() => {
      setMapUnavailable(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, mapReady]);

  return (
    <section
      className={`territory-entry-map relative overflow-hidden bg-territory-raised ${className}`}
      aria-labelledby="territory-entry-map-title"
    >
      {isLoading ? (
        <div
          className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_62%_36%,hsl(var(--territory-brand)/0.18),transparent_28%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]"
          aria-label="Carregando mapa territorial"
        />
      ) : (
        <Suspense
          fallback={
            <div className="absolute inset-0 animate-pulse bg-territory-raised" />
          }
        >
          <LazyMapLibreAdapter
            styleUrl={DEFAULT_TILE_STYLE.styleUrl}
            initialViewport={SALVADOR_VIEWPORT}
            territoryPolygons={entryPolygons}
            resolved={resolved}
            fitTerritoryBounds={entryPolygons.length > 0}
            territoryFitPadding={12}
            territoryFitMaxZoom={isCity ? 10.5 : 15}
            markers={[]}
            userLocationMarker={{ enabled: false, autoAdd: false }}
            enableClustering={false}
            attribution={false}
            hideNavigationControl
            interactive={false}
            onLoad={() => {
              setMapReady(true);
              setMapUnavailable(false);
            }}
            className="pointer-events-none h-full w-full"
          />
        </Suspense>
      )}

      {mapUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[hsl(var(--territory-canvas)/0.72)] p-6 text-center backdrop-blur-[2px]"
        >
          <div className="max-w-xs rounded-2xl border border-territory-border bg-territory-surface/95 px-5 py-4 shadow-territory-highlight">
            <Map className="mx-auto h-6 w-6 text-territory-brand" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-territory-ink">
              O mapa não carregou agora.
            </p>
            <p className="mt-1 text-sm leading-5 text-territory-muted-strong">
              A busca e a escolha do território continuam disponíveis nesta tela.
            </p>
          </div>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.04)_0%,transparent_85%)]"
      />

      <h2 id="territory-entry-map-title" className="sr-only">
        {isCity
          ? `${territoryLabel} disponível por inteiro`
          : `${territoryLabel} em destaque`}
      </h2>

      {!isCity ? (
        <div className="entry-map-label" aria-hidden="true">
          <MapPin className="h-5 w-5" />
          <span>
            <strong>{territoryLabel}</strong>
            <small>Salvador · BA</small>
          </span>
        </div>
      ) : null}

      <span className="sr-only"><Map aria-hidden="true" /> Mapa territorial de {territoryName}</span>
    </section>
  );
}
