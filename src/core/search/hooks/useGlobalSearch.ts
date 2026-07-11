/**
 * useGlobalSearch Hook
 *
 * Hook para busca global com debounce e cache
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchService } from "../services/SearchService";
import type { SearchFilters, SearchResults } from "../services/SearchService";

interface UseGlobalSearchOptions {
  enabled?: boolean;
}

export function useGlobalSearch(
  initialQuery = "",
  initialFilters: SearchFilters = {},
  options: UseGlobalSearchOptions = {},
) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // Debounce da query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);

      // Salvar no histórico se tiver pelo menos 2 caracteres
      if (query.trim().length >= 2) {
        SearchService.saveSearchHistory(query.trim());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Query com React Query (cache automático)
  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["global-search", debouncedQuery, filters],
    queryFn: () => SearchService.search(debouncedQuery, filters),
    enabled: (options.enabled ?? true) && debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Sugestões
  const suggestions = SearchService.getSearchSuggestions();
  const history = SearchService.getSearchHistory();

  // Limpar query
  const clearQuery = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    SearchService.clearSearchHistory();
  }, []);

  return {
    // State
    query,
    setQuery,
    filters,
    updateFilters,

    // Results
    results:
      results ||
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

    // Actions
    clearQuery,
    refetch,

    // Suggestions
    suggestions,
    history,
    clearHistory,
  };
}
