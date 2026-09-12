/**
 * useDelivery - Hook oficial para solicitacao e acompanhamento de motoboy
 *
 * Reutiliza o motor de mobilidade (dispatch, pricing, realtime, state machine).
 * Empresas, gastronomia e servicos usam este hook como entrypoint.
 *
 * SSOT: RideOperationalService -> ride_requests (ride_mode = 'motoboy')
 */

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { profileService } from "@/core/profiles/services/ProfileService";
import { toast } from "sonner";
import { mobilityService } from "@/core/mobility/services/MobilityService";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { isOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import { pricingService } from "@/core/pricing/services/PricingService";
import { logger } from "@/shared/utils/logger";
import { useRideRealtime } from "./useRideRealtime";
import { buildFailedDeliveryMetadata } from "@/modules/mobility/utils/failedDelivery";
import type { RideRequest } from "@/core/mobility/types/types";
import {
  RIDE_MODE,
  MOBILITY_QUERY_KEYS,
  TIMEOUTS,
  type SourceType,
  type PackageSize,
} from "@/core/mobility/constants";

export interface CreateDeliveryData {
  pickupAddressId: string;
  dropoffAddressId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  recipientName: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  packageDescription?: string;
  packageSize?: PackageSize;
  sourceType: SourceType;
  sourceId?: string;
  authorizationSourceId?: string;
  paymentMethod?: string;
  observation?: string;
}

export interface DeliveryProof {
  photo_url?: string;
  code?: string;
  observation?: string;
}

export function useDelivery(sourceType: SourceType, sourceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeDelivery, setActiveDelivery] = useState<RideRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: deliveries = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
    queryFn: async () => {
      if (!user) return [];
      const all = await mobilityService.getUserRides(user.id);
      const filtered = (all || []).filter(
        (r: RideRequest) =>
          r.ride_mode === RIDE_MODE.MOTOBOY &&
          (!sourceId || r.source_id === sourceId),
      );
      const active = filtered.find((r: RideRequest) => isOpenRideStatus(r.status));
      setActiveDelivery(active ?? null);
      return filtered;
    },
    enabled: !!user,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });

  // Acompanhamento realtime é restrito à entrega ativa. Não reutilizamos Auth
  // User UUID como se fosse passenger_profile_id.
  useRideRealtime({
    rideId: activeDelivery?.id,
    userType: "passenger",
    enabled: Boolean(activeDelivery),
    onEvent: (event) => {
      queryClient.invalidateQueries({
        queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
      });

      if (activeDelivery?.id === event.rideId) {
        mobilityService.getRideById(event.rideId).then((updated) => {
          setActiveDelivery(
            updated && isOpenRideStatus(updated.status) ? updated : null,
          );
        });
      }

      switch (event.type) {
        case "driver_assigned":
          toast.success("Motoboy encontrado! Aguardando confirmacao...");
          break;
        case "driver_accepted":
          toast.success("Motoboy a caminho para coleta!");
          break;
        case "in_delivery":
          toast.info("Entrega em rota para o destino");
          break;
        case "delivered":
        case "completed":
          toast.success("Entrega concluida");
          setActiveDelivery(null);
          break;
        case "cancelled":
          toast.info("Entrega cancelada.");
          setActiveDelivery(null);
          break;
        case "expired":
          toast.error("Nenhum motoboy disponivel. Tente novamente.");
          setActiveDelivery(null);
          break;
      }
    },
  });

  const createDelivery = useCallback(
    async (data: CreateDeliveryData) => {
      if (!user) return { success: false, error: "Usuario nao autenticado." };
      setIsSubmitting(true);

      try {
        const passengerProfile =
          (await profileService.getProfileByType(user.id, "personal")) ||
          (await profileService.getActiveProfile(user.id));

        if (!passengerProfile?.id) {
          const profileError = "Perfil do solicitante nao encontrado.";
          toast.error(profileError);
          return { success: false, error: profileError };
        }

        let suggestedPrice: number | undefined;
        try {
          const estimate = await pricingService.calculateEstimate({
            mode: "motoboy",
            origin: { latitude: data.originLat, longitude: data.originLng },
            destination: { latitude: data.destinationLat, longitude: data.destinationLng },
          });
          suggestedPrice = estimate.estimatedPrice;
        } catch (pricingError) {
          logger.warn("useDelivery.createDelivery - pricing fallback", pricingError);
        }

        const result = await RideOperationalService.createDelivery({
          passengerProfileId: passengerProfile.id,
          ...data,
          suggestedPrice,
          requestingUserId: user.id,
        });

        if (result.success) {
          toast.success("Entrega solicitada! Buscando motoboy...");
          queryClient.invalidateQueries({
            queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user.id),
          });
        } else {
          toast.error(result.error || "Erro ao solicitar entrega.");
        }

        return result;
      } catch (error) {
        logger.error("useDelivery.createDelivery", error as Error);
        toast.error("Erro inesperado ao solicitar entrega.");
        return { success: false, error: (error as Error).message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, queryClient, sourceType, sourceId],
  );

  const cancelDelivery = useCallback(
    async (rideId: string, reason?: string) => {
      if (!user) return { success: false, error: "Usuario nao autenticado." };

      const passengerProfile =
        (await profileService.getProfileByType(user.id, "personal")) ||
        (await profileService.getActiveProfile(user.id));

      if (!passengerProfile?.id) {
        const profileError = "Perfil do solicitante nao encontrado.";
        toast.error(profileError);
        return { success: false, error: profileError };
      }

      const result = await RideOperationalService.cancelRide({
        rideId,
        cancelledBy: "passenger",
        profileId: passengerProfile.id,
        reason: reason || "Entrega cancelada pelo solicitante",
      });

      if (result.success) {
        toast.info("Entrega cancelada.");
        setActiveDelivery(null);
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user.id),
        });
      } else {
        toast.error(result.error || "Erro ao cancelar entrega.");
      }

      return result;
    },
    [queryClient, sourceType, sourceId, user],
  );

  const confirmPickup = useCallback(
    async (rideId: string, driverProfileId: string) => {
      const result = await RideOperationalService.confirmPickup(rideId, driverProfileId);
      if (result.success) {
        toast.success("Coleta confirmada! Iniciando entrega...");
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
        });
      } else {
        toast.error(result.error || "Erro ao confirmar coleta.");
      }
      return result;
    },
    [queryClient, sourceType, sourceId, user],
  );

  const startDelivery = useCallback(
    async (rideId: string, driverProfileId: string) => {
      const result = await RideOperationalService.startDelivery(rideId, driverProfileId);
      if (result.success) {
        toast.success("Em rota de entrega!");
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
        });
      } else {
        toast.error(result.error || "Erro ao iniciar entrega.");
      }
      return result;
    },
    [queryClient, sourceType, sourceId, user],
  );

  const confirmDelivery = useCallback(
    async (rideId: string, driverProfileId: string, proof: DeliveryProof, finalPrice?: number) => {
      const result = await RideOperationalService.confirmDelivery(rideId, driverProfileId, proof, finalPrice);
      if (result.success) {
        toast.success("Entrega confirmada!");
        setActiveDelivery(null);
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
        });
      } else {
        toast.error(result.error || "Erro ao confirmar entrega.");
      }
      return result;
    },
    [queryClient, sourceType, sourceId, user],
  );

  const failDelivery = useCallback(
    async (rideId: string, driverProfileId: string, reason: string) => {
      const metadata = buildFailedDeliveryMetadata(reason);
      const result = await RideOperationalService.failDelivery(rideId, driverProfileId, metadata);
      if (result.success) {
        toast.error("Falha na entrega registrada.");
        setActiveDelivery(null);
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.deliveries(sourceType, sourceId || user?.id || ""),
        });
      } else {
        toast.error(result.error || "Erro ao registrar falha.");
      }
      return result;
    },
    [queryClient, sourceType, sourceId, user],
  );

  return {
    deliveries,
    activeDelivery,
    isLoading,
    isSubmitting,
    createDelivery,
    cancelDelivery,
    confirmPickup,
    startDelivery,
    confirmDelivery,
    failDelivery,
    refetch,
  };
}
