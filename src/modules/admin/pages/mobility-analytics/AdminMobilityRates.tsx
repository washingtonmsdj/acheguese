import { CheckCircle, Percent, XCircle } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import type { MobilidadeStats } from "./AdminMobilityAnalytics.types";

export function AdminMobilityRates({ stats }: { stats: MobilidadeStats }) {
  const cancellationRate =
    stats.totalRides > 0 ? Math.round((stats.cancelledRides / stats.totalRides) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Taxa de Conclusão</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {stats.completionRate}%
          </p>
          <Progress value={stats.completionRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completedRides} de {stats.totalRides} corridas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Taxa de Aprovação</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {stats.approvalRate}%
          </p>
          <Progress value={stats.approvalRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.verifiedDrivers} de {stats.totalDrivers} motoristas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Taxa de Cancelamento</span>
          </div>
          <p className="text-3xl font-bold text-destructive">{cancellationRate}%</p>
          <Progress value={cancellationRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.cancelledRides} canceladas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
