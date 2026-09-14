import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DriverAvailabilityService } from "@/core/mobility/services/DriverAvailabilityService";
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import { GeolocationService } from "@/shared/services/GeolocationService";

interface UseDriverOperationalStatusOptions {
  driverProfileId: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  onStatusChanged?: () => Promise<unknown> | unknown;
}

type OperationalMode = "ride" | "motoboy";

async function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  const result = await GeolocationService.getCurrentLocation({
    useCache: false,
    timeout: GEOLOCATION_RUNTIME.requestTimeoutMs,
    gpsMode: "precise",
    allowIpFallback: false,
  });
  return {
    lat: result.coords.latitude,
    lng: result.coords.longitude,
  };
}

export function useDriverOperationalStatus({
  driverProfileId,
  isOnline,
  isAvailable,
  onStatusChanged,
}: UseDriverOperationalStatusOptions) {
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const refreshCanonicalStatus = useCallback(async () => {
    await Promise.resolve(onStatusChanged?.());
  }, [onStatusChanged]);

  const toggleDriverOnline = useCallback(async (operationalMode?: OperationalMode) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista não encontrado");
      return;
    }

    setIsUpdatingStatus(true);

    try {
      if (isOnline) {
        const result = await DriverAvailabilityService.goOffline(driverProfileId);
        if (!result.success) {
          throw new Error(result.error || "Não foi possível ficar offline");
        }

        await refreshCanonicalStatus();
        setGpsError(null);
        toast.success("Motorista offline");
        return;
      }

      const onlineResult = await DriverAvailabilityService.goOnline(driverProfileId, operationalMode);
      if (!onlineResult.success) {
        throw new Error(onlineResult.error || "Não foi possível ficar online");
      }

      try {
        const coords = await getCurrentCoordinates();
        const availableResult = await DriverAvailabilityService.setAvailable(
          driverProfileId,
          coords,
          operationalMode,
        );

        if (!availableResult.success) {
          throw new Error(
            availableResult.error || "Não foi possível habilitar a disponibilidade do motorista",
          );
        }

        await refreshCanonicalStatus();
        setGpsError(null);
        toast.success("Motorista online e disponível");
      } catch (error) {
        await refreshCanonicalStatus();
        setGpsError((error as Error).message);
        toast.warning("Motorista online, mas aguardando GPS para liberar corridas");
      }
    } catch (error) {
      toast.error((error as Error).message || "Falha ao atualizar o status do motorista");
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [driverProfileId, isOnline, refreshCanonicalStatus]);

  const toggleTracking = useCallback(async (operationalMode?: OperationalMode) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    if (!isOnline) {
      toast.error("Fique online antes de habilitar a disponibilidade");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      if (isAvailable) {
        const pauseResult = await DriverAvailabilityService.pauseAvailable(driverProfileId);
        if (!pauseResult.success) {
          throw new Error(
            pauseResult.error || "Nao foi possivel pausar a disponibilidade",
          );
        }

        await refreshCanonicalStatus();
        setGpsError(null);
        toast.success("Disponibilidade pausada");
        return;
      }

      const coords = await getCurrentCoordinates();
      const availableResult = await DriverAvailabilityService.setAvailable(
        driverProfileId,
        coords,
        operationalMode,
      );
      if (!availableResult.success) {
        throw new Error(availableResult.error || "Nao foi possivel habilitar a disponibilidade");
      }

      await refreshCanonicalStatus();
      setGpsError(null);
      toast.success("Disponibilidade ativada");
    } catch (error) {
      setGpsError((error as Error).message);
      toast.error((error as Error).message || "Falha ao atualizar disponibilidade");
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [driverProfileId, isAvailable, isOnline, refreshCanonicalStatus]);

  return {
    gpsError,
    isDriverOnline: isOnline,
    isTracking: isAvailable,
    isUpdatingStatus,
    toggleDriverOnline,
    toggleTracking,
    clearGpsError: () => setGpsError(null),
  };
}
