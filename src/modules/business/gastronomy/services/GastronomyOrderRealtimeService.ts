import { supabase } from "@/core/infrastructure/supabase";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeChannelStatus = string;

export class GastronomyOrderRealtimeService {
  static subscribeOrderDetails(
    orderId: string,
    onInvalidate: () => void,
    onStatusChange?: (status: RealtimeChannelStatus) => void,
  ): RealtimeChannel {
    return supabase
      .channel(`gastronomy-order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        onInvalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_timeline_events",
          filter: `order_id=eq.${orderId}`,
        },
        onInvalidate,
      )
      .subscribe((status) => {
        onStatusChange?.(status);
      });
  }

  static subscribeBusinessOrders(
    businessId: string,
    onInvalidateOrders: () => void,
    onTimelineInsert: (payload: RealtimePostgresChangesPayload<{ order_id?: string | null }>) => void,
    onStatusChange?: (status: RealtimeChannelStatus) => void,
  ): RealtimeChannel {
    return supabase
      .channel(`gastronomy-orders:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `source_id=eq.${businessId}`,
        },
        onInvalidateOrders,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_timeline_events",
        },
        onTimelineInsert,
      )
      .subscribe((status) => {
        onStatusChange?.(status);
      });
  }

  static subscribeOrderTracking(
    orderId: string,
    onRideRequestChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  ): RealtimeChannel {
    return supabase
      .channel(`order-tracking:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_requests",
          filter: `source_id=eq.${orderId}`,
        },
        onRideRequestChange,
      )
      .subscribe();
  }

  static async orderBelongsToBusiness(orderId: string, businessId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("source_id", businessId)
      .maybeSingle();

    return !error && !!data?.id;
  }

  static async removeChannel(channel: RealtimeChannel): Promise<void> {
    await supabase.removeChannel(channel);
  }
}





