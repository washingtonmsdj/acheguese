import { Info } from "lucide-react";
import { TopBusinessCard } from "../components/cards";
import type { EmpresasRecomendacoesSectionProps } from "./types";

export function EmpresasRecomendacoesSection({
  highlights,
  savedBusinesses,
  onToggleSave,
  onOpenBusiness,
}: EmpresasRecomendacoesSectionProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Destaques do bairro</h2>
        <Info className="h-4 w-4 text-white/35" aria-hidden="true" />
      </div>

      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid auto-cols-[88vw] grid-flow-col gap-3 sm:auto-cols-[26rem] xl:grid-cols-3 xl:grid-flow-row xl:auto-cols-auto">
        {highlights.map((highlight) => (
          <TopBusinessCard
            key={`${highlight.label}-${highlight.business.id}`}
            highlight={highlight}
            onClick={() => onOpenBusiness(highlight.business)}
            onToggleSave={onToggleSave}
            isSaved={savedBusinesses.has(highlight.business.business_data_id ?? "")}
          />
        ))}
        </div>
      </div>
    </section>
  );
}
