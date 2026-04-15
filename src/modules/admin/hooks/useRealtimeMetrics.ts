/**
 * Hook para métricas em tempo real do sistema de mobilidade
 * Monitora motoristas online, corridas ativas e outras métricas críticas
 * 
 * ✅ SSOT - Usa AdminService
 */

import { useState, useEffect, useCallback } from "react";
import { AdminService } from '@/modules/admin/services/AdminService';
import { logger } from "@/shared/utils/logger";
import type {
  RealtimeMetrics,
  ActiveRide,
  OnlineDriver,
} from '@/modules/admin/services/AdminService';

// Re-export types for convenience
export type { RealtimeMetrics, ActiveRide, OnlineDriver };

interface UseRealtimeMetricsReturn {
  metrics: RealtimeMetrics | null;
  activeRides: ActiveRide[];
  onlineDrivers: OnlineDriver[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
}

export function useRealtimeMetrics(): UseRealtimeMetricsReturn {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);

      // ✅ SSOT - Usa AdminService
      const data = await AdminService.getRealtimeMetrics();

      setMetrics(data.metrics);
      setActiveRides(data.activeRides);
      setOnlineDrivers(data.onlineDrivers);
    } catch (err) {
      logger.error("useRealtimeMetrics: Erro ao buscar métricas", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    // ✅ SSOT - Subscription via AdminService
    const unsubscribe = AdminService.subscribeToMetrics(() => {
      fetchMetrics();
    });

    setIsConnected(true);

    // Polling a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [fetchMetrics]);

  return {
    metrics,
    activeRides,
    onlineDrivers,
    loading,
    error,
    refetch: fetchMetrics,
    isConnected,
  };
}
