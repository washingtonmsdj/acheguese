/**
 * useAnalytics — Hook para gerenciar analytics
 *
 * Consome AnalyticsService (SSOT).
 * NÃO acessa Supabase diretamente.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { AnalyticsService, AnalyticsEventType } from '@/core/analytics/AnalyticsService';

// ── Query Keys ────────────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ['analytics'] as const,
  metrics: (entityType: string, entityId: string, dateFrom?: string, dateTo?: string) =>
    [...analyticsKeys.all, 'metrics', entityType, entityId, dateFrom, dateTo] as const,
  dailyMetrics: (entityType: string, entityId: string, dateFrom?: string, dateTo?: string) =>
    [...analyticsKeys.all, 'daily', entityType, entityId, dateFrom, dateTo] as const,
  recentEvents: (entityType: string, entityId: string, limit?: number) =>
    [...analyticsKeys.all, 'events', entityType, entityId, limit] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Hook para buscar métricas agregadas
 */
export function useAnalyticsMetrics(
  entityType: string,
  entityId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: analyticsKeys.metrics(entityType, entityId, dateFrom, dateTo),
    queryFn: async () => {
      const result = await AnalyticsService.getMetrics(entityType, entityId, dateFrom, dateTo);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}

/**
 * Hook para buscar métricas diárias
 */
export function useDailyMetrics(
  entityType: string,
  entityId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return useQuery({
    queryKey: analyticsKeys.dailyMetrics(entityType, entityId, dateFrom, dateTo),
    queryFn: async () => {
      const result = await AnalyticsService.getDailyMetrics(entityType, entityId, dateFrom, dateTo);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 300000, // Refetch a cada 5 minutos
  });
}

/**
 * Hook para buscar eventos recentes
 */
export function useRecentEvents(
  entityType: string,
  entityId: string,
  limit: number = 100
) {
  return useQuery({
    queryKey: analyticsKeys.recentEvents(entityType, entityId, limit),
    queryFn: async () => {
      const result = await AnalyticsService.getRecentEvents(entityType, entityId, limit);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Hook para registrar evento genérico
 */
export function useTrackEvent() {
  return useMutation({
    mutationFn: async (input: {
      entity_type: string;
      entity_id: string;
      event_type: AnalyticsEventType;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await AnalyticsService.trackEvent(input);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

/**
 * Hook para registrar visualização de página
 */
export function useTrackPageView() {
  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: string;
      entityId: string;
    }) => {
      const result = await AnalyticsService.trackPageView(entityType, entityId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

/**
 * Hook para registrar scan de QR Code
 */
export function useTrackQRScan() {
  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      qrCodeId,
    }: {
      entityType: string;
      entityId: string;
      qrCodeId?: string;
    }) => {
      const result = await AnalyticsService.trackQRScan(entityType, entityId, qrCodeId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}

/**
 * Hook para registrar clique em ação
 */
export function useTrackClick() {
  return useMutation({
    mutationFn: async ({
      businessId,
      clickType,
    }: {
      businessId: string;
      clickType: 'phone' | 'whatsapp' | 'directions';
    }) => {
      const result = await AnalyticsService.trackClick(businessId, clickType);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
}
