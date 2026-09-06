import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as educationQueries from '@/core/education/services/education.queries';
import type { SortKey } from '../pages/explorerFilters';

export interface EducationListFilters {
  query?: string;
  niches?: string[];
  schoolNetworks?: string[];
  institutionTypes?: string[];
  infrastructure?: string[];
  onlyAvailable?: boolean;
  sort?: SortKey;
  state?: string;
  city?: string;
  district?: string;
}

export function useEducationList(filters: EducationListFilters = {}) {
  const {
    query = '',
    niches = [],
    schoolNetworks = [],
    institutionTypes = [],
    infrastructure = [],
    onlyAvailable = false,
    sort = 'relevance',
    state,
    city,
    district,
  } = filters;
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return useInfiniteQuery({
    queryKey: [
      'education',
      'public-list',
      state,
      city,
      district,
      debouncedQuery,
      niches,
      schoolNetworks,
      institutionTypes,
      infrastructure,
      onlyAvailable,
      sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return educationQueries.listPublishedEducationProfiles({
        page: pageParam,
        pageSize: 20,
        query: debouncedQuery,
        niches,
        schoolNetworks,
        institutionTypes,
        infrastructure,
        onlyAvailable,
        sort,
        state,
        city,
        district,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: Boolean(state && city),
    staleTime: 60_000,
  });
}

export function useEducationDistricts(state?: string, city?: string) {
  return useQuery({
    queryKey: ['education', 'public-districts', state, city],
    queryFn: () =>
      educationQueries.listPublishedEducationDistricts(state, city),
    enabled: Boolean(state && city),
    staleTime: 5 * 60_000,
  });
}
