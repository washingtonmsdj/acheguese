import { useQuery } from '@tanstack/react-query';
import { GastronomyPublicPreviewService } from '../services/GastronomyPublicPreviewService';

const PREVIEW_STALE_TIME = 5 * 60 * 1000;

export function useGastronomyPreview(
  businessId: string | undefined,
  limit = 3,
) {
  return useQuery({
    queryKey: ['gastronomy', 'public-preview', businessId, limit],
    queryFn: () =>
      GastronomyPublicPreviewService.getBusinessPreview(businessId!, limit),
    enabled: !!businessId,
    staleTime: PREVIEW_STALE_TIME,
  });
}
