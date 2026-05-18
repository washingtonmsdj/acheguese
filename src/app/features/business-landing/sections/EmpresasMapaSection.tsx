/**
 * EmpresasMapaSection
 * 
 * Seção de mapa interativo com empresas
 */

import { MapIcon, ExternalLink } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { EmpresasMapaSectionProps } from "./types";

export function EmpresasMapaSection({
  territoryLabels,
  businesses,
  territoryPolygons,
  resolved,
  isLoadingBounds,
  filteredCount,
  moduleUrls,
  navigate,
}: EmpresasMapaSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              {territoryLabels.mapLabel}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Empresas perto de você · clique para ver detalhes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/mapa")}
          className="border-border text-muted-foreground hover:border-primary hover:text-primary text-xs rounded-lg gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Mapa completo
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-96 md:h-[500px]">
          <MapLibreAdapter
            styleUrl={DEFAULT_TILE_STYLE.styleUrl}
            territoryPolygons={[...territoryPolygons] as any}
            resolved={resolved}
            enableClustering={true}
            markers={businesses
              .filter(b => b.coords.lat && b.coords.lng)
              .map(b => ({
                id: b.id,
                type: 'business' as const,
                coordinates: { latitude: b.coords.lat, longitude: b.coords.lng },
                title: b.name,
                status: b.isOpen ? 'active' : 'inactive',
                metadata: { category: b.category, rating: b.rating },
              }))}
            onMarkerClick={(id) => {
              const biz = businesses.find(b => b.id === id);
              if (biz?.slug) navigate(`${moduleUrls.business}/${biz.slug}`);
            }}
            controls={{
              search: {
                type: 'entity-filter',
                position: 'top-left',
                placeholder: 'Buscar empresas...',
              },
              location: {
                enabled: true,
                position: 'top-right',
                showAccuracy: true,
                autoFlyTo: true,
              },
            }}
            userLocationMarker={{ enabled: true, autoAdd: true }}
            className="w-full h-full"
          />
        </div>

        {/* Map bottom bar */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCount}</span> empresas no mapa
            {isLoadingBounds && <span className="ml-2 text-primary">· Carregando limites do bairro...</span>}
            {territoryPolygons.length > 1 && (
              <span className="ml-2 flex items-center gap-1.5 flex-wrap">
                {territoryPolygons.map(p => (
                  <span key={p.name} className="flex items-center gap-1">
                    <span style={{ background: p.color }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                    <span>{p.name}</span>
                  </span>
                ))}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
