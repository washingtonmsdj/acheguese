import { useCallback, useState, useMemo } from "react";
import { toast } from "sonner";
import { RIDE_STATUS, RIDE_MODE } from "@/core/mobility/constants";
import {
  DRIVER_OWNED_OPEN_RIDE_STATUSES,
  QUERYABLE_CLOSED_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";
import { useDriverDashboardBase } from "./useDriverDashboardBase";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import { buildFailedDeliveryMetadata } from "@/modules/mobility/utils/failedDelivery";
import type { DeliveryProof } from "./useDelivery";

/**
 * Hook SSOT para painel de motoboy (entregas).
 */
export function useMotoboyPage() {
  const baseHook = useDriverDashboardBase({
    queryScope: "motoboy",
    allowAdminBootstrap: true,
    activeStatuses: [...DRIVER_OWNED_OPEN_RIDE_STATUSES],
    completedStatuses: [...QUERYABLE_CLOSED_RIDE_STATUSES],
  });

  const [deliveryActionsLoading, setDeliveryActionsLoading] = useState(false);
  const { refetch } = baseHook;

  const activeDeliveries = useMemo(() => {
    return baseHook.acceptedByMe.filter(
      (ride) => ride.ride_mode === RIDE_MODE.MOTOBOY || ride.type === "entrega"
    );
  }, [baseHook.acceptedByMe]);

  const availableDeliveries = useMemo(() => {
    return baseHook.availableRides.filter(
      (ride) => ride.ride_mode === RIDE_MODE.MOTOBOY || ride.type === "entrega"
    );
  }, [baseHook.availableRides]);

  const completedDeliveries = useMemo(() => {
    return baseHook.completedByMe.filter(
      (ride) => ride.ride_mode === RIDE_MODE.MOTOBOY || ride.type === "entrega"
    );
  }, [baseHook.completedByMe]);

  const deliveryCount = useMemo(() => {
    return activeDeliveries.length + availableDeliveries.length;
  }, [activeDeliveries.length, availableDeliveries.length]);

  const handleGoToPickup = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista não encontrado");
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
      toast.error("Erro ao iniciar rota de coleta", { description: result.error });
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleConfirmPickup = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista não encontrado");
      return;
    }
    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.confirmPickup(rideId, driverProfileId);
      if (result.success) {
        toast.success("Coleta confirmada!");
        await refetch();
        return;
      }
      toast.error("Erro ao confirmar coleta", { description: result.error });
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  const handleStartDelivery = useCallback(async (rideId: string, driverProfileId: string) => {
    if (!driverProfileId) {
      toast.error("Perfil de motorista não encontrado");
      return;
    }
    setDeliveryActionsLoading(true);
    try {
      const result = await RideOperationalService.startDelivery(rideId, driverProfileId);
      if (result.success) {
        toast.success("Entrega iniciada!");
        await refetch();
        return;
      }
      toast.error("Erro ao iniciar entrega", { description: result.error });
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
      toast.error("Perfil de motorista não encontrado");
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
            ? "Entrega não confirmada: verificação de segurança pendente"
            : "Erro ao confirmar entrega",
          { description: result.error },
        );
        return false;
      }

      toast.success("Entrega concluída e encerrada!");
      await refetch();
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
      toast.error("Perfil de motorista não encontrado");
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
        toast.info("Falha na entrega registrada");
        await refetch();
        return;
      }
      toast.error("Erro ao registrar falha", { description: result.error });
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  return {
    ...baseHook,
    actionsLoading: baseHook.actionsLoading || deliveryActionsLoading,
    activeDeliveries,
    availableDeliveries,
    completedDeliveries,
    deliveryCount,
    handleGoToPickup,
    handleConfirmPickup,
    handleStartDelivery,
    handleConfirmDelivery,
    handleFailDelivery,
  };
}
