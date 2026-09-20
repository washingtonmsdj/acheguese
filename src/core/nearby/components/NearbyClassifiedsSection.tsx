import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useTerritoryLabels } from "@/core/location";
import { useModuleUrls } from "@/core/routing/hooks/useModuleUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { classifiedUrlService } from "@/core/classifieds/services";
import {
  useClassificados,
  type ClassificadoWithVendedor,
} from "@/core/classifieds/hooks";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { NearbySection } from "./NearbySection";

interface NearbyClassifiedsSectionProps {
  limit?: number;
  resolved?: ResolvedTerritory | null;
}

export function NearbyClassifiedsSection({
  limit = 6,
  resolved = null,
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
    const territoryName = territoryLabels.name.trim().toLowerCase();
    if (!territoryName) return active.slice(0, limit);

    const sameNeighborhood = active.filter((classified) =>
      classified.bairro?.trim().toLowerCase().includes(territoryName),
    );
    const remaining = active.filter(
      (classified) => !sameNeighborhood.some((selected) => selected.id === classified.id),
    );

    return [...sameNeighborhood, ...remaining].slice(0, limit);
  }, [classificados, limit, territoryLabels.name]);

  const handleAdClick = (ad: ClassificadoWithVendedor) => {
    const publicUrl = classifiedUrlService.buildPublicUrl(ad);
    if (publicUrl) {
      navigate(publicUrl);
    }
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
                    {formatBrlNoCents(ad.preco)}
                  </p>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>
    </NearbySection>
  );
}
