import { useState, useEffect, useCallback } from "react";
import { pricingService } from "@/core/pricing/services/PricingService";
import type { PricingRule } from "@/core/pricing/types";
import { logger } from "@/shared/utils/logger";

export function usePricingRules() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allRules = await pricingService.listRules(true); // Incluir inativas
      setRules(allRules);
    } catch (err) {
      logger.error("Error fetching pricing rules:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
  };
}
