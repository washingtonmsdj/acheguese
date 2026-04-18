/**
 * EmpresasListaSection
 * 
 * Seção de lista de empresas com filtros e modo "perto de mim"
 */

import { Navigation, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { NearbyToggle } from "@/core/geospatial/components/NearbyToggle";
import { BusinessCard } from "../components/cards";
import type { EmpresasListaSectionProps } from "./types";

export function EmpresasListaSection({
  businesses,
  nearbyMode,
  onToggleNearbyMode,
  savedBusinesses,
  onToggleSave,
  businessUrls,
  moduleUrls,
  getBusinessUrl,
  navigate,
}: EmpresasListaSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" /> Perto de Você
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {nearbyMode ? 'Ordenado por distância' : 'Empresas do bairro'} · {businesses.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NearbyToggle
            active={nearbyMode}
            onToggle={onToggleNearbyMode}
            activeText="Perto de mim ✓"
            inactiveText="Perto de mim"
          />
          <Button
            variant="outline"
            onClick={() => navigate(businessUrls.list)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-lg hidden sm:flex"
          >
            Ver todas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businesses.map((biz, i) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            onClick={() => navigate(getBusinessUrl(biz, moduleUrls.business))}
            onToggleSave={onToggleSave}
            isSaved={savedBusinesses.has(biz.id)}
            nearbyMode={nearbyMode}
            index={i}
          />
        ))}
      </div>

      {businesses.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">Nenhuma empresa encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Tente mudar os filtros ou a busca</p>
        </div>
      )}

      <div className="mt-4 sm:hidden">
        <Button
          variant="outline"
          onClick={() => navigate(businessUrls.list)}
          className="w-full border-border text-muted-foreground font-medium text-sm rounded-lg"
        >
          Ver todas as empresas
        </Button>
      </div>
    </section>
  );
}
