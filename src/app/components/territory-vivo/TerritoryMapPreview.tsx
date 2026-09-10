import { ArrowRight, ArrowUpRight, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import type { ControlPosition } from "@/core/maps/components/v3/controls/types";
import type { TerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { MapMarker, MapViewport } from "@/core/maps/types/core";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { cn } from "@/shared/utils/cn";

interface TerritoryMapFeaturedResult {
  title: string;
  subtitle: string;
  href: string;
  imageUrl?: string | null;
  actionLabel?: string;
}

interface TerritoryMapPreviewProps {
  resolved: ResolvedTerritory | null;
  mapHref: string;
  territoryName: string;
  title?: string;
  markers?: MapMarker[];
  featuredResult?: TerritoryMapFeaturedResult;
  onMarkerClick?: (id: string) => void;
  showNavigationControls?: boolean;
  navigationControlPosition?: ControlPosition;
  initialViewport?: Partial<MapViewport>;
  fitTerritoryBounds?: boolean;
  territoryPolygons?: TerritoryPolygon[];
  mapHeightClassName?: string;
}

export default function TerritoryMapPreview({
  resolved,
  mapHref,
  territoryName,
  title = `Mapa de ${territoryName}`,
  markers = [],
  featuredResult,
  onMarkerClick,
  showNavigationControls = false,
  navigationControlPosition = "bottom-right",
  initialViewport,
  fitTerritoryBounds,
  territoryPolygons = [],
  mapHeightClassName = "h-[22.75rem]",
}: TerritoryMapPreviewProps) {
  const { polygons: resolvedPolygons } = useTerritoryPolygon(resolved);
  const polygons = [...resolvedPolygons, ...territoryPolygons];

  return (
    <section
      className="overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-surface"
      aria-labelledby="explore-map-title"
    >
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-territory-border px-4">
        <p
          id="explore-map-title"
          className="min-w-0 truncate font-heading text-base font-bold text-territory-ink"
        >
          {title}
        </p>
        <Link
          to={mapHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-territory-brand hover:bg-territory-raised"
        >
          Ampliar
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className={cn("relative overflow-hidden bg-territory-raised", mapHeightClassName)}>
        <MapLibreAdapter
          styleUrl={DEFAULT_TILE_STYLE.styleUrl}
          territoryPolygons={polygons}
          markers={markers}
          onMarkerClick={onMarkerClick}
          resolved={resolved}
          initialViewport={initialViewport}
          fitTerritoryBounds={fitTerritoryBounds ?? Boolean(resolved)}
          territoryFitPadding={28}
          territoryFitMaxZoom={14}
          interactive={showNavigationControls}
          hideNavigationControl={!showNavigationControls}
          navigationControlPosition={navigationControlPosition}
          controls={{}}
          className="h-full w-full"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--territory-surface)/0.5),transparent_45%)]" />
        {featuredResult ? (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-territory-border bg-territory-surface/95 p-3 shadow-territory-highlight backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {featuredResult.imageUrl ? (
                <img
                  src={featuredResult.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-territory-raised text-territory-brand">
                  <Map className="h-6 w-6" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-territory-ink">
                  {featuredResult.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-territory-muted">
                  {featuredResult.subtitle}
                </p>
              </div>
              <Link
                to={featuredResult.href}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-territory-brand hover:text-territory-brand-strong"
              >
                {featuredResult.actionLabel ?? "Ver resultado"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
      {featuredResult ? null : (
        <Link
          to={mapHref}
          className="flex min-h-12 items-center justify-between gap-3 px-4 text-sm font-semibold text-territory-ink hover:bg-territory-raised"
        >
          <span className="inline-flex items-center gap-2">
            <Map className="h-5 w-5 text-territory-brand" aria-hidden="true" />
            Explorar no mapa
          </span>
          <ArrowRight className="h-4 w-4 text-territory-brand" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
