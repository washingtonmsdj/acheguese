import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { profileService } from "@/core/profiles/services/ProfileService";
import { useDriverOperationalStatus } from "@/core/mobility/hooks/useDriverOperationalStatus";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { useMobilityUrls } from "@/core/mobility/hooks/useMobilityUrls";
import { useRideRealtime } from "@/core/mobility/hooks/useRideRealtime";
import {
  getRideDispatchContextById,
  getRidesByDriverProfile,
} from "@/core/mobility/services/mobility.queries";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { RIDE_STATE } from "@/core/mobility/core/RideStateMachine";
import { logger } from "@/shared/utils/logger";
import { RIDE_STATUS, TIMEOUTS } from "@/core/mobility/constants";
import { RideRatingService } from "@/core/mobility/services/RideRatingService";

interface MobilityRide {
  id: string;
  status: string;
  type?: string;
  ride_mode?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  final_price?: number | null;
  actual_fare?: number | null;
  price?: number | null;
  suggested_price?: number | null;
  passenger?: {
    name?: string;
    rating?: number | null;
  };
  [key: string]: unknown;
}

type OfferModeFilter = "all" | "ride" | "motoboy";

interface UseDriverDashboardBaseOptions {
  queryScope: string;
  activeStatuses: string[];
  completedStatuses: string[];
  allowAdminBootstrap?: boolean;
}

