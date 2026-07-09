import { useCallback, useState } from "react";
import { toast } from "sonner";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { buildFailedDeliveryMetadata } from "@/core/mobility/utils/failedDelivery";
import { RIDE_MODE, RIDE_STATUS } from "@/core/mobility/constants";
import type { DeliveryProof } from "@/core/mobility/delivery/proof-of-delivery/types";
import { useDriverDashboardBase } from "./useDriverDashboardBase";

/**
 * Driver dashboard hook with motoboy operations
 */
interface DashboardRide {
  id: string;
  status: string;
  ride_mode?: string | null;
  [key: string]: unknown;
}

export function useMotoristaPage() {
  const base = useDriverDashboardBase({
    queryScope: "motorista",
    activeStatuses: [
      RIDE_STATUS.DRIVER_ASSIGNED,
      RIDE_STATUS.DRIVER_ON_THE_WAY,
      RIDE_STATUS.DRIVER_ARRIVED,
      RIDE_STATUS.PASSENGER_ON_BOARD,
      RIDE_STATUS.IN_PROGRESS,
      RIDE_STATUS.PICKUP_CONFIRMED,
      RIDE_STATUS.IN_DELIVERY,
    ],
    completedStatuses: [
      RIDE_STATUS.COMPLETED,
      RIDE_STATUS.DELIVERED,
      RIDE_STATUS.FAILED_DELIVERY,
    ],
  });
  const [deliveryActionsLoading, setDeliveryActionsLoading] = useState(false);
  const { refetch } = base;

  const activeDeliveries = base.acceptedByMe.filter(
    (ride: DashboardRide) => base.canAcceptDeliveryOffers && ride.ride_mode === RIDE_MODE.MOTOBOY,
  );
  const activeRides = base.acceptedByMe.filter(
    (ride: DashboardRide) => base.canAcceptRideOffers && ride.ride_mode !== RIDE_MODE.MOTOBOY,
  );

  const handleGoToPickup = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.transitionTo(
        rideId,
        RIDE_STATUS.DRIVER_ARRIVING,
        driverProfileId,
        "Driver started pickup route",
      );
      if (result.success) {
        await refetch();
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleConfirmPickup = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.confirmPickup(rideId, driverProfileId);
      if (result.success) {
        await refetch();
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleStartDelivery = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.startDelivery(rideId, driverProfileId);
      if (result.success) {
        await refetch();
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleConfirmDelivery = useCallback(async (
    rideId: string,
    driverProfileId: string,
    proof: DeliveryProof,
    finalPrice?: number,
  ) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.confirmDelivery(
        rideId,
        driverProfileId,
        proof,
        finalPrice,
      );
      if (result.success) {
        await refetch();
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleFailDelivery = useCallback(async (
    rideId: string,
    driverProfileId: string,
    reason: string,
  ) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return;
    }

    setDeliveryActionsLoading(true);
    try {
      const metadata = buildFailedDeliveryMetadata(reason);
      const result = await RideOperationalService.failDelivery(
        rideId,
        driverProfileId,
        metadata,
      );
      if (result.success) {
        await refetch();
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  return {
    ...base,
    actionsLoading: base.actionsLoading || deliveryActionsLoading,
    activeRides,
    activeDeliveries,
    handleGoToPickup,
    handleConfirmPickup,
    handleStartDelivery,
    handleConfirmDelivery,
    handleFailDelivery,
  };
}
