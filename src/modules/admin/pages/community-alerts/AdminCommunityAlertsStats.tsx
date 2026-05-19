import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { AlertStatsSummary } from "./AdminCommunityAlerts.types";

interface AdminCommunityAlertsStatsProps {
  stats?: Partial<AlertStatsSummary>;
}

export function AdminCommunityAlertsStats({ stats }: AdminCommunityAlertsStatsProps) {
  const cards = [
    { label: "Total de Alertas", value: stats?.total || 0, className: "", helper: null },
    { label: "Alertas Ativos", value: stats?.active || 0, className: "text-green-600", helper: null },
    { label: "Sob Revisao", value: stats?.underReview || 0, className: "text-orange-600", helper: null },
    {
      label: "Total de Reports",
      value: stats?.totalReports || 0,
      className: "text-red-600",
      helper: `Media: ${stats?.avgReportsPerAlert || 0} por alerta`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.className}`}>{card.value}</div>
            {card.helper && (
              <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
