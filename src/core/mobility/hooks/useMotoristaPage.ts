import { useCallback, useState } from "react";
import { toast } from "sonner";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import {
  DRIVER_OWNED_OPEN_RIDE_STATUSES,
  QUERYABLE_CLOSED_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";
import { buildFailedDeliveryMetadata } from "@/core/mobility/utils/failedDelivery";
import { RIDE_MODE, RIDE_STATUS } from "@/core/mobility/constants";
import type { DeliveryProof } from "@/core/mobility/delivery/proof-of-delivery/types";
import { useDriverDashboardBase } from "./useDriverDashboardBase";

/**
 * Driver dashboard hook with passenger-ride and motoboy operations.
 *
 * Critical ride transitions are delegated to RideOperationalService; this hook
 * never mutates ride_requests directly and never treats UI state as authority.
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
    activeStatuses: [...DRIVER_OWNED_OPEN_RIDE_STATUSES],
    completedStatuses: [...QUERYABLE_CLOSED_RIDE_STATUSES],
  });
  const [passengerActionsLoading, setPassengerActionsLoading] = useState(false);
  const [deliveryActionsLoading, setDeliveryActionsLoading] = useState(false);
  const { refetch } = base;

  const activeDeliveries = base.acceptedByMe.filter(
    (ride: DashboardRide) => base.canAcceptDeliveryOffers && ride.ride_mode === RIDE_MODE.MOTOBOY,
  );
  const activeRides = base.acceptedByMe.filter(
    (ride: DashboardRide) => base.canAcceptRideOffers && ride.ride_mode !== RIDE_MODE.MOTOBOY,
  );

  const startPassengerPickupRoute = useCallback(async (rideId: string) => {
    const driverProfileId = base.currentDriverId;
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return false;
    }

    setPassengerActionsLoading(true);
    try {
      const result = await RideOperationalService.transitionTo(
        rideId,
        RIDE_STATUS.DRIVER_ARRIVING,
        driverProfileId,
        "Driver started passenger pickup route",
      );

      if (!result.success) {
        toast.error("Nao foi possivel iniciar o deslocamento", {
          description: "O estado da corrida mudou ou a operacao nao foi autorizada.",
        });
        return false;
      }

      await refetch();
      toast.success("Deslocamento para o passageiro iniciado");
      return true;
    } finally {
      setPassengerActionsLoading(false);
    }
  }, [base.currentDriverId, refetch]);

  const confirmPassengerBoarding = useCallback(async (
    rideId: string,
    pin?: string,
  ) => {
    const driverProfileId = base.currentDriverId;
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return false;
    }

    setPassengerActionsLoading(true);
    try {
      const result = await RideOperationalService.transitionTo(
        rideId,
        RIDE_STATUS.PASSENGER_BOARDED,
        driverProfileId,
        "Driver confirmed passenger boarding",
        pin,
      );

      if (!result.success) {
        const pinFailure = result.error?.toLowerCase().includes("pin");
        toast.error(
          pinFailure
            ? "PIN nao confirmado"
            : "Nao foi possivel confirmar o embarque",
          {
            description: pinFailure
              ? "Confira o codigo com o passageiro. As tentativas sao controladas pelo servidor."
              : "O estado da corrida mudou ou a operacao nao foi autorizada.",
          },
        );
        return false;
      }

      await refetch();
      toast.success("Passageiro embarcado confirmado");
      return true;
    } finally {
      setPassengerActionsLoading(false);
    }
  }, [base.currentDriverId, refetch]);

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
        return;
      }
      toast.error("Nao foi possivel iniciar o deslocamento para coleta", {
        description: result.error,
      });
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
        toast.success("Coleta confirmada");
        return;
      }
      toast.error("Nao foi possivel confirmar a coleta", {
        description: result.error,
      });
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
        toast.success("Entrega iniciada");
        return;
      }
      toast.error("Nao foi possivel iniciar a entrega", {
        description: result.error,
      });
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleConfirmDelivery = useCallback(async (
    rideId: string,
    driverProfileId: string,
    proof: DeliveryProof,
    finalPrice?: number,
    pin?: string,
  ): Promise<boolean> => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista nao encontrado");
      return false;
    }

    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.confirmDelivery(
        rideId,
        driverProfileId,
        proof,
        finalPrice,
        pin,
      );
      if (!result.success) {
        const lowerError = result.error?.toLowerCase() ?? "";
        const verificationFailure =
          lowerError.includes("pin") || lowerError.includes("verification");
        toast.error(
          verificationFailure
            ? "Entrega nao confirmada: verificacao de seguranca pendente"
            : "Nao foi possivel confirmar a entrega",
          { description: result.error },
        );
        return false;
      }

      await refetch();
      toast.success("Entrega concluida e encerrada");
      return true;
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
        toast.success("Falha registrada; custodia preservada para resolucao");
        return;
      }
      toast.error("Nao foi possivel registrar a falha", {
        description: result.error,
      });
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  return {
    ...base,
    actionsLoading:
      base.actionsLoading ||
      passengerActionsLoading ||
      deliveryActionsLoading,
    activeRides,
    activeDeliveries,
    startPassengerPickupRoute,
    confirmPassengerBoarding,
    handleGoToPickup,
    handleConfirmPickup,
    handleStartDelivery,
    handleConfirmDelivery,
    handleFailDelivery,
  };
}
