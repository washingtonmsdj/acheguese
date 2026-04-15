import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/shared/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, Ban, Clock } from "lucide-react";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { profileService } from "@/core/profiles/services";
import { mobilityService } from "@/modules/mobility";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logger } from "@/shared/utils/logger";

interface DriverStatus {
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_until: string | null;
  cancellation_rate: number;
  total_rides_accepted: number;
  total_rides_cancelled: number;
}

export function DriverSuspensionAlert() {
  const { effectiveProfile } = useMultiProfileContext();
  const [status, setStatus] = useState<DriverStatus | null>(null);
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const userId = effectiveProfile?.user_id;
  const effectiveDriverProfileId =
    effectiveProfile?.profile_type === "driver" ? effectiveProfile.id : null;

  const loadDriverStatus = useCallback(async () => {
    try {
      if (!userId) {
        setStatus(null);
        setContext(null);
        setLoading(false);
        return;
      }

      const driverProfile =
        (effectiveDriverProfileId
          ? await profileService.getProfileById(effectiveDriverProfileId)
          : await profileService.getProfileByType(userId, "driver")) as any;

      if (!driverProfile) {
        setStatus(null);
        setContext(null);
        setLoading(false);
        return;
      }

      setContext({ id: driverProfile.id });

      const driverData = (await mobilityService.getDriverStatsDetailed(
        driverProfile.id,
      )) as any;

      setStatus({
        is_suspended: driverProfile.is_suspended ?? false,
        suspension_reason: driverProfile.suspension_reason || null,
        suspended_until: driverProfile.suspended_until || null,
        cancellation_rate: driverData?.cancellation_rate || 0,
        total_rides_accepted: driverData?.total_rides || 0,
        total_rides_cancelled: driverData?.total_rides_cancelled || 0,
      });
    } catch (error) {
      logger.error("Error loading driver status:", error);
    } finally {
      setLoading(false);
    }
  }, [effectiveDriverProfileId, userId]);

  useEffect(() => {
    // Precisa de user_id para buscar contexto
    if (!userId) {
      setLoading(false);
      return;
    }

    loadDriverStatus();
    // ✅ REALTIME: Status de suspensão não muda frequentemente, removido polling
  }, [loadDriverStatus, userId]);

  if (loading || !status) return null;

  // Alerta de suspensão ativa
  if (status.is_suspended && status.suspended_until) {
    const suspendedUntil = new Date(status.suspended_until);
    const isExpired = suspendedUntil < new Date();

    if (isExpired) {
      // ✅ SSOT - Usar MobilityService para verificar suspensão
      if (status && context?.id) {
        mobilityService
          .checkSuspensionExpiry(context.id)
          .then(() => {
            loadDriverStatus();
          })
          .catch((err) => {
            logger.error("Failed to check suspension expiry:", err);
          });
      }
      return null;
    }

    return (
      <>
        <Alert
          variant="destructive"
          className="mb-1 py-1 px-2.5 border-destructive/30 bg-destructive/5"
        >
          <div className="flex items-center gap-1.5">
            <Ban className="h-3 w-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold">Conta Suspensa</span>
                <span className="text-[0.55rem] opacity-70 flex items-center gap-1">
                  <Clock className="h-2 w-2" />
                  Expira{" "}
                  {formatDistanceToNow(suspendedUntil, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              <p className="text-[0.6rem] opacity-80 mt-0.5">
                {status.suspension_reason}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-5 text-[0.55rem] px-1.5 flex-shrink-0"
            >
              Saiba mais
            </Button>
          </div>
        </Alert>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-destructive/10">
                  <Ban className="h-4 w-4 text-destructive" />
                </div>
                Conta Suspensa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Motivo</h4>
                <p className="text-sm text-muted-foreground">
                  {status.suspension_reason}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Duração</h4>
                <p className="text-sm text-muted-foreground">
                  A suspensão expira{" "}
                  {formatDistanceToNow(suspendedUntil, {
                    addSuffix: true,
                    locale: ptBR,
                  })}{" "}
                  ({new Date(suspendedUntil).toLocaleString("pt-BR")})
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Estatísticas</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Taxa de cancelamento:{" "}
                    <strong>{status.cancellation_rate.toFixed(1)}%</strong>
                  </p>
                  <p>
                    Corridas aceitas:{" "}
                    <strong>{status.total_rides_accepted}</strong>
                  </p>
                  <p>
                    Corridas canceladas:{" "}
                    <strong>{status.total_rides_cancelled}</strong>
                  </p>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Durante a suspensão, você não pode aceitar novas corridas.
                  Após o término, sua conta será reativada automaticamente.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Alerta de taxa alta (próximo da suspensão)
  if (status.cancellation_rate > 25 && status.cancellation_rate <= 30) {
    return (
      <>
        <Alert
          variant="default"
          className="mb-1 py-1 px-2.5 border-warning/30 bg-warning/5"
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-warning">
                  Taxa de Cancelamento Alta
                </span>
                <span className="text-[0.55rem] text-warning/80">
                  {status.cancellation_rate.toFixed(1)}%
                </span>
              </div>
              <p className="text-[0.6rem] text-warning/80 mt-0.5">
                Evite cancelar corridas. Acima de 30% sua conta será suspensa.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-5 text-[0.55rem] px-1.5 flex-shrink-0 text-warning hover:text-warning"
            >
              Saiba mais
            </Button>
          </div>
        </Alert>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="rounded-lg p-2 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                Taxa de Cancelamento Alta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Situação Atual</h4>
                <p className="text-sm text-muted-foreground">
                  Sua taxa de cancelamento está em{" "}
                  <strong className="text-warning">
                    {status.cancellation_rate.toFixed(1)}%
                  </strong>
                  , próxima do limite de 30%.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Estatísticas</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Corridas aceitas:{" "}
                    <strong>{status.total_rides_accepted}</strong>
                  </p>
                  <p>
                    Corridas canceladas:{" "}
                    <strong>{status.total_rides_cancelled}</strong>
                  </p>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-xs text-warning font-semibold mb-1">
                  ⚠️ Atenção
                </p>
                <p className="text-xs text-muted-foreground">
                  Se sua taxa ultrapassar 30%, sua conta será suspensa
                  automaticamente. Evite cancelar corridas após aceitá-las para
                  manter sua conta ativa.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Como melhorar</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Aceite apenas corridas que você pode completar</li>
                  <li>Verifique a rota antes de aceitar</li>
                  <li>Comunique-se com o passageiro em caso de problemas</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

