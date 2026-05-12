/**
 * usePriceEstimate - Hook para estimativas de preço
 *
 * SSOT para cálculo de estimativas.
 * Usa PricingService internamente.
 *
 * Padrão: Service → Hook → Component
 */

import { useQuery } from '@tanstack/react-query';
import { pricingService } from '../services/PricingService';
import type { PriceEstimateRequest, PricingMode } from '../types';

export function usePriceEstimate(
  request: PriceEstimateRequest | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: ['price-estimate', request],
    queryFn: () => pricingService.calculateEstimate(request!),
    enabled: options?.enabled !== false && !!request,
    staleTime: options?.staleTime ?? 60000, // 1 minuto
  });
}

export function useQuickPriceEstimate(
  mode: PricingMode | null,
  distanceKm: number | null,
  durationMinutes: number | null,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['quick-price-estimate', mode, distanceKm, durationMinutes],
    queryFn: () =>
      pricingService.calculateQuickEstimate(
        mode!,
        distanceKm!,
        durationMinutes!
      ),
    enabled:
      options?.enabled !== false &&
      !!mode &&
      distanceKm !== null &&
      durationMinutes !== null,
    staleTime: 60000,
  });
}
