/**
 * Hook para estatísticas de reputação
 * 
 * ✅ SSOT - Usa AdminService
 */

import { useState, useEffect } from "react";
import { getReputationStats } from "@/core/admin/services/admin.queries";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import type { ReputationStats } from "@/core/admin/services/types";

// Re-export type for convenience
export type { ReputationStats };

export function useReputationStats() {
  const [stats, setStats] = useState<ReputationStats>({
    totalPassengers: 0,
    avgPassengerRating: 0,
    totalDrivers: 0,
    avgDriverRating: 0,
    trustedPassengers: 0,
    suspendedDrivers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // ✅ SSOT - Usa AdminService
      const data = await getReputationStats();
      setStats(data);
    } catch (error) {
      logger.error("useReputationStats: Error loading stats", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading };
}
