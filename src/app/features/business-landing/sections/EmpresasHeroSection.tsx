/**
 * EmpresasHeroSection
 * 
 * Hero com carrossel de banners e busca
 */

import { ChevronRight, Plus, Store } from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import type { EmpresasHeroSectionProps } from "./types";

export function EmpresasHeroSection({
  territoryName,
  territoryNameShort,
  territoryPreposition,
  currentBannerIndex,
  bannerImages,
  onPrevBanner,
  onNextBanner,
  onBannerSelect,
  navigate,
}: EmpresasHeroSectionProps) {
  const activeBannerImage = bannerImages.at(currentBannerIndex) ?? bannerImages[0] ?? "";

  return (
    <div className="relative group">
      <CanonicalHero
        moduleName="Empresas"
        moduleIcon={Store}
        territoryName={territoryName}
        territoryFallback="Sua Região"
        title={`Empresas ${territoryPreposition}`}
        titleHighlight={territoryNameShort}
        subtitle="Descubra, avalie e recomende negócios perto de você. Veja o que seus vizinhos estão indicando."
        backgroundImage={activeBannerImage}
        primaryCTA={{ 
          label: "Cadastrar Empresa", 
          icon: Plus,
          onClick: () => navigate("/empresas/criar-empresa")
        }}
      />
      
      {/* Setas de navegação */}
      <button
        onClick={onPrevBanner}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-110"
        aria-label="Banner anterior"
      >
        <ChevronRight className="h-5 w-5 rotate-180 text-foreground" />
      </button>
      
      <button
        onClick={onNextBanner}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-110"
        aria-label="Próximo banner"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>
      
      {/* Indicadores do carrossel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => onBannerSelect(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentBannerIndex 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
