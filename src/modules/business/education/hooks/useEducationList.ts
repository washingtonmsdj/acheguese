import { useInfiniteQuery } from '@tanstack/react-query';
import * as educationQueries from '@/core/education/services/education.queries';
export interface EducationListFilters {
  nicheKey?: string;
  state?: string;
  city?: string;
  district?: string;
}

export function useEducationList(filters: EducationListFilters = {}) {
  const { nicheKey, state, city, district } = filters;

  return useInfiniteQuery({
    queryKey: ['education', 'list', nicheKey, state, city, district],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await educationQueries.listPublishedEducationProfiles({
        page: pageParam,
        pageSize: 20,
        nicheKey,
        state,
        city,
        district,
      });
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
