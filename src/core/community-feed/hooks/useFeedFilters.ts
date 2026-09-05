import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/shared/utils/logger";
/**
 * Tipos de escopo geográfico para filtrar posts
 * Requirement 1: Filtro de Localização
 */
export type LocationScope = "city" | "neighborhood" | "street";

/**
 * Tipos de ordenação do feed
 * Requirement 4: Modos de Ordenação
 */
export type SortBy = "recentes" | "populares" | "mais_comentados";

/**
 * Interface para os filtros da comunidade
 */
export interface CommunityFilters {
  locationScope: LocationScope;
  sortBy: SortBy;
  tagFilter: string | null;
  postTypeFilter: "Pergunta" | "Alerta" | "Discussão" | "Recomendação" | null;
}

const STORAGE_KEY = "community_filters";
const DEBOUNCE_DELAY = 300; // 300ms debounce - Requirement 28.4

/**
 * Hook for gerenciar filtros da página Comunidade
 *
 * Requirements:
 * - Requirement 1: Filtro de Localização (city/neighborhood/rua)
 * - Requirement 4: Modos de Ordenação (recentes/populares/mais_comentados)
 * - Requirement 28.4: Debounce em filtros (300ms, evitar queries desnecessárias)
 *
 * Funcionalidades:
 * - Gerencia state de locationScope, sortBy e tagFilter
 * - Persiste filtros no localStorage
 * - Restaura filtros ao reload página
 * - Debounce de 300ms para evitar queries desnecessárias
 */
export function useCommunityFilters() {
  // Carregar filtros salvos do localStorage ou usar defaults
  const [filters, setFilters] = useState<CommunityFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error("Error loading filters from localStorage:", error);
    }

    // Valores padrão
    return {
      locationScope: "city",
      sortBy: "recentes",
      tagFilter: null,
      postTypeFilter: null,
    };
  });

  // Debounced filters - the actual filters used for queries
  // Requirement 28.4: Debounce de 300ms para evitar queries desnecessárias
  const [debouncedFilters, setDebouncedFilters] =
    useState<CommunityFilters>(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce filter changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters]);

  // Persistir filtros no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      logger.error("Error saving filters to localStorage:", error);
    }
  }, [filters]);

  /**
   * Atualizar escopo geográfico
   */
  const setLocationScope = useCallback((scope: LocationScope) => {
    setFilters((prev) => ({ ...prev, locationScope: scope }));
  }, []);

  /**
   * Atualizar ordenação
   */
  const setSortBy = useCallback((sort: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy: sort }));
  }, []);

  /**
   * Atualizar filtro de tag
   */
  const setTagFilter = useCallback((tag: string | null) => {
    setFilters((prev) => ({ ...prev, tagFilter: tag }));
  }, []);

  /**
   * Atualizar filtro de tipo de post
   */
  const setPostTypeFilter = useCallback(
    (postType: "Pergunta" | "Alerta" | "Discussão" | "Recomendação" | null) => {
      setFilters((prev) => ({ ...prev, postTypeFilter: postType }));
    },
    [],
  );

  /**
   * Resetar todos os filtros para valores padrão
   */
  const resetFilters = useCallback(() => {
    setFilters({
      locationScope: "city",
      sortBy: "recentes",
      tagFilter: null,
      postTypeFilter: null,
    });
  }, []);

  return {
    filters: debouncedFilters, // Return debounced filters for queries
    immediateFilters: filters, // Return immediate filters for UI
    setLocationScope,
    setSortBy,
    setTagFilter,
    setPostTypeFilter,
    resetFilters,
  };
}
