import { useCallback, useState, useMemo } from "react";
import { toast } from "sonner";
import { RIDE_STATUS, RIDE_MODE } from "../constants";
import { useDriverDashboardBase } from "./useDriverDashboardBase";
import { RideOperationalService } from "@/modules/mobility/core/RideOperationalService";
import { buildFailedDeliveryMetadata } from "@/modules/mobility/utils/failedDelivery";
import type { DeliveryProof } from "./useDelivery";

/**
 * Hook SSOT para painel de motoboy (entregas)
 *
 * Separação profissional entre motorista (corridas) e motoboy (entregas)
 * seguindo arquitetura limpa e SSOT.
 */
export function useMotoboyPage() {
  const baseHook = useDriverDashboardBase({
    queryScope: "motoboy",
    allowAdminBootstrap: true,
    activeStatuses: [
      RIDE_STATUS.DRIVER_ASSIGNED,
      RIDE_STATUS.DRIVER_ACCEPTED,
      RIDE_STATUS.DRIVER_ARRIVING,
      RIDE_STATUS.PICKUP_CONFIRMED,
      RIDE_STATUS.IN_DELIVERY,
    ],
    completedStatuses: [
      RIDE_STATUS.COMPLETED,
      RIDE_STATUS.DELIVERED,
    ],
  });

  const [deliveryActionsLoading, setDeliveryActionsLoading] = useState(false);
  const { refetch, currentDriverId } = baseHook;

  // Filtrar apenas entregas (ride_mode = 'motoboy')
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

  // ✅ Handlers reais — chamam RideOperationalService
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
      } else {
        toast.error("Erro ao iniciar rota de coleta");
      }
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
      } else {
        toast.error("Erro ao confirmar coleta");
      }
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
      } else {
        toast.error("Erro ao iniciar entrega");
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
      toast.error("Perfil de motorista não encontrado");
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
        toast.success("Entrega confirmada!");
        await refetch();
      } else {
        toast.error("Erro ao confirmar entrega");
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
      } else {
        toast.error("Erro ao registrar falha");
      }
    } finally {
      setDeliveryActionsLoading(false);
    }
  }, [refetch]);

  return {
    ...baseHook,
    actionsLoading: baseHook.actionsLoading || deliveryActionsLoading,
    // Dados filtrados para entregas
    activeDeliveries,
    availableDeliveries,
    completedDeliveries,
    deliveryCount,
    // Handlers reais
    handleGoToPickup,
    handleConfirmPickup,
    handleStartDelivery,
    handleConfirmDelivery,
    handleFailDelivery,
  };
}
