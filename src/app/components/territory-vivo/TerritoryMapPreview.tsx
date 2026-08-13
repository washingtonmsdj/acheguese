import { ArrowUpRight, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface TerritoryMapPreviewProps {
  resolved: ResolvedTerritory | null;
  mapHref: string;
  territoryName: string;
}

export default function TerritoryMapPreview({
  resolved,
  mapHref,
  territoryName,
}: TerritoryMapPreviewProps) {
  const { polygons } = useTerritoryPolygon(resolved);

  return (
    <section
      className="overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-surface"
      aria-labelledby="explore-map-title"
    >
      <div
        className="relative h-56 overflow-hidden bg-territory-raised"
        aria-hidden="true"
      >
        <MapLibreAdapter
          styleUrl={DEFAULT_TILE_STYLE.styleUrl}
          territoryPolygons={polygons}
          resolved={resolved}
          fitTerritoryBounds={Boolean(resolved)}
          territoryFitPadding={28}
          territoryFitMaxZoom={14}
          interactive={false}
          hideNavigationControl
          controls={{}}
          className="h-full w-full"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--territory-surface)/0.5),transparent_45%)]" />
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p
            id="explore-map-title"
            className="flex items-center gap-2 font-heading font-semibold text-territory-ink"
          >
            <Map className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            Mapa de {territoryName}
          </p>
          <p className="mt-1 text-xs leading-5 text-territory-muted">
            Abra a experiência completa para ver camadas e pontos ativos.
          </p>
        </div>
        <Link
          to={mapHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
          aria-label={`Abrir mapa completo de ${territoryName}`}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
