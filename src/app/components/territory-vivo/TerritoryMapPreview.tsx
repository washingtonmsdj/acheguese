import { ArrowRight, ArrowUpRight, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { MapMarker } from "@/core/maps/types/core";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { cn } from "@/shared/utils/cn";

interface TerritoryMapPreviewProps {
  resolved: ResolvedTerritory | null;
  mapHref: string;
  territoryName: string;
  title?: string;
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
  showNavigationControls?: boolean;
  mapHeightClassName?: string;
}

export default function TerritoryMapPreview({
  resolved,
  mapHref,
  territoryName,
  title = `Mapa de ${territoryName}`,
  markers = [],
  onMarkerClick,
  showNavigationControls = false,
  mapHeightClassName = "h-[22.75rem]",
}: TerritoryMapPreviewProps) {
  const { polygons } = useTerritoryPolygon(resolved);

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
          fitTerritoryBounds={Boolean(resolved)}
          territoryFitPadding={28}
          territoryFitMaxZoom={14}
          interactive={showNavigationControls}
          hideNavigationControl={!showNavigationControls}
          controls={{}}
          className="h-full w-full"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--territory-surface)/0.5),transparent_45%)]" />
      </div>
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
    </section>
  );
}
