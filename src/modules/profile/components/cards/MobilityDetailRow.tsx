/**
 * MobilityDetailRow - Linha de detalhe de mobilidade
 * 
 * SSOT: Componente reutilizável para detalhes de mobilidade
 * Sem gambiarras: Props tipadas e validadas
 */

export interface MobilityDetailRowProps {
  readonly label: string;
  readonly value: string;
}

export function MobilityDetailRow({ label, value }: MobilityDetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
