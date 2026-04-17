/**
 * AnalyticsService — SSOT canônico de analytics
 *
 * Centraliza toda a lógica de negócio de analytics e métricas.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - Registro de eventos
 * - Consulta de métricas
 * - Agregação de dados
 * - Relatórios
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type { AdminSupabaseClient } from '@/core/admin/types/adminDatabase.types';

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type AnalyticsEventType =
  | 'qr_scan'
  | 'page_view'
  | 'menu_view'
  | 'item_view'
  | 'order_started'
  | 'order_completed'
  | 'order_cancelled'
  | 'delivery_requested'
  | 'delivery_completed'
  | 'click_phone'
  | 'click_whatsapp'
  | 'click_directions'
  | 'share'
  | 'favorite_added'
  | 'favorite_removed';

export type AnalyticsEventSource =
  | 'web'
  | 'mobile'
  | 'qr_code'
  | 'direct_link'
  | 'search'
  | 'social_media'
  | 'other';

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
  metadata: Record<string, any>;
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

// ── Service ───────────────────────────────────────────────────────────────

export const AnalyticsService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // REGISTRO DE EVENTOS
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Registra um evento de analytics
   */
  async trackEvent(input: {
    entity_type: string;
    entity_id: string;
    event_type: AnalyticsEventType;
    event_source?: AnalyticsEventSource;
    user_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  }): Promise<ServiceResult<string>> {
    try {
      const { data, error } = await supabase.rpc('track_analytics_event', {
        p_entity_type: input.entity_type,
        p_entity_id: input.entity_id,
        p_event_type: input.event_type,
        p_event_source: input.event_source || 'web',
        p_user_id: input.user_id || null,
        p_session_id: input.session_id || null,
        p_metadata: input.metadata || {},
      });

      if (error) {
        logger.error('[AnalyticsService] trackEvent error', error);
        return { data: null, error: error.message };
      }

      return { data: data as string, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Registra visualização de página
   */
  async trackPageView(
    entityType: string,
    entityId: string,
    source?: AnalyticsEventSource
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'page_view',
      event_source: source,
      session_id: this.getSessionId(),
    });
  },

  /**
   * Registra scan de QR Code
   */
  async trackQRScan(
    entityType: string,
    entityId: string,
    qrCodeId?: string
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'qr_scan',
      event_source: 'qr_code',
      session_id: this.getSessionId(),
      metadata: qrCodeId ? { qr_code_id: qrCodeId } : {},
    });
  },

  /**
   * Registra visualização de cardápio
   */
  async trackMenuView(
    businessId: string
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: 'menu_view',
      session_id: this.getSessionId(),
    });
  },

  /**
   * Registra pedido iniciado
   */
  async trackOrderStarted(
    businessId: string,
    orderId: string
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: 'order_started',
      session_id: this.getSessionId(),
      metadata: { order_id: orderId },
    });
  },

  /**
   * Registra pedido concluído
   */
  async trackOrderCompleted(
    businessId: string,
    orderId: string,
    orderValue: number
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: 'order_completed',
      session_id: this.getSessionId(),
      metadata: { order_id: orderId, order_value: orderValue },
    });
  },

  /**
   * Registra entrega solicitada
   */
  async trackDeliveryRequested(
    businessId: string,
    deliveryId: string
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: 'delivery_requested',
      session_id: this.getSessionId(),
      metadata: { delivery_id: deliveryId },
    });
  },

  /**
   * Registra entrega concluída
   */
  async trackDeliveryCompleted(
    businessId: string,
    deliveryId: string,
    deliveryFee: number
  ): Promise<ServiceResult<string>> {
    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: 'delivery_completed',
      session_id: this.getSessionId(),
      metadata: { delivery_id: deliveryId, delivery_fee: deliveryFee },
    });
  },

  /**
   * Registra clique em ação
   */
  async trackClick(
    businessId: string,
    clickType: 'phone' | 'whatsapp' | 'directions'
  ): Promise<ServiceResult<string>> {
    const eventTypeMap = {
      phone: 'click_phone' as const,
      whatsapp: 'click_whatsapp' as const,
      directions: 'click_directions' as const,
    };

    return this.trackEvent({
      entity_type: 'business',
      entity_id: businessId,
      event_type: eventTypeMap[clickType],
      session_id: this.getSessionId(),
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONSULTA DE MÉTRICAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Busca métricas agregadas de uma entidade
   */
  async getMetrics(
    entityType: string,
    entityId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceResult<AnalyticsMetrics>> {
    try {
      const { data, error } = await supabase.rpc('get_analytics_metrics', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });

      if (error) {
        logger.error('[AnalyticsService] getMetrics error', error);
        return { data: null, error: error.message };
      }

      return { data: data[0] as AnalyticsMetrics, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca métricas diárias
   */
  async getDailyMetrics(
    entityType: string,
    entityId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceResult<DailyMetrics[]>> {
    try {
      let query = supabase
        .from('analytics_daily_metrics')
        .select('date, total_views, unique_views, qr_scans, orders_completed, total_order_value')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('date', { ascending: true });

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[AnalyticsService] getDailyMetrics error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DailyMetrics[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca eventos recentes
   */
  async getRecentEvents(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<ServiceResult<AnalyticsEvent[]>> {
    try {
      const { data, error } = await supabase.rpc('get_recent_analytics_events', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: limit,
      });

      if (error) {
        logger.error('[AnalyticsService] getRecentEvents error', error);
        return { data: null, error: error.message };
      }

      return { data: data as AnalyticsEvent[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Gera ou recupera session ID do localStorage
   */
  getSessionId(): string {
    if (typeof window === 'undefined') return '';

    const key = 'analytics_session_id';
    let sessionId = localStorage.getItem(key);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, sessionId);
    }

    return sessionId;
  },

  /**
   * Limpa session ID (útil para testes)
   */
  clearSessionId(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('analytics_session_id');
  },
};
