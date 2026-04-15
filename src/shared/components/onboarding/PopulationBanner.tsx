import React from "react";
import { Users } from "lucide-react";

interface PopulationBannerProps {
  populationTotal: number;
}

export function PopulationBanner({ populationTotal }: PopulationBannerProps) {
  return (
    <div className="mx-4 bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <Users className="h-5 w-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">
            ~{populationTotal.toLocaleString("pt-BR")} habitantes
          </p>
          <p className="text-[11px] text-muted-foreground">
            4 neighborhoods interligados • Região RA VII - Rio Vermelho
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        O Complexo do Nordeste de Amaralina é formado por 4 neighborhoods
        vizinhos com forte identidade cultural, gastronomia baiana e comércio
        local vibrante. População predominantemente parda (49%) e preta (39%).
      </p>
    </div>
  );
}
