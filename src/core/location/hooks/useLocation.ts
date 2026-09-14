/**
 * Hooks para Location - SSOT
 * Usa LocationService para persistencia e GeolocationService para device GPS.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService, type LocationHistory } from "@/core/location";
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import { useToast } from "@/shared/hooks/use-toast";
import { GeolocationService } from "@/shared/services/GeolocationService";
import { logger } from '@/shared/utils/logger';

export function useLocationHistory(
  profileId: string | undefined,
  limit: number = 100,
) {
  return useQuery({
    queryKey: ["location-history", profileId, limit],
    queryFn: () => locationService.getLocationHistory(profileId!, limit),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useLastLocation(profileId: string | undefined) {
  return useQuery({
    queryKey: ["last-location", profileId],
    queryFn: () => locationService.getLastLocation(profileId!),
    enabled: !!profileId,
    staleTime: 30 * 1000,
    retry: 1,
    refetchInterval: 60 * 1000,
  });
}

export function useSaveLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<LocationHistory, "id" | "created_at">) =>
      locationService.saveLocation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["location-history", variables.profile_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["last-location", variables.profile_id],
      });
    },
    onError: () => {
      toast({
        title: "Erro ao salvar localização",
        variant: "destructive",
      });
    },
  });
}

export function useCleanOldLocationHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (daysOld: number = 30) =>
      locationService.cleanOldHistory(daysOld),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-history"] });
      queryClient.invalidateQueries({ queryKey: ["last-location"] });
      toast({ title: "Histórico antigo removido!" });
    },
    onError: () => {
      toast({
        title: "Erro ao limpar histórico",
        variant: "destructive",
      });
    },
  });
}

export function useLocationTracking(profileId: string | undefined) {
  const saveMutation = useSaveLocation();

  const startTracking = () => {
    if (!profileId) return undefined;

    const watchId = GeolocationService.watchLocation(
      (coords) => {
        saveMutation.mutate({
          profile_id: profileId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: new Date(coords.timestamp).toISOString(),
        });
      },
      (error) => {
        logger.warn("[useLocationTracking] Localização indisponível", {
          message: error instanceof Error ? error.message : String(error),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_RUNTIME.backgroundWatchTimeoutMs,
        maximumAge: GEOLOCATION_RUNTIME.backgroundWatchMaximumAgeMs,
      },
    );

    if (watchId === null) return undefined;
    return () => GeolocationService.clearWatch(watchId);
  };

  return {
    startTracking,
    isTracking: saveMutation.isPending,
    error: saveMutation.error,
  };
}
