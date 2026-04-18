/**
 * EmpresasAtividadeSection
 * 
 * Seção de atividade dos vizinhos (feed)
 */

import { Users } from "lucide-react";
import { NeighborActivityCard } from "../components/cards";
import type { EmpresasAtividadeSectionProps } from "./types";

export function EmpresasAtividadeSection({ activities }: EmpresasAtividadeSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground font-heading">Atividade dos Vizinhos</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {activities.map((item, i) => (
          <NeighborActivityCard key={i} activity={item} index={i} />
        ))}
      </div>
    </section>
  );
}
