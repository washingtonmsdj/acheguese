import { useEffect, useState } from "react";
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
import { ptBR } from "@/shared/utils/dateLocale";
import { logger } from "@/shared/utils/logger";
import { AdminSuspendedDriverMetricsService } from "@/core/admin/services/AdminSuspendedDriverMetricsService";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import { profileService } from "@/core/profiles/services";

type AdminUser = Awaited<ReturnType<typeof profileService.getSuspendedUsers>>[number];
type LowRatedUser = Awaited<ReturnType<typeof profileService.getLowRatedUsers>>[number];
type SuspendedDriver = AdminUser & { cancellation_rate: number };

/**
 * Suspensões são lidas da authority de perfis. O enriquecimento de motorista é
 * feito em lote e somente para perfis que realmente existem em driver_data.
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
      const [suspended, lowRated] = await Promise.all([
        profileService.getSuspendedUsers(),
        profileService.getLowRatedUsers({
          maxRating: 3.0,
          minRides: 5,
          limit: 20,
        }),
      ]);

      const lifecycleByProfile = await AdminSuspendedDriverMetricsService.load(
        suspended.map((profile) => profile.id),
      );

      const suspendedWithData = suspended.flatMap((profile) => {
        const lifecycle = lifecycleByProfile.get(profile.id);
        if (!lifecycle) return [];

        return [
          {
            ...profile,
            cancellation_rate: lifecycle.driverCancellationRate,
          },
        ];
      });

      setSuspendedDrivers(suspendedWithData);
      setLowRatedUsers(lowRated || []);
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function removeSuspension(profileId: string) {
    try {
      await AdminUserService.unsuspendProfile(profileId);

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
                    <AvatarImage src={driver.avatar_url ?? undefined} />
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
                      {driver.cancellation_rate.toFixed(1)}%
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
