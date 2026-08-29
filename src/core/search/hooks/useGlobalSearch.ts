import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type {
  SearchFilters,
  SearchHistoryScope,
  SearchResults,
} from "../contracts";
import { SearchService } from "../services/SearchService";

interface UseGlobalSearchOptions {
  enabled?: boolean;
  historyScope?: SearchHistoryScope;
}

export function useGlobalSearch(
  initialQuery = "",
  initialFilters: SearchFilters = {},
  options: UseGlobalSearchOptions = {},
) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const historyScope = options.historyScope ?? "global";
  const [history, setHistory] = useState<string[]>(() =>
    SearchService.getSearchHistory(historyScope),
  );

  useEffect(() => {
    setHistory(SearchService.getSearchHistory(historyScope));
  }, [historyScope]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedQuery = query.trim();
      setDebouncedQuery(normalizedQuery);
      if (normalizedQuery.length < 2) return;

      SearchService.saveSearchHistory(normalizedQuery, historyScope);
      setHistory(SearchService.getSearchHistory(historyScope));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [historyScope, query]);

  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["global-search", debouncedQuery, filters],
    queryFn: ({ signal }) =>
      SearchService.search(debouncedQuery, filters, { signal }),
    enabled: (options.enabled ?? true) && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = SearchService.getSearchSuggestions();

  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((previous) => ({ ...previous, ...newFilters }));
  }, []);

  const clearHistory = useCallback(() => {
    SearchService.clearSearchHistory(historyScope);
    setHistory([]);
  }, [historyScope]);

  return {
    query,
    setQuery,
    filters,
    updateFilters,
    results:
      results ??
      ({
        documents: [],
        communities: [],
        businesses: [],
        professionals: [],
        opportunities: [],
        classifieds: [],
        events: [],
        posts: [],
        coupons: [],
        total: 0,
      } as SearchResults),
    isLoading,
    error,
    clearQuery,
    refetch,
    suggestions,
    history,
    clearHistory,
  };
}
