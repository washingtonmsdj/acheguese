/**
 * Hooks para Location - SSOT
 * Usa LocationService para todas as operações
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService, type LocationHistory } from "@/core/location";
import { useToast } from "@/shared/hooks/use-toast";

/**
 * Hook para buscar histórico de localização
 */
export function useLocationHistory(
  profileId: string | undefined,
  limit: number = 100,
) {
  return useQuery({
    queryKey: ["location-history", profileId, limit],
    queryFn: () => locationService.getLocationHistory(profileId!, limit),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para buscar última localização
 */
export function useLastLocation(profileId: string | undefined) {
  return useQuery({
    queryKey: ["last-location", profileId],
    queryFn: () => locationService.getLastLocation(profileId!),
    enabled: !!profileId,
    staleTime: 30 * 1000, // 30 segundos (mais frequente)
    retry: 1,
    refetchInterval: 60 * 1000, // Atualizar a cada minuto
  });
}

/**
 * Hook para salvar localização
 */
export function useSaveLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<LocationHistory, "id" | "created_at">) =>
      locationService.saveLocation(data),
    onSuccess: (_, variables) => {
      // Invalidar cache de localização do perfil
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

/**
 * Hook para limpeza de histórico antigo (admin)
 */
export function useCleanOldLocationHistory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (daysOld: number = 30) =>
      locationService.cleanOldHistory(daysOld),
    onSuccess: () => {
      // Invalidar todo o cache de localização
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

/**
 * Hook personalizado para rastreamento em tempo real
 */
export function useLocationTracking(profileId: string | undefined) {
  const saveMutation = useSaveLocation();

  const startTracking = () => {
    if (!profileId || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        saveMutation.mutate({
          profile_id: profileId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minuto
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  return {
    startTracking,
    isTracking: saveMutation.isPending,
    error: saveMutation.error,
  };
}
