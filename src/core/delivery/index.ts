// @ts-nocheck
/**
 * Exports centralizados do módulo de entregas
 */

export { DeliveryService } from './DeliveryService';
export type {
  ServiceResult,
  DeliveryRequestStatus,
  DeliveryRequest,
  DeliveryStatusHistory,
  DeliveryTracking,
  DeliveryRequestWithHistory,
  AvailableDelivery,
  DeliveryStats,
} from './DeliveryService';

export { DeliveryAreaService } from './DeliveryAreaService';
export type {
  DeliveryArea,
  AreaType,
  CreateDeliveryAreaInput,
  UpdateDeliveryAreaInput,
} from './DeliveryAreaService';

// Re-export from modules/delivery for convenience
export { GastronomyOrderOriginAdapter } from '@/modules/delivery';
export { useOrderDelivery } from '@/modules/delivery';
export type {
  OrderRecord,
  OrderItemRecord,
  CreateOrderInput,
  OrderOperationResult,
} from '@/modules/delivery';
