/**
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 *
 * DriverCancellationMetrics migrado para usar ProfileService como fonte única de verdade
 * Elimina regras manuais: is_verified, is_suspended
 * Score original: 132 (11 regras manuais)
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  AlertTriangle,
  Ban,
  TrendingDown,
  Users,
  XCircle,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles"; // ✅ MIGRADO - Usa ProfileService
import type { ProfileContext } from "@/core/profiles/services/types"; // ✅ MIGRADO - Tipos do ProfileService
import { adminMobilityService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminMobilityService do core

interface DriverData {
  profile_id: string;
  name: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  is_verified: boolean;
}

interface ProfileData {
  id: string;
  avatar_url: string;
  total_rides_accepted: number;
  total_rides_cancelled: number;
  cancellation_rate: number;
  is_suspended: boolean;
  suspension_reason?: string;
  suspended_until?: string;
  suspension_count: number;
}

interface DriverCancellationData {
  id: string;
  name: string;
  avatar_url?: string;
  total_rides_accepted: number;
  total_rides_cancelled: number;
  cancellation_rate: number;
  suspension_count: number;
  // ✅ MIGRADO - Removidas regras manuais, dados vêm do ProfileService
  profileContext?: ProfileContext; // Contexto completo do ProfileService
}

export function DriverCancellationMetrics() {
  const [drivers, setDrivers] = useState<DriverCancellationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriversData();
  }, []);

  async function loadDriversData() {
    try {
      // ✅ MIGRADO - Buscar motoristas usando AdminMobilityService (core)
      const driversData = await adminMobilityService.getDriversWithStats();

      // ✅ MIGRADO - Buscar contextos dos usuários usando ProfileService
      const driversWithContext = await Promise.all(
        driversData.map(async (driver) => {
          // Buscar contexto completo do usuário usando ProfileService
          const profileContext = await profileService.getProfileContext(
            driver.user_id,
          );

          return {
            id: driver.profile_id,
            name: driver.name,
            avatar_url: driver.avatar_url || "",
            total_rides_accepted: driver.total_rides_accepted,
            total_rides_cancelled: driver.total_rides_cancelled,
            cancellation_rate: driver.cancellation_rate,
            suspension_count: driver.suspension_count,
            profileContext, // ✅ MIGRADO - Contexto completo do ProfileService
          } as DriverCancellationData;
        }),
      );

      // Ordenar por taxa de cancelamento
      driversWithContext.sort(
        (a, b) => b.cancellation_rate - a.cancellation_rate,
      );

      setDrivers(driversWithContext);
    } catch (error) {
      logger.error("Error loading drivers:", error);
      toast.error("Erro ao carregar dados dos motoristas");
    } finally {
      setLoading(false);
    }
  }

  async function removeSuspension(driverProfileId: string) {
    try {
      // ✅ MIGRADO - Usa ProfileService para remover suspensão
      await profileService.unsuspendUser(driverProfileId);

      toast.success("Suspensão removida com sucesso");
      loadDriversData();
    } catch (error) {
      logger.error("Error removing suspension:", error);
      toast.error("Erro ao remover suspensão");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const suspendedDrivers = drivers.filter(
    (d) => d.profileContext?.status.isSuspended,
  );
  const highRiskDrivers = drivers.filter(
    (d) => !d.profileContext?.status.isSuspended && d.cancellation_rate > 25,
  );
  const avgCancellationRate =
    drivers.length > 0
      ? drivers.reduce((sum, d) => sum + d.cancellation_rate, 0) /
        drivers.length
      : 0;
  const totalCancellations = drivers.reduce(
    (sum, d) => sum + d.total_rides_cancelled,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa Média</span>
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {avgCancellationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cancelamento geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Suspensos</span>
              <Ban className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">
              {suspendedDrivers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Motoristas bloqueados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Alto Risco</span>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-500">
              {highRiskDrivers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Taxa {">"} 25%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Cancelamentos
              </span>
              <XCircle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {totalCancellations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Corridas canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suspended Drivers */}
      {suspendedDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              Motoristas Suspensos ({suspendedDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspendedDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(driver.name ?? '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {driver.name ?? 'Nome não informado'}
                      </p>
                      <Badge variant="destructive" className="text-[0.65rem]">
                        Suspenso
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {driver.profileContext?.status.suspensionReason}
                    </p>
                    {driver.profileContext?.status.suspendedUntil && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expira{" "}
                        {formatDistanceToNow(
                          new Date(driver.profileContext.status.suspendedUntil),
                          {
                            addSuffix: true,
                            locale: ptBR,
                          },
                        )}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">
                      {driver.cancellation_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.total_rides_cancelled}/
                      {driver.total_rides_accepted}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.suspension_count}ª suspensão
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeSuspension(driver.id)}
                    className="text-xs"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Risk Drivers */}
      {highRiskDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Motoristas em Risco ({highRiskDrivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskDrivers.slice(0, 10).map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(driver.name ?? '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {driver.name ?? 'Nome não informado'}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[0.65rem] border-yellow-500 text-yellow-700"
                      >
                        Atenção
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Próximo de suspensão (limite: 30%)
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-yellow-600 text-lg">
                      {driver.cancellation_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.total_rides_cancelled}/
                      {driver.total_rides_accepted}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Drivers - Sorted by Cancellation Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500" />
            Todos os Motoristas - Taxa de Cancelamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={driver.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {(driver.name ?? '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{driver.name ?? 'Nome não informado'}</p>
                  <p className="text-xs text-muted-foreground">
                    {driver.total_rides_cancelled} de{" "}
                    {driver.total_rides_accepted} corridas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      driver.cancellation_rate > 30 &&
                        "bg-red-100 text-red-700",
                      driver.cancellation_rate > 25 &&
                        driver.cancellation_rate <= 30 &&
                        "bg-yellow-100 text-yellow-700",
                      driver.cancellation_rate <= 25 &&
                        "bg-green-100 text-green-700",
                    )}
                  >
                    {driver.cancellation_rate.toFixed(1)}%
                  </div>

                  {driver.cancellation_rate <= 10 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
