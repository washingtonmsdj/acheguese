/**
 * useTouristPoints - Hook SSOT para pontos turísticos
 *
 * retry: false em todos os hooks de leitura — o serviço já trata erros
 * internamente e retorna lista vazia quando não houver dado real.
 */

import { useQuery } from '@tanstack/react-query';
import { TouristPointService } from '../services/TouristPointService';
import type { TouristPointFilters } from '../types';

export function useTouristPoints(filters: TouristPointFilters = {}) {
  return useQuery({
    queryKey: ['tourist-points', filters],
    queryFn: () => TouristPointService.list(filters),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useTouristPoint(id: string | undefined) {
  return useQuery({
    queryKey: ['tourist-point', id],
    queryFn: () => TouristPointService.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useTouristPointBySlug(state: string, city: string, slug: string) {
  return useQuery({
    queryKey: ['tourist-point', state, city, slug],
    queryFn: () => TouristPointService.getBySlug(state, city, slug),
    enabled: !!state && !!city && !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useNearbyTouristPoints(ids: string[]) {
  return useQuery({
    queryKey: ['tourist-points-nearby', ids],
    queryFn: () => TouristPointService.getByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
