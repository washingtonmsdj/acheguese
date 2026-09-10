import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Map, Maximize2, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import { LocationType, type Location } from "@/core/location/types";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { SALVADOR_COMMUNITY_LAUNCH_CLUSTER } from "@/core/community/config/communityLaunch";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import {
  DEFAULT_TILE_STYLE,
  NEIGHBORHOOD_COLORS,
} from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";

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
  isLoading: boolean;
}

export default function TerritoryEntryMap({
  city,
  territory = null,
  isLoading,
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

    return brandToken ? `hsl(${brandToken})` : NEIGHBORHOOD_COLORS[1];
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
  const mapHref = activeTerritory
    ? buildAppModulePath(
        APP_MODULE_SLUGS.map,
        geoPathToPublicUrl(activeTerritory.geographic_path),
      )
    : LAUNCH_URLS.map;

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
      className="territory-entry-map relative h-[13.5rem] overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-raised min-[380px]:h-[15rem] md:h-full md:min-h-[39rem]"
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
            territoryFitPadding={40}
            territoryFitMaxZoom={isCity ? 10.5 : 13.5}
            markers={[]}
            userLocationMarker={{ enabled: false, autoAdd: false }}
            enableClustering={false}
            attribution={false}
            interactive
            onLoad={() => {
              setMapReady(true);
              setMapUnavailable(false);
            }}
            onError={() => setMapUnavailable(true)}
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
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.02)_32%,hsl(var(--territory-canvas)/0.88)_100%)]"
      />

      <h2 id="territory-entry-map-title" className="sr-only">
        {isCity
          ? `${territoryName} disponível por inteiro`
          : `${territoryName} em destaque`}
      </h2>

      <div className="absolute inset-x-0 bottom-0 hidden items-end justify-between gap-4 p-4 sm:p-5 md:flex md:p-6">
        <div className="flex max-w-sm items-center gap-2 rounded-full border border-territory-border bg-[hsl(var(--territory-surface)/0.92)] px-3 py-2 text-xs font-medium text-territory-ink shadow-territory-highlight backdrop-blur-md">
          <Sprout className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          Começamos em Salvador. Crescemos com cada comunidade.
        </div>
        <div className="flex max-w-[48%] items-center gap-1 rounded-full border border-territory-border bg-[hsl(var(--territory-surface)/0.94)] px-3 py-2 text-[0.6875rem] font-semibold text-territory-ink shadow-territory-highlight backdrop-blur-md">
          {SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((cluster, index) => (
            <span key={cluster.slug} className="flex items-center gap-1 whitespace-nowrap">
              {index > 0 ? <span className="text-territory-muted" aria-hidden="true">·</span> : null}
              {cluster.name}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-36 right-4 z-20 sm:bottom-20 sm:right-5 md:right-6">
        <Link
          to={mapHref}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-territory-border bg-[hsl(var(--territory-surface)/0.96)] text-territory-ink shadow-territory-highlight backdrop-blur-md hover:bg-territory-surface"
          aria-label={`Abrir mapa de ${territoryName}`}
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <span className="sr-only"><Map aria-hidden="true" /> Mapa territorial de {territoryName}</span>
    </section>
  );
}
