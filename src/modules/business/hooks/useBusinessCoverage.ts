import { useQuery } from '@tanstack/react-query';
import { businessCoverageService } from '../services';
import { useBusinessLocation } from './useBusinessLocation';

export const businessCoverageQueryKeys = {
  all: ['business', 'coverage'] as const,
  areas: (businessDataId: string) =>
    [...businessCoverageQueryKeys.all, 'areas', businessDataId] as const,
  decision: (businessDataId: string, locationId: string | null) =>
    [...businessCoverageQueryKeys.all, 'decision', businessDataId, locationId] as const,
};

/**
 * Read model for business coverage. It performs one areas query and one
 * location decision query, both backed by the canonical coverage service.
 */
export function useBusinessCoverage(businessDataId?: string) {
  const { activeLocationId } = useBusinessLocation();

  const areasQuery = useQuery({
    queryKey: businessCoverageQueryKeys.areas(businessDataId ?? 'missing'),
    queryFn: () => businessCoverageService.getBusinessCoverage(businessDataId!),
    enabled: Boolean(businessDataId),
    staleTime: 5 * 60 * 1000,
  });

  const decisionQuery = useQuery({
    queryKey: businessCoverageQueryKeys.decision(
      businessDataId ?? 'missing',
      activeLocationId,
    ),
    queryFn: () => businessCoverageService.getCoverageDetails(businessDataId!),
    enabled: Boolean(businessDataId && activeLocationId),
    staleTime: 5 * 60 * 1000,
  });

  const coverageDetails = decisionQuery.data ?? null;
  const hasCoverage = coverageDetails?.covers ?? false;
  const serviceAreas =
    areasQuery.data?.coverages.map(({ coverage }) => coverage) ?? [];

  const coverageMessage = !activeLocationId
    ? 'Selecione uma localizacao para verificar cobertura'
    : hasCoverage
      ? coverageDetails?.coverage?.coverage_type === 'city'
        ? 'Atende nesta regiao (cobertura herdada)'
        : 'Atende nesta regiao'
      : 'Nao atende nesta regiao';

  return {
    hasCoverage,
    coverageDetails,
    coverageAreas: areasQuery.data?.coverages ?? [],
    serviceAreas,
    isLoading: areasQuery.isLoading || decisionQuery.isLoading,
    isError: areasQuery.isError || decisionQuery.isError,
    error: areasQuery.error ?? decisionQuery.error,
    coverageMessage,
    checkCoverage: decisionQuery.refetch,
    loadServiceAreas: areasQuery.refetch,
    validateForOrder: () =>
      businessDataId
        ? businessCoverageService.validateForOrder(businessDataId)
        : Promise.resolve({ valid: false, reason: 'Business nao especificado' }),
    coverageType:
      coverageDetails?.coverage?.coverage_type === 'city'
        ? 'inherited'
        : hasCoverage
          ? 'direct'
          : null,
    isDirect: hasCoverage && coverageDetails?.coverage?.coverage_type !== 'city',
    isInherited: coverageDetails?.coverage?.coverage_type === 'city',
    hasAnyCoverage: serviceAreas.length > 0,
  };
}
