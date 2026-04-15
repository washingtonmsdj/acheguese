/**
 * useMotoboy — Entrypoint público para módulos externos
 *
 * Empresas, gastronomia e serviços usam este hook para solicitar motoboy.
 * Não contém lógica própria — delega 100% para useDelivery.
 *
 * Uso:
 *   // Em módulo de gastronomia
 *   const motoboy = useMotoboy({ sourceType: 'gastronomy', sourceId: restaurantId });
 *   await motoboy.requestDelivery(data);
 *
 *   // Em módulo de empresas
 *   const motoboy = useMotoboy({ sourceType: 'business', sourceId: businessId });
 *
 *   // Por passageiro direto
 *   const motoboy = useMotoboy({ sourceType: 'passenger' });
 */

import { useDelivery, type CreateDeliveryData, type DeliveryProof } from "./useDelivery";
import type { SourceType } from "../constants";

interface UseMotoboyOptions {
  sourceType: SourceType;
  sourceId?: string;
}

export function useMotoboy({ sourceType, sourceId }: UseMotoboyOptions) {
  const delivery = useDelivery(sourceType, sourceId);

  return {
    // Estado
    activeDelivery: delivery.activeDelivery,
    deliveries: delivery.deliveries,
    isLoading: delivery.isLoading,
    isSubmitting: delivery.isSubmitting,

    // Ações — nomes semânticos para contexto externo
    requestDelivery: delivery.createDelivery,
    cancelDelivery: delivery.cancelDelivery,

    // Ações do motoboy (usadas no dashboard do motorista)
    confirmPickup: delivery.confirmPickup,
    startDelivery: delivery.startDelivery,
    confirmDelivery: delivery.confirmDelivery,
    failDelivery: delivery.failDelivery,

    refetch: delivery.refetch,
  };
}

// Re-exports para conveniência
export type { CreateDeliveryData, DeliveryProof };
