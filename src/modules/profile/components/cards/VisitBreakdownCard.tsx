/**
 * VisitBreakdownCard - Card de breakdown de visitas
 * 
 * SSOT: Componente reutilizável para breakdown de visitas
 * Sem gambiarras: Props tipadas e validadas
 */

import { cn } from "@/shared/utils/cn";

export interface VisitBreakdownCardProps {
  readonly label: string;
  readonly value: number;
  readonly percentage: number;
  readonly color: string;
}

export function VisitBreakdownCard({
  label,
  value,
  percentage,
  color,
}: VisitBreakdownCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value.toLocaleString('pt-BR')}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{percentage}% do total</p>
    </div>
  );
}
