import { useState, useEffect } from "react";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/core/business/types";
import { logger } from "@/shared/utils/logger";

interface UseBusinessSimilarOptions {
  businessId: string;
  category: string;
  limit?: number;
}

export function useBusinessSimilar({
  businessId,
  category,
  limit = 5,
}: UseBusinessSimilarOptions) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        setLoading(true);
        setError(null);
        const data = await BusinessService.getSimilarBusinesses(
          businessId,
          category,
          limit,
        );
        setBusinesses((data ?? []).filter((item): item is Business => !!item?.id));
      } catch (err) {
        logger.error("Error fetching similar businesses:", err);
        setError(err as Error);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }

    if (businessId && category) {
      fetchSimilar();
    }
  }, [businessId, category, limit]);

  return { businesses, loading, error };
}
