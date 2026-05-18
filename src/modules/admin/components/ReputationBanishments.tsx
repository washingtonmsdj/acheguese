import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Ban, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logger } from "@/shared/utils/logger";
import { adminMobilityService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminMobilityService do core
import { profileService } from "@/core/profiles/services";

type AdminUser = Awaited<ReturnType<typeof profileService.getAllUsers>>[number];
type LowRatedUser = Awaited<ReturnType<typeof profileService.getLowRatedUsers>>[number];
type SuspendedDriver = AdminUser & { cancellation_rate: number };

/**
 * FASE PROFILE.1.3 - FECHAMENTO REAL DA IDENTIDADE
 *
 * Componente migrado para usar ProfileService como fonte única de verdade
 * Elimina acessos diretos a profiles e regras manuais de suspensão
 */

export function ReputationBanishments() {
  const [suspendedDrivers, setSuspendedDrivers] = useState<SuspendedDriver[]>([]);
  const [lowRatedUsers, setLowRatedUsers] = useState<LowRatedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // ✅ MIGRADO - Busca todos os usuários usando ProfileService
      const allUsers = await profileService.getAllUsers();

      // ✅ MIGRADO - Filtra suspensos usando ProfileService
      const suspended = allUsers.filter((user) => user.status.isSuspended);

      // Buscar dados adicionais de cancelamento para motoristas suspensos
      const suspendedWithData = await Promise.all(
        suspended.map(async (user) => {
          // ✅ SSOT - Usar MobilityService para dados de motorista
          const driverRides = (await adminMobilityService.getUserRides(user.id)) as Array<{
            status?: string;
          }>;
          const total = driverRides.length;
          const cancelled = driverRides.filter((ride) => ride.status === "cancelled").length;

          return {
            ...user,
            cancellation_rate: total > 0 ? (cancelled / total) * 100 : 0,
          };
        }),
      );

      setSuspendedDrivers(suspendedWithData);

      // ✅ SSOT - Usar ProfileService para usuários com baixo rating
      const lowRated = await profileService.getLowRatedUsers({
        maxRating: 3.0,
        minRides: 5,
        limit: 20,
      });

      setLowRatedUsers(lowRated || []);
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function removeSuspension(userId: string) {
    try {
      // ✅ MIGRADO - Usa ProfileService para remover suspensão
      await profileService.unsuspendUser(userId);

      toast.success("Suspensão removida");
      loadData();
    } catch (error) {
      logger.error("Error:", error);
      toast.error("Erro ao remover suspensão");
    }
  }

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Motoristas Suspensos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Motoristas Suspensos ({suspendedDrivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suspendedDrivers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum motorista suspenso
            </p>
          ) : (
            <div className="space-y-3">
              {suspendedDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
                >
                  <Avatar>
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback>{driver.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.status.suspensionReason}
                    </p>
                    {driver.status.suspendedUntil && (
                      <p className="text-xs text-red-600 mt-1">
                        Expira{" "}
                        {formatDistanceToNow(
                          new Date(driver.status.suspendedUntil),
                          { addSuffix: true, locale: ptBR },
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {driver.cancellation_rate?.toFixed(1)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSuspension(driver.id)}
                      className="mt-2"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuários com Baixo Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Passageiros com Baixo Rating ({lowRatedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowRatedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum passageiro com baixo rating
            </p>
          ) : (
            <div className="space-y-3">
              {lowRatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                >
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.passenger_completed_rides} corridas • Nível:{" "}
                      {user.passenger_trust_level}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="border-yellow-500 text-yellow-700"
                    >
                      ★ {user.passenger_rating?.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
