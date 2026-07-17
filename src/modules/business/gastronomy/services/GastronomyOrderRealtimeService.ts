import type { RealtimePostgresChangesPayload } from "@/integrations/supabase";
import {
  realtimeService,
  type RealtimeConnectionStatus,
  type RealtimeSubscription,
} from "@/core/realtime";

export type GastronomyOrderRealtimePayload<
  TRow extends Record<string, unknown> = Record<string, unknown>,
> = RealtimePostgresChangesPayload<TRow>;

export class GastronomyOrderRealtimeService {
  static subscribeOrderDetails(
    orderId: string,
    onInvalidate: () => void,
    onStatusChange?: (status: RealtimeConnectionStatus) => void,
  ): RealtimeSubscription {
    return realtimeService.subscribe("gastronomy.order-details", {
      filterValues: { orderId },
      onEvent: onInvalidate,
      onStatusChange,
    });
  }

  static subscribeBusinessOrders(
    businessId: string,
    onInvalidateOrders: () => void,
    onStatusChange?: (status: RealtimeConnectionStatus) => void,
  ): RealtimeSubscription {
    return realtimeService.subscribe("gastronomy.business-orders", {
      filterValues: { businessId },
      onEvent: onInvalidateOrders,
      onStatusChange,
    });
  }

  static subscribeOrderTracking(
    orderId: string,
    onRideRequestChange: (payload: GastronomyOrderRealtimePayload<Record<string, unknown>>) => void,
  ): RealtimeSubscription {
    return realtimeService.subscribe("gastronomy.order-tracking", {
      filterValues: { orderId },
      onEvent: ({ payload }) => onRideRequestChange(payload),
    });
  }

  static removeChannel(subscription: RealtimeSubscription): void {
    subscription.unsubscribe();
  }
}





