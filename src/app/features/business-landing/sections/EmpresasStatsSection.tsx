/**
 * EmpresasStatsSection
 * 
 * Seção de estatísticas
 */

import type { EmpresasStatsSectionProps } from "./types";

export function EmpresasStatsSection({ stats }: EmpresasStatsSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
