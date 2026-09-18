import { useQuery } from '@tanstack/react-query';
import { CatalogService } from '../services/CatalogService';

const QUERY_KEYS = {
  all: ['billing-plans'] as const,
  byCode: (code: string) => ['billing-plans', code] as const,
};

export function useBillingPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => CatalogService.getPublishedPlans(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBillingPlan(code: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byCode(code),
    queryFn: () => CatalogService.getPublishedPlanByCode(code),
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
  });
}
