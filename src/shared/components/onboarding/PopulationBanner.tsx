import React from "react";
import { Users } from "lucide-react";

interface PopulationBannerProps {
  populationTotal: number;
  neighborhoodsCount: number;
  cityName: string;
  stateName: string;
}

export function PopulationBanner({
  populationTotal,
  neighborhoodsCount,
  cityName,
  stateName,
}: PopulationBannerProps) {
  const populationLabel = populationTotal
    ? `~${populationTotal.toLocaleString("pt-BR")} habitantes`
    : "População não informada";
  const neighborhoodsLabel = neighborhoodsCount
    ? `${neighborhoodsCount} bairros ativos`
    : "Bairros serão carregados quando houver dados ativos";

  return (
    <div className="mx-4 mb-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-3">
        <Users className="h-5 w-5 flex-shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{populationLabel}</p>
          <p className="text-[11px] text-muted-foreground">
            {cityName}, {stateName} · {neighborhoodsLabel}
          </p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Escolha seu bairro para ajustar a navegação local. Se a cidade ainda não tiver bairros cadastrados, você pode continuar pela visão municipal.
      </p>
    </div>
  );
}
