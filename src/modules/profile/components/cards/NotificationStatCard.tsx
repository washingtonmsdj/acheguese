/**
 * NotificationStatCard - Card de estatística de notificação
 * 
 * SSOT: Componente reutilizável para stats de notificações
 * Sem gambiarras: Props tipadas e validadas
 */

export interface NotificationStatCardProps {
  readonly label: string;
  readonly value: number;
}

export function NotificationStatCard({ label, value }: NotificationStatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
