/**
 * MobilityMetricCard - Card de métrica de mobilidade
 * 
 * SSOT: Componente reutilizável para métricas de mobilidade
 * Sem gambiarras: Props tipadas e validadas
 */

export interface MobilityMetricCardProps {
  readonly label: string;
  readonly value: string;
}

export function MobilityMetricCard({ label, value }: MobilityMetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
