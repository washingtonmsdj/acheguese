/**
 * EmpresasBeneficiosSection
 * 
 * Seção "Por que cadastrar sua empresa?"
 */

import { BenefitCard } from "../components/cards";
import type { EmpresasBeneficiosSectionProps } from "./types";

export function EmpresasBeneficiosSection({ benefits }: EmpresasBeneficiosSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
      <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-1/3">
            <h3 className="text-lg font-bold text-foreground font-heading">Por que cadastrar sua empresa?</h3>
            <p className="text-sm text-muted-foreground mt-1">Cresça com a comunidade local</p>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {benefits.map((item) => (
              <BenefitCard key={item.title} benefit={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
