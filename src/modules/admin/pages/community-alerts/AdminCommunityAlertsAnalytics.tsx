import { Filter, TrendingUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ALERT_CATEGORY_LABELS,
  type AlertCategory,
} from "@/shared/services/communityAlerts";
import type { AlertAdminItem } from "./AdminCommunityAlerts.types";

interface AdminCommunityAlertsAnalyticsProps {
  topReported?: AlertAdminItem[];
  categoryStats?: Partial<Record<AlertCategory, number>>;
}

export function AdminCommunityAlertsAnalytics({
  topReported,
  categoryStats,
}: AdminCommunityAlertsAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alertas Mais Reportados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topReported && topReported.length > 0 ? (
            <div className="space-y-3">
              {topReported.map((alert, index) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      #{index + 1} - {ALERT_CATEGORY_LABELS[alert.category as AlertCategory]}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {alert.neighborhood_display}
                    </p>
                  </div>
                  <Badge variant="destructive">{alert.report_count} reports</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              Nenhum alerta reportado
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Alertas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryStats && Object.keys(categoryStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(categoryStats)
                .sort(([, first], [, second]) => (second as number) - (first as number))
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <p className="text-sm">
                      {ALERT_CATEGORY_LABELS[category as AlertCategory]}
                    </p>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">Nenhum dado disponivel</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
