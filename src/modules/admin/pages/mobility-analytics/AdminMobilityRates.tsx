import { CheckCircle, Percent, XCircle } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import type { MobilidadeStats } from "./AdminMobilityAnalytics.types";

export function AdminMobilityRates({ stats }: { stats: MobilidadeStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Percent className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Taxa de Conclusão</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {stats.completionRate}%
          </p>
          <Progress value={stats.completionRate} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.completedRides} de {stats.resolvedRides} corridas resolvidas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Taxa de Verificação</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {stats.verificationRate}%
          </p>
          <Progress value={stats.verificationRate} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.verifiedDrivers} de {stats.totalDrivers} motoristas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Taxa de Cancelamento</span>
          </div>
          <p className="text-3xl font-bold text-destructive">
            {stats.cancellationRate}%
          </p>
          <Progress value={stats.cancellationRate} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.cancelledRides} de {stats.resolvedRides} corridas resolvidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
