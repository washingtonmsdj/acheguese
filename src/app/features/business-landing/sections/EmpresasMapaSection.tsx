/**
 * EmpresasMapaSection
 *
 * Secao de mapa interativo com empresas.
 */

import { ExternalLink, MapIcon } from "lucide-react";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { Button } from "@/shared/components/ui/button";
import type { EmpresasMapaSectionProps } from "./types";

export function EmpresasMapaSection({
  territoryLabels,
  businesses,
  territoryPolygons,
  resolved,
  isLoadingBounds,
  filteredCount,
  moduleUrls,
  getBusinessUrl,
  navigate,
}: EmpresasMapaSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
              {territoryLabels.mapLabel}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Empresas perto de voce - clique para ver detalhes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/mapa")}
          className="gap-1.5 rounded-lg border-border text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Mapa completo
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative h-96 md:h-[500px]">
          <MapLibreAdapter
            styleUrl={DEFAULT_TILE_STYLE.styleUrl}
            territoryPolygons={[...territoryPolygons]}
            resolved={resolved}
            enableClustering
            markers={businesses
              .filter((business) => business.coords.lat && business.coords.lng)
              .map((business) => ({
                id: business.id,
                type: "business" as const,
                coordinates: {
                  latitude: business.coords.lat,
                  longitude: business.coords.lng,
                },
                title: business.name,
                status: business.isOpen ? "active" : "inactive",
                metadata: { category: business.category, rating: business.rating },
              }))}
            onMarkerClick={(id) => {
              const business = businesses.find((entry) => entry.id === id);
              if (business?.slug) {
                navigate(getBusinessUrl(business, moduleUrls.business));
              }
            }}
            controls={{
              search: {
                type: "entity-filter",
                position: "top-left",
                placeholder: "Buscar empresas...",
              },
              location: {
                enabled: true,
                position: "top-right",
                showAccuracy: true,
                autoFlyTo: true,
              },
            }}
            userLocationMarker={{ enabled: true, autoAdd: true }}
            className="h-full w-full"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCount}</span> empresas no mapa
            {isLoadingBounds ? (
              <span className="ml-2 text-primary">- Carregando limites do bairro...</span>
            ) : null}
            {territoryPolygons.length > 1 ? (
              <span className="ml-2 flex flex-wrap items-center gap-1.5">
                {territoryPolygons.map((polygon) => (
                  <span key={polygon.name} className="flex items-center gap-1">
                    <span
                      style={{ background: polygon.color }}
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                    />
                    <span>{polygon.name}</span>
                  </span>
                ))}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
