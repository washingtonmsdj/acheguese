import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";

interface Props {
  businessId: string;
}

export default function EmpresaDashboardTab({ businessId: _businessId }: Props) {
  const showAnalytics = isLaunchSurfaceEnabled("publicAnalytics");
  const metricsGridClass = showAnalytics ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className="space-y-6">
      {/* Placeholder para metricas futuras */}
      <div className={`grid gap-4 ${metricsGridClass}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>

        {showAnalytics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analises</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
