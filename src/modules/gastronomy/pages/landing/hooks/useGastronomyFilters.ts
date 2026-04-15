/**
 * Hook para gerenciar filtros de gastronomia
 *
 * Centraliza a logica de filtros da landing sem duplicar contratos do modulo.
 */

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type GastronomyBusinessFilters,
  type PriceRange,
} from '../../../types';
import { getCuisineLabel } from '../../../constants/cuisine';

export function useGastronomyFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<GastronomyBusinessFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const searchQuery = (searchParams.get('q') ?? '').trim();

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearchParams(
        (current) => {
          const nextSearchParams = new URLSearchParams(current);
          if (value) {
            nextSearchParams.set('q', value);
          } else {
            nextSearchParams.delete('q');
          }
          return nextSearchParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleCuisineFilter = useCallback((cuisine: string) => {
    setFilters((current) => ({
      ...current,
      cuisine_type: cuisine || undefined,
    }));
  }, []);

  const handlePriceFilter = useCallback((price: string) => {
    setFilters((current) => ({
      ...current,
      price_range: price === 'todos' ? undefined : (price as PriceRange),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, [setSearchQuery]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== undefined) || !!searchQuery,
    [filters, searchQuery],
  );

  const hasCuisineFilter = Boolean(filters.cuisine_type);
  const activeCuisineLabel = filters.cuisine_type
    ? getCuisineLabel(filters.cuisine_type)
    : null;

  return {
    filters,
    searchQuery,
    showAdvancedFilters,
    hasActiveFilters,
    hasCuisineFilter,
    activeCuisineLabel,
    setFilters,
    setSearchQuery,
    setShowAdvancedFilters,
    handleCuisineFilter,
    handlePriceFilter,
    clearFilters,
  };
}
