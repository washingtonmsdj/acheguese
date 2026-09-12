import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RidePassengerService, RideRatingService, RideReportsService } from "@/core/mobility/services";
import type { ReportSeverity, ReportType } from "@/core/mobility/services/RideReportsService";
import { toast } from "sonner";
import { getUserRides, getRideById, getPassengerRating } from "@/core/mobility/services/mobility.queries";
import type { RideRequest } from "@/core/mobility/types/types";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import {
  isDriverOwnedOpenRideStatus,
  isOpenRideStatus,
  isPreAcceptRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { logger } from "@/shared/utils/logger";
import { formatBrl } from "@/shared/utils/currency";
import { useRideRealtime } from "./useRideRealtime";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";

export interface CreateRideRequestData {
  origin: string;
  destination: string;
  departure_time: string;
  suggested_price?: number;
  type: "viagem" | "entrega" | "agendada" | "carona_compartilhada";
  payment_method: string;
  observation?: string;
  available_seats?: number;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  search_radius_km?: number;
  pickup_address_id: string;
  dropoff_address_id: string;
  pickup_location_id: string;
  dropoff_location_id: string;
}

interface UseMobilidadeOptions {
  realtimeEnabled?: boolean;
}

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

const REPORT_TYPES: readonly ReportType[] = [
  "safety_concern",
  "driver_behavior",
  "passenger_behavior",
  "route_issue",
  "payment_issue",
  "vehicle_condition",
  "cancellation_abuse",
  "fraud_suspicion",
  "other",
];

const REPORT_SEVERITIES: readonly ReportSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

function parseReportType(value: string): ReportType {
  return REPORT_TYPES.includes(value as ReportType) ? (value as ReportType) : "other";
}

function parseReportSeverity(value: string): ReportSeverity {
  return REPORT_SEVERITIES.includes(value as ReportSeverity)
    ? (value as ReportSeverity)
    : "medium";
}

export function useMobilidade(options: UseMobilidadeOptions = {}) {
  const { realtimeEnabled = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);

  const {
    data: rides = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.rides(user?.id),
    queryFn: async (): Promise<RideRequest[]> => {
      if (!user) return [];
      const data = ((await getUserRides(user.id)) || []) as RideRequest[];
      const active = data.find((ride) => isOpenRideStatus(ride.status)) ?? null;
      setActiveRide(active);
      return data;
    },
    enabled: Boolean(user),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });

  // Passenger realtime is scoped to the concrete active ride. Auth user ids are
  // never passed as passenger_profile_id filters.
  useRideRealtime({
    rideId: activeRide?.id,
    userType: "passenger",
    enabled: realtimeEnabled && Boolean(activeRide),
    onEvent: (event) => {
      logger.info("useMobilidade - realtime event", event);

      queryClient.invalidateQueries({
        queryKey: MOBILITY_QUERY_KEYS.rides(user?.id),
      });

      if (activeRide?.id === event.rideId) {
        void getRideById(event.rideId).then((updatedRide) => {
          if (!updatedRide) {
            setActiveRide(null);
            return;
          }

          const nextRide = updatedRide as RideRequest;
          setActiveRide(isOpenRideStatus(nextRide.status) ? nextRide : null);
        });
      }

      switch (event.type) {
        case "driver_assigned":
          toast.success("Motorista encontrado! Aguardando confirmacao...");
          break;
        case "driver_accepted":
          toast.success("Motorista confirmou! Preparando corrida...");
          break;
        case "in_progress":
          toast.info("Corrida iniciada");
          break;
        case "in_delivery":
          toast.info("Entrega em rota");
          break;
        case "delivered":
          toast.success("Entrega concluida");
          break;
        case "completed":
          toast.success("Operacao concluida");
          setActiveRide(null);
          break;
        case "cancelled":
          toast.info("Corrida foi cancelada");
          setActiveRide(null);
          break;
        case "expired":
          toast.error("Corrida expirou. Tente novamente.");
          setActiveRide(null);
          break;
      }
    },
  });

  const {
    data: passengerRating = 5.0,
    isLoading: isLoadingRating,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.passengerRating(user?.id),
    queryFn: async () => {
      if (!user) return 5.0;
      try {
        return await getPassengerRating(user.id);
      } catch (error) {
        logger.error("useMobilidade.getPassengerRating", error as Error);
        return 5.0;
      }
    },
    enabled: Boolean(user),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  const createRide = useCallback(
    async (rideData: CreateRideRequestData) => {
      try {
        if (!user) {
          toast.error("Usuario nao autenticado");
          throw new Error("User not authenticated");
        }

        const passengerProfile =
          (await profileService.getProfileByType(user.id, "personal")) ||
          (await profileService.getActiveProfile(user.id));

        if (!passengerProfile?.id) {
          logger.error(
            "useMobilidade.createRide - profile not found",
            new Error("No profile"),
            { userId: user.id },
          );
          toast.error("Perfil nao encontrado. Verifique seu cadastro.");
          throw new Error("Profile not found");
        }

        logger.info("useMobilidade.createRide - profile found", {
          profileId: passengerProfile.id,
          userId: user.id,
        });
        let suggestedPrice = rideData.suggested_price;

        if (
          !isValidCoordinate(rideData.origin_lat) ||
          !isValidCoordinate(rideData.origin_lng) ||
          !isValidCoordinate(rideData.destination_lat) ||
          !isValidCoordinate(rideData.destination_lng)
        ) {
          toast.error(
            "Coordenadas sao obrigatorias para calculo de preco. Selecione enderecos validos no mapa.",
          );
          throw new Error("Coordinates required for official pricing calculation");
        }

        try {
          const { pricingService } = await import("@/core/pricing/instance");

          const priceEstimate = await pricingService.calculateEstimate({
            mode: rideData.type === "entrega" ? "delivery" : "ride",
            origin: {
              latitude: rideData.origin_lat,
              longitude: rideData.origin_lng,
            },
            destination: {
              latitude: rideData.destination_lat,
              longitude: rideData.destination_lng,
            },
            options: {
              applyPeakHours: true,
              includeBreakdown: false,
            },
          });

          suggestedPrice = priceEstimate.estimatedPrice;
          logger.info("useMobilidade.createRide - OFFICIAL pricing calculated", {
            estimatedPrice: priceEstimate.estimatedPrice,
            distanceKm: priceEstimate.metadata.distanceKm,
            durationMinutes: priceEstimate.metadata.durationMinutes,
            mode: priceEstimate.metadata.mode,
          });
        } catch (pricingError) {
          logger.error(
            "useMobilidade.createRide - OFFICIAL pricing failed",
            pricingError as Error,
          );
          toast.error("Erro no calculo de preco. Tente novamente ou contate o suporte.");
          throw new Error("Official pricing calculation failed");
        }

        const normalizedSuggestedPrice =
          typeof suggestedPrice === "number" && Number.isFinite(suggestedPrice)
            ? suggestedPrice
            : undefined;

        const result = await RideOperationalService.createRide({
          passengerProfileId: passengerProfile.id,
          pickupAddressId: rideData.pickup_address_id,
          dropoffAddressId: rideData.dropoff_address_id,
          pickupLocationId: rideData.pickup_location_id,
          dropoffLocationId: rideData.dropoff_location_id,
          origin: rideData.origin,
          destination: rideData.destination,
          originLat: rideData.origin_lat,
          originLng: rideData.origin_lng,
          destinationLat: rideData.destination_lat,
          destinationLng: rideData.destination_lng,
          mode: rideData.type === "entrega" ? "delivery" : "ride",
          suggestedPrice: normalizedSuggestedPrice,
          observation: rideData.observation,
          availableSeats: rideData.available_seats,
          paymentMethod: rideData.payment_method,
          departureTime: rideData.departure_time,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao criar corrida");
          throw new Error(result.error || "Failed to create ride");
        }

        const data = (await getRideById(result.rideId!)) as RideRequest | null;
        setActiveRide(data);
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.rides(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id),
        });

        if (normalizedSuggestedPrice !== undefined) {
          toast.success(
            `Corrida solicitada! Preco oficial: ${formatBrl(normalizedSuggestedPrice)}`,
          );
        } else {
          toast.success("Corrida solicitada!");
        }
        return data;
      } catch (error) {
        logger.error("useMobilidade.createRide", error as Error);
        toast.error("Erro ao criar corrida");
        throw error;
      }
    },
    [user, queryClient],
  );

  const cancelRide = useCallback(
    async (rideId: string, reason?: string) => {
      try {
        logger.info("useMobilidade.cancelRide - iniciando", {
          rideId,
          userId: user?.id,
        });

        if (!user) {
          toast.error("Usuario nao autenticado");
          return false;
        }

        const userProfile =
          (await profileService.getProfileByType(user.id, "personal")) ||
          (await profileService.getActiveProfile(user.id));

        if (!userProfile?.id) {
          logger.error(
            "useMobilidade.cancelRide - perfil nao encontrado",
            new Error("No profile"),
            { userId: user.id },
          );
          toast.error("Perfil nao encontrado");
          return false;
        }

        logger.info("useMobilidade.cancelRide - perfil do usuario", {
          userId: user.id,
          profileId: userProfile.id,
        });

        const ride = (await getRideById(rideId)) as RideRequest | null;
        if (!ride) {
          logger.warn("useMobilidade.cancelRide - corrida nao encontrada", {
            rideId,
          });
          toast.error("Corrida nao encontrada");
          return false;
        }

        logger.info("useMobilidade.cancelRide - corrida encontrada", {
          rideId,
          status: ride.status,
          passengerId: ride.passenger_profile_id,
          driverProfileId: ride.driver_profile_id,
          userProfileId: userProfile.id,
        });

        const isPassenger = ride.passenger_profile_id === userProfile.id;
        const isDriver = ride.driver_profile_id === userProfile.id;

        if (!isPassenger && !isDriver) {
          logger.warn("useMobilidade.cancelRide - usuario nao autorizado", {
            rideId,
            userProfileId: userProfile.id,
            passengerId: ride.passenger_profile_id,
            driverProfileId: ride.driver_profile_id,
          });
          toast.error("Voce nao pode cancelar esta corrida");
          return false;
        }

        logger.info("useMobilidade.cancelRide - chamando RideOperationalService", {
          rideId,
          cancelledBy: isPassenger ? "passenger" : "driver",
          profileId: userProfile.id,
        });

        const result = await RideOperationalService.cancelRide({
          rideId,
          cancelledBy: isPassenger ? "passenger" : "driver",
          profileId: userProfile.id,
          reason,
        });

        if (!result.success) {
          logger.error("useMobilidade.cancelRide - falha no cancelamento", {
            rideId,
            error: result.error,
            fromState: result.fromState,
            toState: result.toState,
          });

          let errorMessage = result.error || "Erro ao cancelar corrida";

          if (errorMessage.includes("Cannot cancel ride in state")) {
            errorMessage = `Nao e possivel cancelar a corrida no estado atual (${ride.status})`;
          } else if (errorMessage.includes("Passenger cannot cancel at this stage")) {
            errorMessage = "Voce nao pode mais cancelar esta corrida neste momento";
          } else if (errorMessage.includes("Driver cannot cancel at this stage")) {
            errorMessage = "Motorista nao pode cancelar neste momento";
          }

          toast.error(errorMessage);
          return false;
        }

        logger.info("useMobilidade.cancelRide - sucesso", {
          rideId,
          fromState: result.fromState,
          toState: result.toState,
        });

        setActiveRide(null);
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.rides(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id),
        });
        toast.success("Corrida cancelada");
        return true;
      } catch (error) {
        logger.error("useMobilidade.cancelRide", error as Error, {
          rideId,
          userId: user?.id,
        });
        toast.error("Erro ao cancelar corrida");
        return false;
      }
    },
    [user, queryClient],
  );

  const rateRide = useCallback(
    async (rideId: string, rating: number, comment?: string) => {
      try {
        if (!user) {
          toast.error("Usuário não autenticado");
          return { success: false };
        }

        const sanitizedComment = (comment || "").trim();
        const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));

        await RideRatingService.upsert({
          rideId,
          rating: clampedRating,
          comment: sanitizedComment || null,
        });

        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.rides(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.passengerRating(user.id),
        });
        toast.success("Avaliação enviada!");
        return { success: true };
      } catch (error) {
        logger.error("useMobilidade.rateRide", error as Error, {
          rideId,
          rating,
        });
        toast.error("Erro ao enviar avaliação");
        return { success: false };
      }
    },
    [user, queryClient],
  );

  const confirmRideCompletion = useCallback(
    async (rideId: string) => {
      try {
        if (!user) {
          toast.error("Usuario nao autenticado");
          return { success: false };
        }

        await RidePassengerService.confirmRideCompletion(rideId);

        queryClient.invalidateQueries({
          queryKey: MOBILITY_QUERY_KEYS.rides(user.id),
        });
        toast.success("Corrida confirmada!");
        return { success: true };
      } catch (error) {
        logger.error("useMobilidade.confirmRideCompletion", error as Error, {
          rideId,
        });
        toast.error("Erro ao confirmar corrida");
        return { success: false };
      }
    },
    [user, queryClient],
  );

  const reportRideProblem = useCallback(
    async (
      rideId: string,
      description: string,
      reportType: string = "other",
      severity: string = "medium",
    ) => {
      try {
        if (!user) {
          toast.error("Usuario nao autenticado");
          return { success: false };
        }

        const result = await RideReportsService.createReport({
          rideId,
          reportType: parseReportType(reportType),
          severity: parseReportSeverity(severity),
          title: "Problema reportado",
          description: description.trim(),
        });

        if (result.success) {
          toast.success("Problema reportado com sucesso.");
          return { success: true };
        }

        toast.error(result.error || "Erro ao reportar problema");
        return { success: false };
      } catch (error) {
        logger.error("useMobilidade.reportRideProblem", error as Error, {
          rideId,
        });
        toast.error("Erro ao reportar problema");
        return { success: false };
      }
    },
    [user],
  );

  const myRides = rides;
  const error: string | null = null;

  return {
    rides,
    isLoading,
    activeRide,
    createRide,
    cancelRide,
    refetch,
    rateRide,
    confirmRideCompletion,
    reportRideProblem,
    myRides,
    error,
    pendingRides: rides.filter((ride: RideRequest) =>
      isPreAcceptRideStatus(ride.status),
    ),
    activeRides: rides.filter((ride: RideRequest) =>
      isDriverOwnedOpenRideStatus(ride.status),
    ),
    passengerRating,
    isLoadingRating,
  };
}
