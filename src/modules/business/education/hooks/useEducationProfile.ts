import { useQuery } from '@tanstack/react-query';
import { educationQueries } from '../services';

export function useEducationProfile(businessId?: string) {
  return useQuery({
    queryKey: ['education', 'profile', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      return educationQueries.getEducationProfileByBusinessId(businessId);
    },
    enabled: Boolean(businessId),
  });
}
