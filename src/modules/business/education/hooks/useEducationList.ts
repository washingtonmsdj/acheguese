import { useInfiniteQuery } from '@tanstack/react-query';
import { educationQueries } from '../services';
import type { EducationProfile } from '../types';

export interface EducationListFilters {
  nicheKey?: string;
}

export function useEducationList(filters: EducationListFilters = {}) {
  const { nicheKey } = filters;

  return useInfiniteQuery({
    queryKey: ['education', 'list', nicheKey],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await educationQueries.listPublishedEducationProfiles({
        page: pageParam,
        pageSize: 20,
        nicheKey,
      });
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
