import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { VagaStats } from "@/core/admin/services/AdminVagasService";

type AdminVagasAnalyticsProps = {
  stats?: VagaStats;
};

export function AdminVagasAnalytics({ stats }: AdminVagasAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status operacional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Publicadas</span><strong>{stats?.published ?? 0}</strong></div>
          <div className="flex justify-between"><span>Pausadas</span><strong>{stats?.paused ?? 0}</strong></div>
          <div className="flex justify-between"><span>Expiradas</span><strong>{stats?.expired ?? 0}</strong></div>
          <div className="flex justify-between"><span>Removidas</span><strong>{stats?.removed ?? 0}</strong></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contratos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(Object.entries(stats?.byContrato ?? {}) as [string, number][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          {Object.keys(stats?.byContrato ?? {}).length === 0 && (
            <p className="text-muted-foreground">Sem dados de contrato</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modalidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(Object.entries(stats?.byModalidade ?? {}) as [string, number][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          {Object.keys(stats?.byModalidade ?? {}).length === 0 && (
            <p className="text-muted-foreground">Sem dados de modalidade</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
