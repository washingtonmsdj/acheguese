import { useCallback, useEffect, useState } from "react";
import {
  getRealtimeMetrics,
  subscribeToMetrics,
} from "@/core/admin/services/admin.queries";
import { logger } from "@/shared/utils/logger";
import type {
  ActiveRide,
  OnlineDriver,
  RealtimeMetrics,
} from "@/core/admin/services/types";

export type { ActiveRide, OnlineDriver, RealtimeMetrics };

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
      const data = await getRealtimeMetrics();
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
    void fetchMetrics();

    const unsubscribe = subscribeToMetrics(() => {
      void fetchMetrics();
    });

    setIsConnected(true);
    const interval = window.setInterval(() => {
      void fetchMetrics();
    }, 30_000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
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
