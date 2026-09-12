import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/shared/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Ban, Clock } from "lucide-react";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { profileService } from "@/core/profiles/services";
import { mobilityService } from "@/modules/mobility";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { logger } from "@/shared/utils/logger";

interface DriverStatus {
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_until: string | null;
  cancellation_rate: number | null;
  total_rides: number | null;
  total_rides_cancelled: number | null;
}

type DriverProfileSnapshot = {
  id: string;
  is_suspended?: boolean | null;
  suspension_reason?: string | null;
  suspended_until?: string | null;
};

type DriverStatsDetailed = {
  cancellation_rate?: number | null;
  total_rides?: number | null;
  total_rides_cancelled?: number | null;
};

export function DriverSuspensionAlert() {
  const { effectiveProfile } = useMultiProfileContext();
  const [status, setStatus] = useState<DriverStatus | null>(null);
  const [driverProfileId, setDriverProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const userId = effectiveProfile?.user_id;
  const effectiveDriverProfileId =
    effectiveProfile?.profile_type === "driver" ? effectiveProfile.id : null;

  const loadDriverStatus = useCallback(async () => {
    try {
      if (!userId) {
        setStatus(null);
        setDriverProfileId(null);
        return;
      }

      const driverProfile =
        (effectiveDriverProfileId
          ? await profileService.getAccessibleProfileById(effectiveDriverProfileId)
          : await profileService.getProfileByType(userId, "driver")) as DriverProfileSnapshot | null;

      if (!driverProfile) {
        setStatus(null);
        setDriverProfileId(null);
        return;
      }

      setDriverProfileId(driverProfile.id);

      if (!driverProfile.is_suspended) {
        setStatus({
          is_suspended: false,
          suspension_reason: null,
          suspended_until: null,
          cancellation_rate: null,
          total_rides: null,
          total_rides_cancelled: null,
        });
        return;
      }

      const driverData = (await mobilityService.getDriverStatsDetailed(
        driverProfile.id,
      )) as DriverStatsDetailed | null;

      setStatus({
        is_suspended: true,
        suspension_reason: driverProfile.suspension_reason || null,
        suspended_until: driverProfile.suspended_until || null,
        cancellation_rate: driverData?.cancellation_rate ?? null,
        total_rides: driverData?.total_rides ?? null,
        total_rides_cancelled: driverData?.total_rides_cancelled ?? null,
      });
    } catch (error) {
      logger.error("Error loading driver suspension status", error);
      setStatus(null);
      setDriverProfileId(null);
    } finally {
      setLoading(false);
    }
  }, [effectiveDriverProfileId, userId]);

  useEffect(() => {
    setLoading(true);
    void loadDriverStatus();
  }, [loadDriverStatus]);

  const suspensionExpired = useMemo(() => {
    if (!status?.is_suspended || !status.suspended_until) return false;
    return new Date(status.suspended_until).getTime() < Date.now();
  }, [status?.is_suspended, status?.suspended_until]);

  useEffect(() => {
    if (!suspensionExpired || !driverProfileId) return;

    let cancelled = false;
    void mobilityService
      .checkSuspensionExpiry(driverProfileId)
      .then(() => {
        if (!cancelled) return loadDriverStatus();
        return undefined;
      })
      .catch((error) => {
        logger.error("Failed to reconcile expired driver suspension", error);
      });

    return () => {
      cancelled = true;
    };
  }, [driverProfileId, loadDriverStatus, suspensionExpired]);

  if (loading || !status?.is_suspended || suspensionExpired) return null;

  const suspendedUntil = status.suspended_until
    ? new Date(status.suspended_until)
    : null;

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
              <span className="text-xs font-bold">Conta suspensa</span>
              <span className="text-[0.55rem] opacity-70 flex items-center gap-1">
                <Clock className="h-2 w-2" />
                {suspendedUntil
                  ? `Expira ${formatDistanceToNow(suspendedUntil, {
                      addSuffix: true,
                      locale: ptBR,
                    })}`
                  : "Sem prazo definido"}
              </span>
            </div>
            {status.suspension_reason && (
              <p className="text-[0.6rem] opacity-80 mt-0.5">
                {status.suspension_reason}
              </p>
            )}
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
              Conta suspensa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Motivo</h4>
              <p className="text-sm text-muted-foreground">
                {status.suspension_reason || "Motivo não informado"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1">Duração</h4>
              <p className="text-sm text-muted-foreground">
                {suspendedUntil
                  ? `A suspensão expira ${formatDistanceToNow(suspendedUntil, {
                      addSuffix: true,
                      locale: ptBR,
                    })} (${suspendedUntil.toLocaleString("pt-BR")})`
                  : "A suspensão não possui data de término definida."}
              </p>
            </div>

            {(status.cancellation_rate !== null ||
              status.total_rides !== null ||
              status.total_rides_cancelled !== null) && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Estatísticas</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {status.cancellation_rate !== null && (
                    <p>
                      Taxa de cancelamento:{" "}
                      <strong>{status.cancellation_rate.toFixed(1)}%</strong>
                    </p>
                  )}
                  {status.total_rides !== null && (
                    <p>
                      Corridas registradas: <strong>{status.total_rides}</strong>
                    </p>
                  )}
                  {status.total_rides_cancelled !== null && (
                    <p>
                      Corridas canceladas:{" "}
                      <strong>{status.total_rides_cancelled}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                Enquanto a suspensão estiver ativa, novas operações de motorista
                permanecem sujeitas às regras de autorização do sistema.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
