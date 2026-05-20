/**
 * Hook otimizado para MobilityService
 * Usa TanStack Query para cache e estado
 * Usa MobilityFacade como fronteira canonica do modulo.
 */
import { logger } from '@/shared/utils/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobilityFacade } from "@/modules/mobility/services/MobilityService";
import { toast } from "sonner";
import { TIMEOUTS } from "@/modules/mobility/constants";
// Query Keys
const MOBILITY_KEYS = {
  rides: (...args: string[]) => ["mobility", "routes", ...args] as string[],
};
/**
 * Hook para buscar corridas do usuario
 */
export function useUserRides(userId: string | undefined) {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("user-rides", userId!),
    queryFn: () => MobilityFacade.getUserRides(userId!),
    enabled: !!userId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
    retry: 1,
  });
}

/**
 * Hook para buscar corridas pendentes
 */
export function usePendingRides() {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("pending"),
    queryFn: () => MobilityFacade.getAvailableRides(),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
    retry: 1,
  });
}

/**
 * Hook para buscar corrida por ID
 */
export function useRide(rideId: string | undefined) {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("ride", rideId!),
    queryFn: () => MobilityFacade.getRideById(rideId!),
    enabled: !!rideId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
    retry: 1,
  });
}

/**
 * Hook para criar solicitacao de corrida
 */
export function useCreateRideRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideData: Record<string, unknown>) => MobilityFacade.createRideRequest(rideData),
    onSuccess: (_data, variables) => {
      toast.success("Solicitacao de corrida criada!");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: MOBILITY_KEYS.rides() });
      const typedVars = variables as { passenger_profile_id?: string };
      if (typedVars.passenger_profile_id) {
        queryClient.invalidateQueries({
          queryKey: MOBILITY_KEYS.rides("user-rides", typedVars.passenger_profile_id),
        });
      }
    },
    onError: () => {
      toast.error("Erro ao criar solicitacao de corrida");
    },
  });
}

/**
 * Hook para aceitar corrida
 */
export function useAcceptRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rideId,
      driverProfileId,
    }: {
      rideId: string;
      driverProfileId: string;
    }) => MobilityFacade.acceptRide(rideId, driverProfileId),
    onSuccess: (_data, variables) => {
      toast.success("Corrida aceita!");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: MOBILITY_KEYS.rides("ride", variables.rideId),
      });
      queryClient.invalidateQueries({
        queryKey: MOBILITY_KEYS.rides("pending"),
      });
    },
    onError: () => {
      toast.error("Erro ao aceitar corrida");
    },
  });
}

/**
 * Hook para iniciar corrida
 */
export function useStartRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => MobilityFacade.startRide(rideId),
    onSuccess: (_data, rideId) => {
      toast.success("Corrida iniciada!");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: MOBILITY_KEYS.rides("ride", rideId),
      });
    },
    onError: () => {
      toast.error("Erro ao iniciar corrida");
    },
  });
}

/**
 * Hook para completar corrida
 */
export function useCompleteRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      rideId,
      finalPrice,
    }: {
      rideId: string;
      finalPrice?: number;
    }) => MobilityFacade.completeRide(rideId, finalPrice),
    onSuccess: (_data, variables) => {
      toast.success("Corrida finalizada!");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: MOBILITY_KEYS.rides("ride", variables.rideId),
      });
    },
    onError: () => {
      toast.error("Erro ao finalizar corrida");
    },
  });
}

/**
 * Hook para confirmar corrida (passageiro)
 */
export function useConfirmRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => MobilityFacade.confirmRide(rideId),
    onSuccess: (_data, rideId) => {
      toast.success("Corrida confirmada!");

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: MOBILITY_KEYS.rides("ride", rideId),
      });
    },
    onError: () => {
      toast.error("Erro ao confirmar corrida");
    },
  });
}

/**
 * Hook para buscar estatisticas de corridas
 */
export function useRideStats(
  userId: string | undefined,
  userType: "passenger" | "driver",
) {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("stats", userId!, userType),
    queryFn: () => MobilityFacade.getMobilityStats(),
    enabled: !!userId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
    retry: 1,
  });
}

/**
 * Hook para buscar historico de corridas
 */
export function useRideHistory(
  userId: string | undefined,
  filters: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("history", userId!),
    queryFn: () => MobilityFacade.getRideHistory(userId!, filters),
    enabled: !!userId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_LONG,
    retry: 1,
  });
}

/**
 * Hook para atualizar localizacao do motorista
 */
export function useUpdateDriverLocation() {
  return useMutation({
    mutationFn: ({
      driverProfileId,
      location,
    }: {
      driverProfileId: string;
      location: { latitude: number; longitude: number };
    }) => MobilityFacade.updateDriverLocation(driverProfileId, location),
    onError: () => {
      // Falha silenciosa para nao interromper a experiencia.
      logger.warn("Erro ao atualizar localizacao do motorista");
    },
  });
}

/**
 * Hook para buscar localizacao do motorista
 */
export function useDriverLocation(driverProfileId: string | undefined) {
  return useQuery({
    queryKey: MOBILITY_KEYS.rides("driver-location", driverProfileId!),
    queryFn: () => MobilityFacade.getDriverLocation(driverProfileId!),
    enabled: !!driverProfileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_SHORT,
    // Realtime: sem polling; localizacao atualizada via GPS tracking.
    retry: 1,
  });
}
