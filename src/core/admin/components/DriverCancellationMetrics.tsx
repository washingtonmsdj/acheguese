import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Ban, Clock, Shield, TrendingDown, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

import { adminMobilityService } from "@/core/admin";
import {
  AdminDriverModerationService,
  type DriverModerationRow,
} from "@/core/admin/services/AdminDriverModerationService";
import { adminMobilityRuntimeService } from "@/core/admin/services/AdminMobilityRuntimeService";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ptBR } from "@/shared/utils/dateLocale";
import { logger } from "@/shared/utils/logger";

interface DriverCancellationData {
  id: string;
  name: string;
  avatar_url?: string;
  assignedRideCount: number;
  driverCancelledRideCount: number;
  driverCancellationRate: number;
  suspensionCount: number;
  moderation?: DriverModerationRow;
}

export function DriverCancellationMetrics() {
  const [drivers, setDrivers] = useState<DriverCancellationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDriversData();
  }, []);

  async function loadDriversData() {
    setLoading(true);
    try {
      const driversData = await adminMobilityService.getDriversWithStats();
      const profileIds = driversData.map((driver) => driver.profile_id);
      const moderationByProfile = await AdminDriverModerationService.getModerationRows(profileIds);

      const rows = driversData.map((driver) => ({
        id: driver.profile_id,
        name: driver.name,
        avatar_url: driver.avatar_url,
        assignedRideCount: driver.assigned_ride_count,
        driverCancelledRideCount: driver.driver_cancelled_ride_count,
        driverCancellationRate: driver.driver_cancellation_rate,
        suspensionCount: driver.suspension_count,
        moderation: moderationByProfile.get(driver.profile_id),
      }));

      rows.sort((left, right) => right.driverCancellationRate - left.driverCancellationRate);
      setDrivers(rows);
    } catch (error) {
      logger.error("DriverCancellationMetrics.loadDriversData", error as Error);
      toast.error("Erro ao carregar dados dos motoristas");
    } finally {
      setLoading(false);
    }
  }

  async function removeSuspension(driverProfileId: string) {
    try {
      await AdminUserService.unsuspendProfile(driverProfileId);
      await adminMobilityRuntimeService.createDriverModerationEvent({
        driverProfileId,
        action: "reactivated",
        reason: "Suspensao removida pelo administrador no painel de cancelamentos",
      });

      toast.success("Suspensão removida com sucesso");
      await loadDriversData();
    } catch (error) {
      logger.error("DriverCancellationMetrics.removeSuspension", error as Error, {
        driverProfileId,
      });
      toast.error("Erro ao remover suspensão");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const suspendedDrivers = drivers.filter((driver) => driver.moderation?.is_suspended === true);
  const totalAssignedRides = drivers.reduce(
    (sum, driver) => sum + driver.assignedRideCount,
    0,
  );
  const totalDriverCancellations = drivers.reduce(
    (sum, driver) => sum + driver.driverCancelledRideCount,
    0,
  );
  const overallDriverCancellationRate = totalAssignedRides > 0
    ? (totalDriverCancellations / totalAssignedRides) * 100
    : 0;
  const totalSuspensionEvents = drivers.reduce(
    (sum, driver) => sum + driver.suspensionCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa atribuível ao motorista</span>
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {overallDriverCancellationRate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Canceladas pelo motorista / corridas atribuídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suspensos agora</span>
              <Ban className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">
              {suspendedDrivers.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estado atual de moderação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cancelamentos do motorista</span>
              <XCircle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {totalDriverCancellations}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Somente status cancelled_by_driver
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suspensões registradas</span>
              <Shield className="h-4 w-4 text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-violet-500">
              {totalSuspensionEvents}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Eventos históricos de moderação
            </p>
          </CardContent>
        </Card>
      </div>

      {suspendedDrivers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-4 w-4 text-red-500" />
              Motoristas suspensos ({suspendedDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspendedDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-950 dark:bg-red-950/20"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(driver.name || "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{driver.name}</p>
                      <Badge variant="destructive" className="text-[0.65rem]">
                        Suspenso
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {driver.moderation?.suspension_reason || "Motivo não informado"}
                    </p>
                    {driver.moderation?.suspended_until ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <Clock className="h-3 w-3" />
                        Expira{" "}
                        {formatDistanceToNow(new Date(driver.moderation.suspended_until), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {driver.driverCancellationRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.driverCancelledRideCount}/{driver.assignedRideCount} atribuídas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.suspensionCount} suspensões registradas
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void removeSuspension(driver.id)}
                    className="text-xs"
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-teal-500" />
            Cancelamentos atribuíveis por motorista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Ordenação informativa. Nenhum percentual nesta tela aplica suspensão automática.
          </p>
          <div className="space-y-2">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={driver.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(driver.name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{driver.name}</p>
                    {driver.moderation?.is_suspended ? (
                      <Badge variant="destructive" className="text-[0.65rem]">
                        Suspenso
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {driver.driverCancelledRideCount} canceladas pelo motorista de{" "}
                    {driver.assignedRideCount} corridas atribuídas
                  </p>
                </div>

                <Badge variant="outline" className="font-semibold">
                  {driver.driverCancellationRate.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