function getRideReferenceDate(ride: MobilityRide): Date | null {
  const rawDate = ride.completed_at ?? ride.updated_at ?? ride.created_at ?? null;
  if (!rawDate) {
    return null;
  }

  const parsedDate = new Date(rawDate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getRideAmount(ride: MobilityRide): number {
  const value =
    ride.final_price ??
    ride.actual_fare ??
    ride.price ??
    ride.suggested_price ??
    0;

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sumRideAmounts(
  rides: MobilityRide[],
  predicate?: (rideDate: Date) => boolean,
): number {
  return rides.reduce((total, ride) => {
    const rideDate = getRideReferenceDate(ride);
    if (predicate && (!rideDate || !predicate(rideDate))) {
      return total;
    }

    return total + getRideAmount(ride);
  }, 0);
}

function isPayableRide(ride: MobilityRide): boolean {
  return ride.status === RIDE_STATUS.COMPLETED || ride.status === RIDE_STATUS.DELIVERED;
}

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function useDriverDashboardBase({
  queryScope,
  activeStatuses,
  completedStatuses,
  allowAdminBootstrap = false,
}: UseDriverDashboardBaseOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mobilityUrls = useMobilityUrls();
  const { isAdmin } = useIsAdmin();

  const [activeTab, setActiveTab] = useState("corridas");
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isDriverOverride, setIsDriverOverride] = useState<boolean | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [ratePassengerOpen, setRatePassengerOpen] = useState(false);
  const [rideToComplete, setRideToComplete] = useState<MobilityRide | null>(null);
  const [rideToCancel, setRideToCancel] = useState<MobilityRide | null>(null);
  const [rideToRate, setRideToRate] = useState<MobilityRide | null>(null);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [offerModeFilter, setOfferModeFilter] = useState<OfferModeFilter>("all");

  const {
    user,
    driverData,
    driverProfileId,
    isRegistered,
    isLoading: isLoadingDriverData,
    error: driverIdentityError,
    refetch: refetchDriverIdentity,
  } = useDriverProfileIdentity({
    allowAdminBootstrap,
    queryScope,
  });

  const capabilityData = (driverData as { can_do_delivery?: boolean | null; can_do_rides?: boolean | null } | null);
  const canAcceptDeliveryOffers = capabilityData?.can_do_delivery === true;
  const canAcceptRideOffers = capabilityData?.can_do_rides !== false;

  const driverProfileQuery = useQuery({
    queryKey: ["driver-dashboard", queryScope, "profile", driverProfileId ?? null],
    queryFn: async () => {
      if (!driverProfileId) {
        return null;
      }

      return profileService.getAccessibleProfileById(driverProfileId);
    },
    enabled: !!driverProfileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });

  const ridesQuery = useQuery({
    queryKey: [
      "driver-dashboard",
      queryScope,
      "rides",
      driverProfileId ?? user?.id ?? null,
    ],
    queryFn: async (): Promise<MobilityRide[]> => {
      if (!user) {
        return [];
      }

      const identifier = driverProfileId ?? user.id;
      return (await getRidesByDriverProfile(identifier)) as MobilityRide[];
    },
    enabled: !!user && (isAdmin || !!driverProfileId),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });

  // GATE: Usar MobilityOfferService ao inves de getAvailableRides generico
  const availableRidesQuery = useQuery({
    queryKey: [
      "driver-dashboard",
      queryScope,
      "available-offers",
      driverProfileId,
      canAcceptRideOffers,
      canAcceptDeliveryOffers,
    ],
    queryFn: async (): Promise<MobilityRide[]> => {
      if (!driverProfileId) return [];
      if (!canAcceptRideOffers && !canAcceptDeliveryOffers) return [];

      const { MobilityOfferService } = await import('@/core/mobility/services/MobilityOfferService');
      const rides: MobilityRide[] = [];

      if (canAcceptRideOffers) {
        const exclusiveOffer = await MobilityOfferService.getExclusiveOffer(driverProfileId);
        if (exclusiveOffer) {
          rides.push({
            id: exclusiveOffer.rideId,
            origin: exclusiveOffer.originNeighborhood,
            destination: exclusiveOffer.destinationNeighborhood,
            suggested_price: exclusiveOffer.suggestedPrice,
            payment_method: exclusiveOffer.paymentMethod,
            status: "driver_assigned",
            type: "viagem",
            ride_mode: "ride",
            created_at: exclusiveOffer.offeredAt,
            passenger: {
              name: "Passageiro",
              rating: exclusiveOffer.passengerRating,
            },
            driver_trust_risk_level: exclusiveOffer.driverTrustRiskLevel,
            driver_dispatch_policy: exclusiveOffer.driverDispatchPolicy,
            passenger_trust_risk_level: exclusiveOffer.passengerTrustRiskLevel,
            passenger_dispatch_policy: exclusiveOffer.passengerDispatchPolicy,
          });
        }
      }

      if (canAcceptDeliveryOffers) {
        const openOffers = await MobilityOfferService.getOpenBoardOffers(
          driverProfileId,
          undefined,
          { sortBy: "priority", order: "desc" },
          10,
        );
        for (const offer of openOffers) {
          rides.push({
            id: offer.rideId,
            origin: offer.origin,
            destination: offer.destination,
            origin_lat: offer.originLat,
            origin_lng: offer.originLng,
            destination_lat: offer.destinationLat,
            destination_lng: offer.destinationLng,
            suggested_price: offer.suggestedPrice,
            payment_method: offer.paymentMethod,
            status: "searching_driver",
            type: "entrega",
            ride_mode: "motoboy",
            created_at: offer.createdAt,
            package_size: offer.packageSize,
            package_description: offer.packageDescription,
            priority: offer.priority,
            trust_adjusted_priority: offer.trustAdjustedPriority,
            driver_trust_risk_level: offer.driverTrustRiskLevel,
            driver_dispatch_policy: offer.driverDispatchPolicy,
            customer_trust_risk_level: offer.customerTrustRiskLevel,
            customer_dispatch_policy: offer.customerDispatchPolicy,
          });
        }
      }

      return rides;
    },
    enabled: !!user && (isAdmin || !!driverProfileId),
    staleTime: TIMEOUTS.CACHE_STALE_TIME_SHORT,
    refetchInterval: 5000,
  });

  const isDeliveryOffer = useCallback((ride: MobilityRide): boolean => {
    return ride.ride_mode === "motoboy" || ride.type === "entrega";
  }, []);

  const filterOffersByCapability = useCallback((ridesToFilter: MobilityRide[]): MobilityRide[] => {
    return ridesToFilter.filter((ride) => {
      if (isDeliveryOffer(ride)) {
        return canAcceptDeliveryOffers;
      }

      return canAcceptRideOffers;
    });
  }, [canAcceptDeliveryOffers, canAcceptRideOffers, isDeliveryOffer]);

  const filterOffersByMode = useCallback((ridesToFilter: MobilityRide[]): MobilityRide[] => {
    if (offerModeFilter === "all") {
      return ridesToFilter;
    }

    return ridesToFilter.filter((ride) =>
      offerModeFilter === "motoboy" ? isDeliveryOffer(ride) : !isDeliveryOffer(ride),
    );
  }, [isDeliveryOffer, offerModeFilter]);

  useEffect(() => {
    if (!canAcceptRideOffers && canAcceptDeliveryOffers) {
      setOfferModeFilter("motoboy");
      return;
    }

    if (canAcceptRideOffers && !canAcceptDeliveryOffers) {
      setOfferModeFilter("ride");
      return;
    }

    if (!canAcceptRideOffers && !canAcceptDeliveryOffers) {
      setOfferModeFilter("all");
    }
  }, [canAcceptDeliveryOffers, canAcceptRideOffers]);

  const refetchDashboard = useCallback(async () => {
    await Promise.all([
      refetchDriverIdentity(),
      driverProfileQuery.refetch(),
      ridesQuery.refetch(),
      availableRidesQuery.refetch(),
    ]);
  }, [availableRidesQuery, driverProfileQuery, refetchDriverIdentity, ridesQuery]);

  useRideRealtime({
    userType: "driver",
    userId: driverProfileId ?? user?.id,
    enabled: !!user && (isAdmin || !!driverProfileId),
    onEvent: (event) => {
      logger.info("useDriverDashboardBase - realtime event", {
        queryScope,
        event,
      });

      queryClient.invalidateQueries({
        queryKey: ["driver-dashboard", queryScope],
      });

      switch (event.type) {
        case "driver_assigned":
          if (event.driverProfileId === driverProfileId) {
            toast.success("Nova corrida disponivel! Verifique suas ofertas.");
          }
          break;
        case "driver_accepted":
          if (event.driverProfileId === driverProfileId) {
            toast.success("Corrida aceita! Indo buscar passageiro...");
          }
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
          toast.success("Operacao finalizada");
          break;
        case "cancelled":
          toast.info("Corrida foi cancelada");
          break;
        case "expired":
          toast.info("Oferta de corrida expirou");
          break;
      }
    },
  });

  const operationalStatus = useDriverOperationalStatus({
    driverProfileId,
    isOnline: driverData?.is_online ?? false,
    isAvailable: driverData?.is_available ?? false,
    onStatusChanged: refetchDashboard,
  });

  const rides = ridesQuery.data ?? [];
  const rawAvailableRides = availableRidesQuery.data ?? [];
  const capabilityFilteredOffers = filterOffersByCapability(rawAvailableRides);
  const availableRides = filterOffersByMode(capabilityFilteredOffers);
  const acceptedByMe = rides.filter((ride) => activeStatuses.includes(ride.status));
  const completedByMe = rides.filter((ride) => completedStatuses.includes(ride.status));
  const payableCompletedByMe = completedByMe.filter(isPayableRide);
  const inProgressCount = acceptedByMe.length;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const driverEarnings = {
    today: sumRideAmounts(payableCompletedByMe, (rideDate) => rideDate >= startOfToday),
    week: sumRideAmounts(payableCompletedByMe, (rideDate) => rideDate >= startOfWeek),
    month: sumRideAmounts(
      payableCompletedByMe,
      (rideDate) =>
        rideDate.getMonth() === now.getMonth() &&
        rideDate.getFullYear() === now.getFullYear(),
    ),
    total: sumRideAmounts(payableCompletedByMe),
  };

  const driverStats = {
    avgRating: driverData?.rating ?? 5.0,
    totalRides: driverData?.total_rides ?? completedByMe.length,
    acceptanceRate: driverData?.acceptance_rate ?? 100,
    completedRides: driverData?.total_rides_completed ?? payableCompletedByMe.length,
    cancelledRides:
      driverData?.total_rides_cancelled ??
      rides.filter((ride) => ride.status === RIDE_STATUS.CANCELLED).length,
    onlineHoursToday: 0,
  };

  const handleGoBack = useCallback(
    () => navigate(mobilityUrls.home),
    [mobilityUrls, navigate],
  );

  const acceptRide = useCallback(
    async (rideId: string) => {
      if (!driverProfileId) {
        toast.error("Perfil de motorista nao encontrado");
        return;
      }

      setActionsLoading(true);
      try {
        // Importar dinamicamente
        const { MobilityOfferService } = await import('@/core/mobility/services/MobilityOfferService');
        const { MobilityDispatchConfigService } = await import('@/core/mobility/services/MobilityDispatchConfigService');

        // Buscar dados da corrida para determinar estrategia.
        const rideData = await getRideDispatchContextById(rideId);

        if (!rideData) {
          toast.error("Corrida nao encontrada");
          return;
        }

        if (rideData.ride_mode === "motoboy" && !canAcceptDeliveryOffers) {
          toast.error("Perfil sem permissao para entregas");
          return;
        }

        if (rideData.ride_mode !== "motoboy" && !canAcceptRideOffers) {
          toast.error("Perfil sem permissao para corridas");
          return;
        }

        // Determinar estrategia.
        const context = MobilityDispatchConfigService.createContext(rideData);
        const strategy = MobilityDispatchConfigService.determineStrategy(context);

        // Aceitar oferta
        const result = await MobilityOfferService.acceptOffer(rideId, driverProfileId, strategy);

        if (!result.success) {
          switch (result.reason) {
            case 'already_accepted':
              toast.error("Esta corrida ja foi aceita por outro motorista");
              break;
            case 'expired':
              toast.error("Esta oferta expirou");
              break;
            case 'driver_busy':
              toast.error("Voce ja tem uma corrida ativa");
              break;
            case 'not_eligible':
              toast.error(`Nao elegivel: ${result.error}`);
              break;
            default:
              toast.error("Erro ao aceitar corrida");
          }
          return;
        }

        await refetchDashboard();
        toast.success("Corrida aceita!");
      } catch (error) {
        logger.error("Error accepting ride", error as Error);
        toast.error("Erro ao aceitar corrida");
      } finally {
        setActionsLoading(false);
      }
    },
    [canAcceptDeliveryOffers, canAcceptRideOffers, driverProfileId, refetchDashboard],
  );

  const startRide = useCallback(
    async (rideId: string) => {
      if (!driverProfileId) {
        toast.error("Perfil de motorista nao encontrado");
        return;
      }

      setActionsLoading(true);
      try {
        const result = await RideOperationalService.transitionTo(
          rideId,
          RIDE_STATE.IN_PROGRESS,
          driverProfileId,
          "Driver started ride",
        );
        if (!result.success) {
          throw new Error(result.error || "Ride start was not applied");
        }

        await refetchDashboard();
        toast.success("Corrida iniciada!");
      } catch (error) {
        logger.error("useDriverDashboardBase.startRide", error as Error, { rideId, driverProfileId });
        toast.error("Erro ao iniciar corrida");
      } finally {
        setActionsLoading(false);
      }
    },
    [driverProfileId, refetchDashboard],
  );

  const handleOpenCompleteDialog = useCallback((ride: MobilityRide) => {
    setRideToComplete(ride);
    setCompleteDialogOpen(true);
  }, []);

  const handleOpenCancelDialog = useCallback((ride: MobilityRide) => {
    setRideToCancel(ride);
    setCancelDialogOpen(true);
  }, []);

  const handleCompleteRide = useCallback(async () => {
    if (!rideToComplete || !driverProfileId) {
      if (!driverProfileId) {
        toast.error("Perfil de motorista nao encontrado");
      }
      return;
    }

    setActionsLoading(true);
    try {
      const result = await RideOperationalService.completeRide(
        rideToComplete.id,
        driverProfileId,
      );
      if (!result.success) {
        throw new Error(result.error || "Ride completion was not applied");
      }

      setCompleteDialogOpen(false);
      setRideToRate(rideToComplete);
      setRatePassengerOpen(true);
      await refetchDashboard();
      toast.success("Corrida finalizada!");
    } catch (error) {
      logger.error("useDriverDashboardBase.completeRide", error as Error, {
        rideId: rideToComplete.id,
        driverProfileId,
      });
      toast.error("Erro ao finalizar");
    } finally {
      setActionsLoading(false);
    }
  }, [driverProfileId, refetchDashboard, rideToComplete]);

  const handleCancelRide = useCallback(async (reason: string) => {
    if (!rideToCancel || !driverProfileId) {
      if (!driverProfileId) {
        toast.error("Perfil de motorista nao encontrado");
      }
      return;
    }

    setActionsLoading(true);
    try {
      const result = await RideOperationalService.cancelRide({
        rideId: rideToCancel.id,
        cancelledBy: "driver",
        profileId: driverProfileId,
        reason,
      });
      if (!result.success) {
        throw new Error(result.error || "Ride cancellation was not applied");
      }

      setCancelDialogOpen(false);
      await refetchDashboard();
      toast.success("Corrida cancelada");
    } catch (error) {
      logger.error("useDriverDashboardBase.cancelRide", error as Error, {
        rideId: rideToCancel.id,
        driverProfileId,
      });
      toast.error("Erro ao cancelar");
    } finally {
      setActionsLoading(false);
    }
  }, [driverProfileId, refetchDashboard, rideToCancel]);

  const handleRatePassenger = useCallback(
    async (ratingPayload: unknown) => {
      if (!rideToRate?.id || !driverProfileId) {
        setRatePassengerOpen(false);
        return;
      }

      const typedPayload = ratingPayload as {
        rating?: number;
        behavior_rating?: number;
        punctuality_rating?: number;
        payment_rating?: number;
        comment?: string;
      };

      const rating = clampRating(typedPayload?.rating ?? 5);
      const behavior = clampRating(typedPayload?.behavior_rating ?? rating);
      const punctuality = clampRating(typedPayload?.punctuality_rating ?? rating);
      const payment = clampRating(typedPayload?.payment_rating ?? rating);
      const comment = (typedPayload?.comment || "").trim();
      try {
        await RideRatingService.upsert({
          rideId: rideToRate.id,
          rating,
          comment: comment || null,
          behaviorRating: behavior,
          punctualityRating: punctuality,
          paymentRating: payment,
        });

        toast.success("Avaliacao enviada!");
        setRatePassengerOpen(false);
      } catch (error) {
        logger.error("useDriverDashboardBase.handleRatePassenger", error as Error, {
          rideId: rideToRate.id,
          driverProfileId,
        });
        toast.error("Nao foi possivel enviar a avaliacao.");
      }
    },
    [driverProfileId, rideToRate],
  );

  return {
    user,
    driverData,
    driverProfileId,
    rides,
    availableRides,
    offerModeFilter,
    setOfferModeFilter,
    canAcceptRideOffers,
    canAcceptDeliveryOffers,
    acceptedByMe,
    completedByMe,
    driverEarnings,
    driverStats,
    inProgressCount,
    isLoading: isLoadingDriverData,
    loading:
      isLoadingDriverData ||
      driverProfileQuery.isLoading ||
      ridesQuery.isLoading ||
      availableRidesQuery.isLoading,
    isLoadingDriverId: isLoadingDriverData || driverProfileQuery.isLoading,
    error:
      driverIdentityError ??
      driverProfileQuery.error ??
      ridesQuery.error ??
      availableRidesQuery.error,
    refetch: refetchDashboard,
    isRegistered,
    isSuspended: Boolean(driverProfileQuery.data?.is_suspended),
    isDriver: isAdmin || (isDriverOverride !== null ? isDriverOverride : isRegistered),
    setIsDriver: setIsDriverOverride,
    isRegOpen,
    setIsRegOpen,
    activeTab,
    setActiveTab,
    currentDriverId: driverProfileId,
    gpsError: operationalStatus.gpsError,
    clearGpsError: operationalStatus.clearGpsError,
    isDriverOnline: operationalStatus.isDriverOnline,
    isTracking: operationalStatus.isTracking,
    isUpdatingStatus: operationalStatus.isUpdatingStatus,
    handleGoBack,
    toggleDriverOnline: operationalStatus.toggleDriverOnline,
    toggleTracking: operationalStatus.toggleTracking,
    acceptRide,
    startRide,
    completeDialogOpen,
    setCompleteDialogOpen,
    rideToComplete,
    handleOpenCompleteDialog,
    handleCompleteRide,
    cancelDialogOpen,
    setCancelDialogOpen,
    rideToCancel,
    handleOpenCancelDialog,
    handleCancelRide,
    ratePassengerOpen,
    setRatePassengerOpen,
    rideToRate,
    handleRatePassenger,
    actionsLoading,
  };
}