/**
 * ?? useEventos Hook - REFATORADO PARA SSOT + TERRITORIAL
 * 
 * Hook para buscar eventos usando EventsService (SSOT)
 * 
 * ? Usa EventsService ao invés de acesso direto ao Supabase
 * ? Segue arquitetura SSOT
 * ? Type-safe com interface Event do service
 * ? Suporte a filtro territorial
 * 
 * @version 3.0.0 - SSOT Compliant + Territorial
 */

import { useQuery } from "@tanstack/react-query";
import { EventsService, type Event } from "@/modules/community/events";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { RouteResolved } from "@/core/routing/types";

// Re-exporta Event do service para compatibilidade
export type { Event as Evento } from "@/modules/community/events";

interface UseEventosOptions {
  routeResolved?: RouteResolved;
  filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function useEventos(options: UseEventosOptions = {}) {
  const { filters, routeResolved } = options;
  
  // ? Aplica filtro territorial
  const territoryFilter = useTerritoryFilter(routeResolved);
  
  const query = useQuery({
    queryKey: ["eventos", filters, territoryFilter],
    queryFn: async () => {
      // ? SSOT: Usa EventsService com filtro territorial
      const events = await EventsService.getEvents({
        category: filters?.category,
        upcoming: true, // Apenas eventos futuros por padrão
        territoryFilter, // ? Filtro territorial aplicado
      });
      
      // Aplica filtros adicionais no client (search)
      let filtered = events;
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.title.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower)
        );
      }
      
      return filtered;
    },
  });

  return {
    eventos: query.data || [],
    isLoading: query.isLoading,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => {},
    error: query.error,
  };
}

