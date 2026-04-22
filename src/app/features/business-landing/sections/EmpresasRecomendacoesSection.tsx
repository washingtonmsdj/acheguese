/**
 * EmpresasRecomendacoesSection
 * 
 * Seção de empresas mais recomendadas
 */

import { Flame } from "lucide-react";
import { TopBusinessCard } from "../components/cards";
import type { EmpresasRecomendacoesSectionProps } from "./types";

export function EmpresasRecomendacoesSection({
  topBusinesses,
  moduleUrls,
  getBusinessUrl,
  navigate,
}: EmpresasRecomendacoesSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
      <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 rounded-2xl p-5 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary/20 p-2.5 rounded-xl">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-heading">Mais Recomendados pelos Vizinhos</h3>
            <p className="text-sm text-muted-foreground">As empresas com mais indicações da comunidade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topBusinesses.map((biz, i) => (
            <TopBusinessCard
              key={biz.id}
              business={biz}
              rank={i + 1}
              onClick={() => navigate(getBusinessUrl(biz, moduleUrls.business))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
