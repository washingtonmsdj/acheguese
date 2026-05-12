import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useTerritoryLabels } from "@/core/location";
import { useModuleUrls } from "@/core/routing/hooks/useModuleUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  classifiedUrlService,
  useClassificados,
  type ClassificadoWithVendedor,
} from "@/shared/services/classifieds";
import { NearbySection } from "./NearbySection";

interface NearbyClassifiedsSectionProps {
  userLocation?: { latitude: number; longitude: number } | null;
  radiusKm?: number;
  limit?: number;
  resolved?: ResolvedTerritory | null;
  onShowInMap?: (ad: ClassificadoWithVendedor) => void;
}

export function NearbyClassifiedsSection({
  userLocation,
  limit = 6,
  resolved = null,
  onShowInMap,
}: NearbyClassifiedsSectionProps) {
  const navigate = useNavigate();
  const moduleUrls = useModuleUrls();
  const territoryLabels = useTerritoryLabels(resolved);
  const { classificados, isLoading } = useClassificados({
    filters: { sortBy: "recente" },
    routeResolved: resolved,
  });

  const nearbyClassifieds = useMemo(() => {
    const active = classificados.filter((classified) => classified.status === "active");
    if (!userLocation) return active.slice(0, limit);

    const territoryName = territoryLabels.name.trim().toLowerCase();
    if (!territoryName) return active.slice(0, limit);

    const sameNeighborhood = active.filter((classified) =>
      classified.bairro?.trim().toLowerCase().includes(territoryName),
    );
    const remaining = active.filter(
      (classified) => !sameNeighborhood.some((selected) => selected.id === classified.id),
    );

    return [...sameNeighborhood, ...remaining].slice(0, limit);
  }, [classificados, limit, territoryLabels.name, userLocation]);

  const handleAdClick = (ad: ClassificadoWithVendedor) => {
    if (ad.geographic_path && ad.category_slug && ad.subcategory_slug && ad.slug && ad.public_id) {
      const urls = classifiedUrlService.buildUrls({
        id: ad.id,
        public_id: ad.public_id,
        geographic_path: ad.geographic_path,
        category_slug: ad.category_slug,
        subcategory_slug: ad.subcategory_slug,
        slug: ad.slug,
      });
      navigate(urls.canonical);
      return;
    }

    navigate(classifiedUrlService.buildShortUrl(ad.public_id || ad.id));
  };

  return (
    <NearbySection
      title={`Classificados ${territoryLabels.inTerritory}`}
      subtitle="Produtos e servicos a venda na sua regiao"
      icon={ShoppingBag}
      iconColorClass="bg-amber-500/10 text-amber-500"
      count={nearbyClassifieds.length}
      isEmpty={nearbyClassifieds.length === 0}
      isLoading={isLoading}
      onSeeAll={nearbyClassifieds.length > 0 ? () => navigate(moduleUrls.classifieds) : undefined}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {nearbyClassifieds.map((ad) => (
          <div
            key={ad.id}
            className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
          >
            <button
              type="button"
              className="block w-full text-left"
              onClick={() => handleAdClick(ad)}
              aria-label={`Ver anuncio: ${ad.titulo}`}
            >
              <div className="relative overflow-hidden aspect-square">
                <img
                  src={ad.fotos?.[0] || "/placeholder.svg"}
                  alt={ad.titulo}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-2">
                <h3 className="text-[11px] font-semibold leading-tight line-clamp-2 text-foreground">
                  {ad.titulo}
                </h3>
                {ad.preco != null && (
                  <p className="text-xs font-bold text-primary mt-1">
                    R$ {ad.preco.toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            </button>
            {onShowInMap && (
              <div className="px-2 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs"
                  onClick={() => onShowInMap(ad)}
                >
                  Ver no mapa
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </NearbySection>
  );
}
