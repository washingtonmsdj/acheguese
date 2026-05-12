import { useState, useEffect, useCallback } from "react";
import { pricingService } from "@/core/pricing/services/PricingService";
import { logger } from "@/shared/utils/logger";

export function usePricingAuditLog(limit: number = 20) {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pricingService.getAuditLog(limit);
      setLogs(data);
    } catch (err) {
      logger.error("Error fetching pricing audit log:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
