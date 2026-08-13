import { lazy, Suspense, useMemo } from "react";
import { ArrowUpRight, Map, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Location } from "@/core/location/types";
import { LAUNCH_URLS } from "@/config/territory";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
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
  isLoading: boolean;
}

export default function TerritoryEntryMap({
  city,
  isLoading,
}: TerritoryEntryMapProps) {
  const resolved = useMemo<ResolvedTerritory>(
    () => (city ? { kind: "location", location: city } : null),
    [city],
  );
  const { polygons } = useTerritoryPolygon(resolved);

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
            territoryPolygons={polygons}
            resolved={resolved}
            fitTerritoryBounds={polygons.length > 0}
            territoryFitPadding={40}
            territoryFitMaxZoom={10.5}
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
        Salvador, BA
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5 md:p-6">
        <div className="min-w-0 rounded-xl bg-[hsl(var(--territory-canvas)/0.86)] px-3 py-2 backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
          <h2
            id="territory-entry-map-title"
            className="font-heading text-lg font-semibold text-territory-ink sm:text-xl"
          >
            Salvador disponível por inteiro
          </h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-territory-muted sm:text-sm">
            Escolha a cidade ou aproxime a experiência de um bairro.
          </p>
        </div>
        <Link
          to={LAUNCH_URLS.map}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
          aria-label="Abrir mapa de Salvador"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <span className="sr-only">
        <Map aria-hidden="true" /> Mapa territorial de Salvador
      </span>
    </section>
  );
}
