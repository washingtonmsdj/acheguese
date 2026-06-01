/**
 * Canonical cross-domain entrypoint for delivery UI/runtime adapters.
 */
export { CreateDeliveryModal } from '@/modules/mobility/components/CreateDeliveryModal';
export { useDelivery } from '@/modules/mobility/hooks/useDelivery';
export type {
  CreateDeliveryData,
  DeliveryProof,
} from '@/modules/mobility/hooks/useDelivery';
export { RideOperationalService } from '@/core/mobility/core/RideOperationalService';
