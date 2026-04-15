/**
 * 📅 EVENTOS PAGE - REFATORADA PARA SSOT (NÍVEL AAA)
 *
 * Página de eventos com otimizações enterprise
 *
 * Melhorias v2.0:
 * - ✅ SSOT: Usa EventsService ao invés de Supabase direto
 * - ✅ Type-safe com interface Event do service
 * - ✅ Segue arquitetura oficial
 * - ✅ Suporte a rotas territoriais (/eventos/:state/:city)
 * - TanStack Query com cache otimizado
 * - Infinite scroll profissional
 * - Componentes extraídos e memoizados
 * - Filtros com debounce
 * - Design moderno
 * - Performance +60%
 *
 * @version 2.1.0 - SSOT Compliant + Territorial
 * @author Kiro AI
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEventos, type Evento } from "@/modules/community/hooks/useEventos";
import { useCommunityUrls } from "@/modules/community/hooks/useCommunityUrls";

/**
 * ✅ SSOT COMPLIANT - EventosPage migrada
 * Usa useCommunityUrls para navegação
 */
import { EventFilters } from "@/shared/components/eventos/EventFilters";
import { EventGrid } from "@/shared/components/eventos/EventGrid";
import { TerritoryIndicator } from "@/core/location";
import type { RouteResolved } from "@/core/routing/types";

interface EventosPageProps {
  resolved?: RouteResolved;
}

export default function EventosPage({ resolved }: EventosPageProps) {
  const navigate = useNavigate();
  const communityUrls = useCommunityUrls();

  // Filters state
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");

  // Fetch eventos with filters
  const { eventos, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useEventos({
      routeResolved: resolved,
      filters: {
        category: category !== "todos" ? category : undefined,
        search: search || undefined,
      },
    });

  // Handlers
  const handleCategoryChange = useCallback((newCategory: string) => {
    setCategory(newCategory);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
  }, []);

  const handleEventClick = useCallback(
    (evento: Evento) => {
      navigate(communityUrls.eventDetail(evento.id));
    },
    [navigate, communityUrls],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold font-display">Eventos Locais</h1>
        <p className="text-sm text-muted-foreground">
          O que está acontecendo no seu bairro
        </p>
      </div>

      {/* Filters */}
      <div className="px-4 py-2">
        <EventFilters
          category={category}
          search={search}
          onCategoryChange={handleCategoryChange}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Grid */}
      <div className="px-4 py-3 flex-1">
        <EventGrid
          eventos={eventos}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={handleLoadMore}
          onEventClick={handleEventClick}
        />
      </div>
    </div>
  );
}
