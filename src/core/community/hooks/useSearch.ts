/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import type { CommunityPost } from "../types";
import { logger } from "@/shared/utils/logger";
/**
 * Hook profissional para busca de posts
 *
 * Features:
 * - Busca em tempo real com debounce
 * - Filtros: texto, tags, autor, tipo
 * - Histórico de buscas
 * - Sugestões inteligentes
 * - Performance otimizada
 */

interface SearchFilters {
  query: string;
  tags?: string[];
  author?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SearchResult {
  posts: CommunityPost[];
  total: number;
  suggestions: string[];
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({ query: "" });
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    total: 0,
    suggestions: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  /**
   * Debounce para evitar buscas excessivas
   */
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  /**
   * Executa a busca
   */
  const performSearch = async (searchFilters: SearchFilters) => {
    if (!searchFilters.query.trim()) {
      setResults({ posts: [], total: 0, suggestions: [] });
      return;
    }

    setIsSearching(true);

    try {
      // TODO: Implementar chamada à API real do Supabase
      // const response = await searchPosts(searchFilters);

      // Simular delay de rede
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Retornar resultados vazios até implementar busca real
      const mockResults: CommunityPost[] = [];
      const mockSuggestions: string[] = [];

      setResults({
        posts: mockResults,
        total: mockResults.length,
        suggestions: mockSuggestions,
      });

      // Adicionar ao histórico
      if (searchFilters.query.trim()) {
        setSearchHistory((prev) => {
          const newHistory = [
            searchFilters.query,
            ...prev.filter((q) => q !== searchFilters.query),
          ].slice(0, 5); // Manter apenas 5 últimas

          // Salvar no localStorage
          localStorage.setItem("search_history", JSON.stringify(newHistory));
          return newHistory;
        });
      }
    } catch (error) {
      logger.error("Erro na busca:", error);
      setResults({ posts: [], total: 0, suggestions: [] });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Busca com debounce
   */
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      performSearch(searchFilters);
    }, 500),
    [],
  );

  /**
   * Atualiza query e dispara busca
   */
  const search = (newQuery: string) => {
    setQuery(newQuery);
    const newFilters = { ...filters, query: newQuery };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  /**
   * Limpa busca
   */
  const clearSearch = () => {
    setQuery("");
    setFilters({ query: "" });
    setResults({ posts: [], total: 0, suggestions: [] });
  };

  /**
   * Remove item do histórico
   */
  const removeFromHistory = (item: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((q) => q !== item);
      localStorage.setItem("search_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  /**
   * Carrega histórico do localStorage
   */
  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        logger.error("Error load histórico:", error);
      }
    }
  }, []);

  return {
    query,
    results,
    isSearching,
    searchHistory,
    search,
    clearSearch,
    removeFromHistory,
  };
}

