/**
 * AnalyticsService - canonical analytics SSOT
 *
 * Centralizes analytics event tracking and metric reads.
 * Hooks and components should consume this service instead of querying Supabase directly.
 */
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { secureRandomString } from "@/shared/utils/secureRandom";

type ErrorLike = {
  message?: string | null;
};

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike | null;
};

type RpcPayload<TValue> = {
  data: TValue | null;
  error: ErrorLike | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  eq(column: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: string): TableClient<TRow>;
  lte(column: string, value: string): TableClient<TRow>;
  order(column: string, options?: { ascending?: boolean }): TableClient<TRow>;
  select(columns?: string): TableClient<TRow>;
};

type AnalyticsDbClient = {
  from<TRow>(table: string): TableClient<TRow>;
  rpc<TValue>(fn: string, params?: Record<string, unknown>): Promise<RpcPayload<TValue>>;
};

type AnalyticsMetadata = Record<string, unknown>;

type AnalyticsDailyMetricsRow = {
  date: string;
  orders_completed: number;
  qr_scans: number;
  total_order_value: number;
  total_views: number;
  unique_views: number;
};

const analyticsDb = supabase as unknown as AnalyticsDbClient;

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type AnalyticsEventType =
  | "qr_scan"
  | "page_view"
  | "business_interaction"
  | "menu_view"
  | "item_view"
  | "order_started"
  | "order_completed"
  | "order_cancelled"
  | "delivery_requested"
  | "delivery_completed"
  | "click_phone"
  | "click_whatsapp"
  | "click_directions"
  | "share"
  | "favorite_added"
  | "favorite_removed"
  | "structured_vaga_click_search"
  | "structured_vaga_open_search";

export type AnalyticsEventSource =
  | "web"
  | "mobile"
  | "qr_code"
  | "direct_link"
  | "search"
  | "social_media"
  | "other";

export interface AnalyticsEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: AnalyticsEventType;
  event_source: AnalyticsEventSource;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  metadata: AnalyticsMetadata;
  created_at: string;
}

export interface AnalyticsMetrics {
  total_views: number;
  unique_views: number;
  qr_scans: number;
  unique_qr_scans: number;
  orders_started: number;
  orders_completed: number;
  orders_cancelled: number;
  total_order_value: number;
  deliveries_requested: number;
  deliveries_completed: number;
  total_delivery_fees: number;
  clicks_phone: number;
  clicks_whatsapp: number;
  clicks_directions: number;
  shares: number;
  favorites_added: number;
  favorites_removed: number;
  conversion_rate: number;
}

export interface DailyMetrics {
  date: string;
  total_views: number;
  unique_views: number;
  qr_scans: number;
  orders_completed: number;
  total_order_value: number;
}

export const AnalyticsService = {
  async trackEvent(input: {
    entity_type: string;
    entity_id: string;
    event_type: AnalyticsEventType;
    event_source?: AnalyticsEventSource;
    user_id?: string;
    session_id?: string;
    metadata?: AnalyticsMetadata;
  }): Promise<ServiceResult<string>> {
    try {
      const sessionId = input.session_id || this.getSessionId() || null;
      const { data, error } = await analyticsDb.rpc<string>("track_analytics_event", {
        p_entity_type: input.entity_type,
        p_entity_id: input.entity_id,
        p_event_type: input.event_type,
        p_event_source: input.event_source || "web",
        p_user_id: input.user_id || null,
        p_session_id: sessionId,
        p_metadata: input.metadata || {},
      });

      if (error) {
        logger.error("[AnalyticsService] trackEvent error", error);
        return { data: null, error: error.message ?? "Unknown analytics error" };
      }

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: message };
    }
  },

  async trackPageView(
    entityType: string,
    entityId: string,
    source?: AnalyticsEventSource,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "page_view",
      event_source: source,
      session_id: this.getSessionId(),
    });
  },

  async trackQRScan(
    entityType: string,
    entityId: string,
    qrCodeId?: string,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: "qr_scan",
      event_source: "qr_code",
      session_id: this.getSessionId(),
      metadata: qrCodeId ? { qr_code_id: qrCodeId } : {},
    });
  },

  async trackMenuView(businessId: string): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "menu_view",
      session_id: this.getSessionId(),
    });
  },

  async trackOrderStarted(
    businessId: string,
    orderId: string,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "order_started",
      session_id: this.getSessionId(),
      metadata: { order_id: orderId },
    });
  },

  async trackOrderCompleted(
    businessId: string,
    orderId: string,
    orderValue: number,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "order_completed",
      session_id: this.getSessionId(),
      metadata: { order_id: orderId, order_value: orderValue },
    });
  },

  async trackDeliveryRequested(
    businessId: string,
    deliveryId: string,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "delivery_requested",
      session_id: this.getSessionId(),
      metadata: { delivery_id: deliveryId },
    });
  },

  async trackDeliveryCompleted(
    businessId: string,
    deliveryId: string,
    deliveryFee: number,
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "delivery_completed",
      session_id: this.getSessionId(),
      metadata: { delivery_fee: deliveryFee, delivery_id: deliveryId },
    });
  },

  async trackClick(
    businessId: string,
    clickType: "phone" | "whatsapp" | "directions",
  ): Promise<ServiceResult<string>> {
    let eventType: "click_phone" | "click_whatsapp" | "click_directions" = "click_phone";

    switch (clickType) {
      case "whatsapp":
        eventType = "click_whatsapp";
        break;
      case "directions":
        eventType = "click_directions";
        break;
      default:
        break;
    }

    return this.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: eventType,
      session_id: this.getSessionId(),
    });
  },

  async getMetrics(
    entityType: string,
    entityId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ServiceResult<AnalyticsMetrics>> {
    try {
      const { data, error } = await analyticsDb.rpc<AnalyticsMetrics[]>("get_analytics_metrics", {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });

      if (error) {
        logger.error("[AnalyticsService] getMetrics error", error);
        return { data: null, error: error.message ?? "Unknown analytics error" };
      }

      return { data: data?.[0] ?? null, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: message };
    }
  },

  async getDailyMetrics(
    entityType: string,
    entityId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ServiceResult<DailyMetrics[]>> {
    try {
      let query = analyticsDb
        .from<AnalyticsDailyMetricsRow>("analytics_daily_metrics")
        .select("date, total_views, unique_views, qr_scans, orders_completed, total_order_value")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("date", { ascending: true });

      if (dateFrom) {
        query = query.gte("date", dateFrom);
      }

      if (dateTo) {
        query = query.lte("date", dateTo);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("[AnalyticsService] getDailyMetrics error", error);
        return { data: null, error: error.message ?? "Unknown analytics error" };
      }

      return { data: data || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: message };
    }
  },

  async getRecentEvents(
    entityType: string,
    entityId: string,
    limit: number = 100,
  ): Promise<ServiceResult<AnalyticsEvent[]>> {
    try {
      const { data, error } = await analyticsDb.rpc<AnalyticsEvent[]>("get_recent_analytics_events", {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: limit,
      });

      if (error) {
        logger.error("[AnalyticsService] getRecentEvents error", error);
        return { data: null, error: error.message ?? "Unknown analytics error" };
      }

      return { data: data || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: message };
    }
  },

  getSessionId(): string {
    if (typeof window === "undefined") return "";

    const key = "analytics_session_id";
    let sessionId = localStorage.getItem(key);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${secureRandomString(12)}`;
      localStorage.setItem(key, sessionId);
    }

    return sessionId;
  },

  clearSessionId(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("analytics_session_id");
  },
};
