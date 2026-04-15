interface AlertsStatsProps {
  totalAlerts: number;
  activeAlerts: number;
  pendingReports: number;
  bannedUsers: number;
}

export function AlertsStats({
  totalAlerts,
  activeAlerts,
  pendingReports,
  bannedUsers,
}: AlertsStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div className="bg-card rounded-xl border p-3 text-center">
        <p className="text-2xl font-bold text-foreground">{totalAlerts}</p>
        <p className="text-xs text-muted-foreground">Total de Alertas</p>
      </div>
      <div className="bg-card rounded-xl border p-3 text-center">
        <p className="text-2xl font-bold text-success">{activeAlerts}</p>
        <p className="text-xs text-muted-foreground">Ativos</p>
      </div>
      <div className="bg-card rounded-xl border p-3 text-center">
        <p className="text-2xl font-bold text-destructive">{pendingReports}</p>
        <p className="text-xs text-muted-foreground">Denúncias Pendentes</p>
      </div>
      <div className="bg-card rounded-xl border p-3 text-center">
        <p className="text-2xl font-bold text-warning">{bannedUsers}</p>
        <p className="text-xs text-muted-foreground">Usuários Banidos</p>
      </div>
    </div>
  );
}
