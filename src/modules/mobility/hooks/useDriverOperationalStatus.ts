import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { TablesUpdate } from "@/core/supabase";
import { DriverAvailabilityService } from "@/modules/mobility/services/DriverAvailabilityService";
import { mobilityService } from "@/modules/mobility/services/MobilityService";

interface UseDriverOperationalStatusOptions {
  driverProfileId: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  onStatusChanged?: () => Promise<unknown> | unknown;
}

function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Geolocalização indisponível neste dispositivo"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error.message || "Falha ao obter a localização atual"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}

export function useDriverOperationalStatus({
  driverProfileId,
  isOnline,
  isAvailable,
  onStatusChanged,
}: UseDriverOperationalStatusOptions) {
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const persistSnapshot = useCallback(
    async (updates: TablesUpdate<"driver_data">) => {
      if (!driverProfileId) {
        return;
      }

      await mobilityService.updateDriverData(driverProfileId, updates);
      await Promise.resolve(onStatusChanged?.());
    },
    [driverProfileId, onStatusChanged],
  );

  const toggleDriverOnline = useCallback(async () => {
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

        await persistSnapshot({
          is_online: false,
          is_available: false,
          last_location_update: null,
        });
        setGpsError(null);
        toast.success("Motorista offline");
        return;
      }

      const onlineResult = await DriverAvailabilityService.goOnline(driverProfileId);
      if (!onlineResult.success) {
        throw new Error(onlineResult.error || "Não foi possível ficar online");
      }

      try {
        const coords = await getCurrentCoordinates();
        const availableResult = await DriverAvailabilityService.setAvailable(
          driverProfileId,
          coords,
        );

        if (!availableResult.success) {
          throw new Error(
            availableResult.error || "Não foi possível habilitar a disponibilidade do motorista",
          );
        }

        await persistSnapshot({
          is_online: true,
          is_available: true,
          last_location_update: new Date().toISOString(),
        });
        setGpsError(null);
        toast.success("Motorista online e disponível");
      } catch (error) {
        await persistSnapshot({
          is_online: true,
          is_available: false,
          last_location_update: new Date().toISOString(),
        });
        setGpsError((error as Error).message);
        toast.warning("Motorista online, mas aguardando GPS para liberar corridas");
      }
    } catch (error) {
      toast.error((error as Error).message || "Falha ao atualizar o status do motorista");
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [driverProfileId, isOnline, persistSnapshot]);

  return {
    gpsError,
    isDriverOnline: isOnline,
    isTracking: isAvailable,
    isUpdatingStatus,
    toggleDriverOnline,
    clearGpsError: () => setGpsError(null),
  };
}

