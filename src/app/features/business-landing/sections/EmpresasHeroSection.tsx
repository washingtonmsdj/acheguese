import { Link } from "react-router-dom";
import { MapPin, MapPinned } from "lucide-react";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { EmpresasHeroSectionProps } from "./types";

export function EmpresasHeroSection({
  territoryName, businesses, territoryPolygons, resolved, isLoadingBounds,
  stats, primaryHref, primaryLabel, secondaryHref, secondaryLabel, mapHref,
  onOpenLocationDialog, onOpenBusiness,
}: EmpresasHeroSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onOpenLocationDialog}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-4 text-sm text-territory-muted hover:bg-territory-raised">
          <MapPin className="h-4 w-4 shrink-0" />{territoryName}
        </button>
        <Link to={mapHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-territory-brand px-5 text-sm font-semibold text-territory-brand hover:bg-territory-raised">
          <MapPinned className="h-5 w-5" />Ver no mapa
        </Link>
      </div>
      <details className="mt-4 rounded-xl border border-territory-border bg-territory-surface">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-territory-muted">Informações do território e outras opções</summary>
        <div className="grid gap-4 border-t border-territory-border p-4 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => <div key={stat.label} className="rounded-xl bg-territory-raised p-3">
                <p className="text-xl font-semibold text-territory-ink">{stat.value}</p>
                <p className="text-sm text-territory-muted">{stat.label}</p>
              </div>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to={primaryHref} className="inline-flex min-h-11 items-center rounded-xl bg-territory-sun px-4 text-sm font-semibold text-territory-ink">{primaryLabel}</Link>
              <Link to={secondaryHref} className="inline-flex min-h-11 items-center rounded-xl border border-territory-border px-4 text-sm font-semibold">{secondaryLabel}</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-territory-border">
            <p className="px-4 py-2 text-sm text-territory-muted">{isLoadingBounds ? "Carregando limites…" : "Mapa das empresas"}</p>
            <div className="h-56">
              <MapLibreAdapter
                styleUrl={DEFAULT_TILE_STYLE.styleUrl}
                territoryPolygons={[...territoryPolygons]}
                resolved={resolved}
                enableClustering
                markers={businesses
                  .filter((business) => business.coords.lat && business.coords.lng)
                  .slice(0, 24)
                  .map((business) => ({
                    id: business.id,
                    type: "business" as const,
                    coordinates: {
                      latitude: business.coords.lat,
                      longitude: business.coords.lng,
                    },
                    title: business.name,
                    status: business.isOpen ? "active" : "inactive",
                    metadata: {
                      category: business.category,
                      rating: business.rating,
                    },
                  }))}
                onMarkerClick={(id) => {
                  const business = businesses.find((item) => item.id === id);
                  if (business) {
                    onOpenBusiness(business);
                  }
                }}
                controls={{
                  location: {
                    enabled: true,
                    position: "top-right",
                    showAccuracy: true,
                    autoFlyTo: false,
                  },
                }}
                markerPresentation="compact"
                fitTerritoryBounds
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
