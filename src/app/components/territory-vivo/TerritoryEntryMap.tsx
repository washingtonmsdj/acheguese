import { lazy, Suspense, useMemo } from "react";
import { ArrowUpRight, Map, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import { LocationType, type Location } from "@/core/location/types";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
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
  const locationLabel = isCity
    ? `${territoryName}, BA`
    : `${territoryName} · Salvador`;
  const mapHref = activeTerritory
    ? buildAppModulePath(
        APP_MODULE_SLUGS.map,
        geoPathToPublicUrl(activeTerritory.geographic_path),
      )
    : LAUNCH_URLS.map;

  return (
    <section
      className="relative h-[13.5rem] overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-raised min-[380px]:h-[15rem] md:h-full md:min-h-[39rem]"
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
            interactive={false}
            hideNavigationControl
            className="pointer-events-none h-full w-full"
          />
        </Suspense>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.02)_32%,hsl(var(--territory-canvas)/0.88)_100%)]"
      />

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-[hsl(var(--territory-canvas)/0.86)] px-3 py-2 text-xs font-semibold text-territory-ink shadow-territory-highlight backdrop-blur-md sm:left-5 sm:top-5">
        <MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />
        {locationLabel}
      </div>

      {entryPolygons.length > 0 ? (
        <div
          data-testid="territory-entry-map-boundary-status"
          className="absolute right-4 top-4 rounded-full border border-territory-brand/30 bg-[hsl(var(--territory-canvas)/0.86)] px-3 py-2 text-[0.6875rem] font-semibold text-territory-brand shadow-territory-highlight backdrop-blur-md sm:right-5 sm:top-5"
        >
          Limite oficial
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5 md:p-6">
        <div className="min-w-0 rounded-xl bg-[hsl(var(--territory-canvas)/0.86)] px-3 py-2 backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
          <h2
            id="territory-entry-map-title"
            className="font-heading text-lg font-semibold text-territory-ink sm:text-xl"
          >
            {isCity
              ? `${territoryName} disponível por inteiro`
              : `${territoryName} em destaque`}
          </h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-territory-muted sm:text-sm">
            {isCity
              ? "Escolha a cidade ou aproxime a experiência de um bairro."
              : "Confira o limite do bairro antes de entrar no território."}
          </p>
        </div>
        <Link
          to={mapHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
          aria-label={`Abrir mapa de ${territoryName}`}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <span className="sr-only">
        <Map aria-hidden="true" /> Mapa territorial de {territoryName}
      </span>
    </section>
  );
}
