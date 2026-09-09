import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RidePassengerService, RideRatingService, RideReportsService } from "@/core/mobility/services";
import type { ReportSeverity, ReportType } from "@/core/mobility/services/RideReportsService";
import { toast } from "sonner";
import { getUserRides, getRideById, getPassengerRating } from "@/core/mobility/services/mobility.queries";
import type { RideRequest } from "@/core/mobility/types/types";
import { acceptRide, startRide, completeRide, cancelRide } from "@/core/mobility/services/mobility.mutations";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { RideDispatchService } from "@/core/mobility/core/RideDispatchService";
import { logger } from "@/shared/utils/logger";
import { formatBrl } from "@/shared/utils/currency";
import { useRideRealtime } from "./useRideRealtime";
import { RIDE_STATUS, MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";

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

const REPORT_SEVERITIES: readonly ReportSeverity[] = ["low", "medium", "high", "critical"];

function parseReportType(value: string): ReportType {
  return REPORT_TYPES.includes(value as ReportType) ? (value as ReportType) : "other";
}

function parseReportSeverity(value: string): ReportSeverity {
  return REPORT_SEVERITIES.includes(value as ReportSeverity) ? (value as ReportSeverity) : "medium";
}

export function useMobilidade() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const ACTIVE_RIDE_STATUSES: RideRequest["status"][] = [
    RIDE_STATUS.PENDING,
    RIDE_STATUS.IN_PROGRESS,
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.SEARCHING_DRIVER,
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.PASSENGER_BOARDED,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.DRIVER_ARRIVED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
  ];
  const PENDING_RIDE_STATUSES: RideRequest["status"][] = [
    RIDE_STATUS.PENDING,
    RIDE_STATUS.REQUESTED,
    RIDE_STATUS.SEARCHING_DRIVER,
    RIDE_STATUS.DRIVER_ASSIGNED,
  ];
  const ONGOING_RIDE_STATUSES: RideRequest["status"][] = [
    RIDE_STATUS.DRIVER_ACCEPTED,
    RIDE_STATUS.IN_PROGRESS,
    RIDE_STATUS.DRIVER_ARRIVING,
    RIDE_STATUS.PASSENGER_BOARDED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
  ];

  const {
    data: rides = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.rides(user?.id),
    queryFn: async (): Promise<RideRequest[]> => {
      if (!user) return [];
      const data = ((await getUserRides(user.id)) || []) as RideRequest[];
      const active = data.find((r: RideRequest) => ACTIVE_RIDE_STATUSES.includes(r.status));
      if (active) setActiveRide(active);
      return data;
    },
    enabled: !!user,
    // REALTIME: Removido polling, usando subscription
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });

  // REALTIME NATIVO: Subscription para mudancas de corrida
  useRideRealtime({
    userType: 'passenger',
    userId: user?.id,
    enabled: !!user,
    onEvent: (event) => {
      logger.info('useMobilidade - realtime event', event);
      
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user?.id) });
      
      // Atualizar activeRide se necessário
      if (activeRide?.id === event.rideId) {
        // Recarregar corrida específica
        getRideById(event.rideId).then(updatedRide => {
          if (updatedRide) {
            setActiveRide(updatedRide as RideRequest);
          }
        });
      }
      
      // Notificações baseadas no evento
      switch (event.type) {
        case 'driver_assigned':
          toast.success("Motorista encontrado! Aguardando confirmacao...");
          break;
        case 'driver_accepted':
          toast.success("Motorista confirmou! Preparando corrida...");
          break;
        case 'in_progress':
          toast.info("Corrida iniciada");
          break;
        case 'in_delivery':
          toast.info("Entrega em rota");
          break;
        case 'delivered':
          toast.success("Entrega concluida");
          break;
        case 'completed':
          toast.success("Operacao concluida");
          setActiveRide(null);
          break;
        case 'cancelled':
          toast.info("Corrida foi cancelada");
          setActiveRide(null);
          break;
        case 'expired':
          toast.error("Corrida expirou. Tente novamente.");
          setActiveRide(null);
          break;
      }
    },
  });

  // SSOT - Rating do passageiro
  const {
    data: passengerRating = 5.0,
    isLoading: isLoadingRating,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.passengerRating(user?.id),
    queryFn: async () => {
      if (!user) return 5.0;
      try {
        // Usar função SSOT
        return await getPassengerRating(user.id);
      } catch (error) {
        logger.error("useMobilidade.getPassengerRating", error as Error);
        return 5.0;
      }
    },
    enabled: !!user,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG, // Cache por 5 minutos
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
          logger.error("useMobilidade.createRide - profile not found", new Error("No profile"), { userId: user.id });
          toast.error("Perfil nao encontrado. Verifique seu cadastro.");
          throw new Error("Profile not found");
        }

        logger.info("useMobilidade.createRide - profile found", {
          profileId: passengerProfile.id,
          userId: user.id,
        });
        // PRICING AUTOMATICO - Calcular preco estimado oficial
        let suggestedPrice = rideData.suggested_price;
        
        // BLINDAGEM: Coordenadas obrigatorias para calculo oficial
        if (
          !isValidCoordinate(rideData.origin_lat) ||
          !isValidCoordinate(rideData.origin_lng) ||
          !isValidCoordinate(rideData.destination_lat) ||
          !isValidCoordinate(rideData.destination_lng)
        ) {
          toast.error("Coordenadas sao obrigatorias para calculo de preco. Selecione enderecos validos no mapa.");
          throw new Error("Coordinates required for official pricing calculation");
        }

        try {
          const { pricingService } = await import('@/core/pricing/instance');
          
          const priceEstimate = await pricingService.calculateEstimate({
            mode: rideData.type === 'entrega' ? 'delivery' : 'ride',
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
          logger.error("useMobilidade.createRide - OFFICIAL pricing failed", pricingError as Error);
          toast.error("Erro no calculo de preco. Tente novamente ou contate o suporte.");
          throw new Error("Official pricing calculation failed");
        }

        // Usar motor operacional com campos canônicos
        const normalizedSuggestedPrice =
          typeof suggestedPrice === "number" && Number.isFinite(suggestedPrice)
            ? suggestedPrice
            : undefined;

        const result = await RideOperationalService.createRide({
          passengerProfileId: passengerProfile.id,
          // Campos canônicos (obrigatórios no banco)
          pickupAddressId: rideData.pickup_address_id,
          dropoffAddressId: rideData.dropoff_address_id,
          pickupLocationId: rideData.pickup_location_id,
          dropoffLocationId: rideData.dropoff_location_id,
          // Campos complementares
          origin: rideData.origin,
          destination: rideData.destination,
          originLat: rideData.origin_lat,
          originLng: rideData.origin_lng,
          destinationLat: rideData.destination_lat,
          destinationLng: rideData.destination_lng,
          mode: rideData.type === 'entrega' ? 'delivery' : 'ride',
          suggestedPrice: normalizedSuggestedPrice, // Preco calculado automaticamente
          observation: rideData.observation,
          availableSeats: rideData.available_seats,
          paymentMethod: rideData.payment_method,
          departureTime: rideData.departure_time,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao criar corrida");
          throw new Error(result.error || "Failed to create ride");
        }

        // Buscar corrida criada
        const data = (await getRideById(result.rideId!)) as RideRequest | null;
        setActiveRide(data);
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id) });
        
        // Toast com preço calculado OFICIAL
        if (normalizedSuggestedPrice !== undefined) {
          toast.success(`Corrida solicitada! Preco oficial: ${formatBrl(normalizedSuggestedPrice)}`);
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
        logger.info("useMobilidade.cancelRide - iniciando", { rideId, userId: user?.id });
        
        if (!user) {
          toast.error("Usuario nao autenticado");
          return false;
        }

        // Buscar o perfil do usuário logado
        const userProfile = 
          (await profileService.getProfileByType(user.id, "personal")) ||
          (await profileService.getActiveProfile(user.id));

        if (!userProfile?.id) {
          logger.error("useMobilidade.cancelRide - perfil nao encontrado", new Error("No profile"), { userId: user.id });
          toast.error("Perfil nao encontrado");
          return false;
        }

        logger.info("useMobilidade.cancelRide - perfil do usuario", {
          userId: user.id,
          profileId: userProfile.id
        });
        
        // Buscar corrida para saber quem está cancelando
        const ride = (await getRideById(rideId)) as RideRequest | null;
        if (!ride) {
          logger.warn("useMobilidade.cancelRide - corrida nao encontrada", { rideId });
          toast.error("Corrida nao encontrada");
          return false;
        }

        logger.info("useMobilidade.cancelRide - corrida encontrada", { 
          rideId, 
          status: ride.status,
          passengerId: ride.passenger_profile_id,
          driverProfileId: ride.driver_profile_id,
          userProfileId: userProfile.id
        });

        const isPassenger = ride.passenger_profile_id === userProfile.id;
        const isDriver = ride.driver_profile_id === userProfile.id;

        if (!isPassenger && !isDriver) {
          logger.warn("useMobilidade.cancelRide - usuario nao autorizado", {
            rideId, 
            userProfileId: userProfile.id,
            passengerId: ride.passenger_profile_id,
            driverProfileId: ride.driver_profile_id
          });
          toast.error("Voce nao pode cancelar esta corrida");
          return false;
        }

        // Usar motor operacional
        logger.info("useMobilidade.cancelRide - chamando RideOperationalService", {
          rideId,
          cancelledBy: isPassenger ? 'passenger' : 'driver',
          profileId: userProfile.id
        });

        const result = await RideOperationalService.cancelRide({
          rideId,
          cancelledBy: isPassenger ? 'passenger' : 'driver',
          profileId: userProfile.id,
          reason,
        });

        if (!result.success) {
          logger.error("useMobilidade.cancelRide - falha no cancelamento", { 
            rideId, 
            error: result.error,
            fromState: result.fromState,
            toState: result.toState
          });
          
          // Mensagens de erro mais específicas
          let errorMessage = result.error || "Erro ao cancelar corrida";
          
          if (errorMessage.includes("Cannot cancel ride in state")) {
            errorMessage = `Nao e possivel cancelar a corrida no estado atual (${ride?.status})`;
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
          toState: result.toState
        });

        setActiveRide(null);
        // Invalidar queries com userId correto
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id) });
        toast.success("Corrida cancelada");
        return true;
      } catch (error) {
        logger.error("useMobilidade.cancelRide", error as Error, { rideId, userId: user?.id });
        toast.error("Erro ao cancelar corrida");
        return false;
      }
    },
    [user, queryClient],
  );

  const acceptRide = useCallback(
    async (rideId: string) => {
      try {
        if (!user) {
          toast.error("Usuario nao autenticado");
          return null;
        }

        const driverProfile = await profileService.getProfileByType(user.id, "driver");
        if (!driverProfile?.id) {
          toast.error("Perfil de motorista nao encontrado");
          return null;
        }

        // Usar motor operacional (dispatch service)
        const result = await RideDispatchService.acceptRide(rideId, driverProfile.id);

        if (!result.success) {
          if (result.reason === 'already_accepted') {
            toast.error("Esta corrida ja foi aceita por outro motorista");
          } else if (result.reason === 'invalid_state') {
            toast.error("Esta corrida nao esta disponivel para aceite");
          } else if (result.reason === 'driver_busy') {
            toast.error("Voce ja tem uma corrida ativa");
          } else if (result.reason === 'expired') {
            toast.error("Esta corrida expirou");
          } else {
            toast.error(result.error || "Erro ao aceitar corrida");
          }
          return null;
        }

        const data = (await getRideById(rideId)) as RideRequest | null;
        setActiveRide(data);
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id) });
        toast.success("Corrida aceita! Indo buscar passageiro...");
        return data;
      } catch (error) {
        logger.error("useMobilidade.acceptRide", error as Error);
        toast.error("Erro ao aceitar corrida");
        return null;
      }
    },
    [user, queryClient],
  );

  const completeRide = useCallback(
    async (rideId: string, finalPrice?: number) => {
      try {
        // CONTRATO OFICIAL: Confirmacao ou ajuste manual (sem recalculo automatico)
        let calculatedFinalPrice = finalPrice;
        
        if (!calculatedFinalPrice) {
          // Usar suggested_price como confirmação (não recalcular)
          const ride = (await getRideById(rideId)) as RideRequest | null;
          calculatedFinalPrice = ride?.suggested_price || 0;
          
          logger.info("useMobilidade.completeRide - confirming suggested price", { 
            rideId,
            suggestedPrice: ride?.suggested_price,
            finalPrice: calculatedFinalPrice,
          });
        } else {
          logger.info("useMobilidade.completeRide - manual adjustment", { 
            rideId,
            manualPrice: finalPrice,
            finalPrice: calculatedFinalPrice,
          });
        }

        // Usar motor operacional
        const result = await RideOperationalService.completeRide(
          rideId,
          user?.id || '',
          calculatedFinalPrice
        );

        if (!result.success) {
          toast.error(result.error || "Erro ao completar corrida");
          return;
        }

        setActiveRide(null);
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.activeRide(user.id) });
        
        // Toast com preço final oficial
        if (finalPrice) {
          toast.success(`Corrida completada! Valor ajustado: ${formatBrl(calculatedFinalPrice)}`);
        } else {
          toast.success(`Corrida completada! Valor confirmado: ${formatBrl(calculatedFinalPrice)}`);
        }
      } catch (error) {
        logger.error("useMobilidade.completeRide", error as Error);
        toast.error("Erro ao completar corrida");
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

        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.passengerRating(user.id) });
        toast.success("Avaliação enviada!");
        return { success: true };
      } catch (error) {
        logger.error("useMobilidade.rateRide", error as Error, { rideId, rating });
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

        queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.rides(user.id) });
        toast.success("Corrida confirmada!");
        return { success: true };
      } catch (error) {
        logger.error("useMobilidade.confirmRideCompletion", error as Error, { rideId });
        toast.error("Erro ao confirmar corrida");
        return { success: false };
      }
    },
    [user, queryClient],
  );

  const reportRideProblem = useCallback(
    async (rideId: string, description: string, reportType: string = "other", severity: string = "medium") => {
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
        } else {
          toast.error(result.error || "Erro ao reportar problema");
          return { success: false };
        }
      } catch (error) {
        logger.error("useMobilidade.reportRideProblem", error as Error, { rideId });
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
    acceptRide,
    completeRide,
    refetch,
    rateRide,
    confirmRideCompletion,
    reportRideProblem,
    myRides,
    error,
    pendingRides: rides.filter((r: RideRequest) => PENDING_RIDE_STATUSES.includes(r.status)),
    activeRides: rides.filter((r: RideRequest) =>
      ONGOING_RIDE_STATUSES.includes(r.status),
    ),
    // SSOT - Rating do passageiro
    passengerRating,
    isLoadingRating,
  };
}


