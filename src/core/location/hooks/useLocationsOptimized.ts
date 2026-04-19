/**
 * SSOT - Optimized Locations Hook
 * 
 * Hook otimizado para locations usando estratégias de cache do SSOT.
 * 
 * Estratégia: STATIC (staleTime: 24h, gcTime: 7 dias)
 * - Locations raramente mudam
 * - Cache agressivo para reduzir API calls
 * - Prefetch para melhor UX
 * 
 * @see src/config/reactQuery.config.ts - Configuração de cache
 * @version 1.0.0
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS, CACHE_STRATEGIES, createQueryOptions } from '@/config/reactQuery.config';
import { supabase } from '@/integrations/supabase/client';

/**
 * Location type
 */
export interface Location {
  id: string;
  name: string;
  type: 'country' | 'state' | 'city' | 'district' | 'neighborhood';
  parent_id?: string;
  slug: string;
  created_at: string;
}

/**
 * Location Service
 */
class LocationService {
  /**
   * Busca todas as locations
   */
  static async getAllLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Busca location por ID
   */
  static async getLocationById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      throw error;
    }

    return data;
  }

  /**
   * Busca locations por tipo
   */
  static async getLocationsByType(type: Location['type']): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('type', type)
      .order('name');

    if (error) {
      console.error('Error fetching locations by type:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Busca árvore de locations (hierárquica)
   */
  static async getLocationTree(): Promise<Location[]> {
    // Busca todas as locations e constrói árvore no client
    const locations = await this.getAllLocations();
    
    // Organiza em árvore (parent -> children)
    const tree: Location[] = [];
    const map = new Map<string, Location & { children?: Location[] }>();

    // Primeiro, cria map de todas as locations
    locations.forEach((loc) => {
      map.set(loc.id, { ...loc, children: [] });
    });

    // Depois, organiza em árvore
    locations.forEach((loc) => {
      const node = map.get(loc.id)!;
      if (loc.parent_id) {
        const parent = map.get(loc.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}

/**
 * Hook para buscar todas as locations
 * 
 * Usa estratégia STATIC (24h cache)
 * Ideal para dropdowns e seletores
 */
export function useLocations() {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.all,
      () => LocationService.getAllLocations(),
      'STATIC' // 24h cache
    ),
  });
}

/**
 * Hook para buscar location por ID
 * 
 * Usa estratégia STATIC (24h cache)
 */
export function useLocation(id: string | undefined) {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.byId(id || ''),
      () => LocationService.getLocationById(id!),
      'STATIC',
      {
        enabled: !!id,
      }
    ),
  });
}

/**
 * Hook para buscar locations por tipo
 * 
 * Usa estratégia STATIC (24h cache)
 */
export function useLocationsByType(type: Location['type']) {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.byType(type),
      () => LocationService.getLocationsByType(type),
      'STATIC'
    ),
  });
}

/**
 * Hook para buscar árvore de locations
 * 
 * Usa estratégia STATIC (24h cache)
 * Ideal para navegação hierárquica
 */
export function useLocationTree() {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.tree,
      () => LocationService.getLocationTree(),
      'STATIC'
    ),
  });
}

/**
 * Hook para prefetch de locations
 * 
 * Carrega locations em background para melhor UX
 * Use em páginas que provavelmente vão precisar de locations
 */
export function usePrefetchLocations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all locations
    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.all,
        () => LocationService.getAllLocations(),
        'STATIC'
      ),
    });

    // Prefetch location tree
    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.tree,
        () => LocationService.getLocationTree(),
        'STATIC'
      ),
    });
  }, [queryClient]);
}

/**
 * Hook para prefetch de location específica
 * 
 * Use quando souber que o usuário vai acessar uma location
 */
export function usePrefetchLocation(id: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;

    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.byId(id),
        () => LocationService.getLocationById(id),
        'STATIC'
      ),
    });
  }, [id, queryClient]);
}
