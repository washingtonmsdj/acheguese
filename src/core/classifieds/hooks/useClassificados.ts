import { logger } from '@/shared/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade, mapToClassificadoList } from "@/core/classifieds/services";
import { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from "@/core/location";
import { MOCK_CLASSIFIEDS } from "@/core/classifieds/data/mock-classifieds";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { ClassifiedData } from "../services/types";
export interface ClassificadoWithVendedor {
  id: string;
  public_id: string;
  slug: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  condition?: string; // novo | seminovo | usado
  fotos: string[];
  status: string;
  bairro: string;
  created_at: string;
  // Dados para construir URL canÃ´nica
  geographic_path?: string;
  category_slug?: string;
  subcategory_slug?: string;
  vendedor: {
    id: string;
    nome: string;
    avatar_url: string | null;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
}

interface UseClassificadosOptions {
  filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    priceMin?: number;
    priceMax?: number;
  };
  /** TerritÃ³rio resolvido pela rota â€” passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
  /** IDs dos membros ativos do grupo (quando routeResolved.kind === 'group') */
  activeMemberIds?: string[];
}

export function useClassificados(options: UseClassificadosOptions = {}) {
  const { filters, routeResolved, activeMemberIds } = options;

  // Filtro territorial canÃ´nico â€” suporta location e group
  const filter = useTerritoryFilter(routeResolved, activeMemberIds);
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);

  const query = useQuery({
    // filterKey garante invalidaÃ§Ã£o correta ao trocar de territÃ³rio
    queryKey: ["classificados", filterKey, filters],
    queryFn: async () => {
      let mapped: ClassificadoWithVendedor[];

      try {
        // Passa o filtro territorial para o service â€” query real no backend
        const data = await ClassifiedsFacade.queries.getAllClassifieds(filter);

        // Filtros locais de UI (categoria, busca, preÃ§o)
        let filtered = data;

        if (filters?.category) {
          filtered = filtered.filter((item) => item.category === filters.category);
        }

        if (filters?.search) {
          const s = filters.search.toLowerCase();
          filtered = filtered.filter((item) =>
            item.title.toLowerCase().includes(s) ||
            item.category?.toLowerCase().includes(s) ||
            item.neighborhood?.toLowerCase().includes(s) ||
            item.seller_name?.toLowerCase().includes(s)
          );
        }

        if (filters?.priceMin) {
          filtered = filtered.filter((item) => item.price >= filters.priceMin!);
        }

        if (filters?.priceMax) {
          filtered = filtered.filter((item) => item.price <= filters.priceMax!);
        }

        mapped = mapToClassificadoList(filtered as ClassifiedData[]);
      } catch (error) {
        logger.warn('[useClassificados] API failed, using mock data:', error);
        mapped = [];
      }

      // âœ… Fallback: usa mock data quando API retorna vazio
      if (mapped.length === 0) {
        let mocks = [...MOCK_CLASSIFIEDS];

        if (filters?.category) {
          mocks = mocks.filter((m) => m.categoria === filters.category);
        }
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          mocks = mocks.filter((m) =>
            m.titulo.toLowerCase().includes(s) ||
            m.categoria?.toLowerCase().includes(s) ||
            m.bairro?.toLowerCase().includes(s) ||
            m.vendedor?.nome?.toLowerCase().includes(s)
          );
        }
        if (filters?.priceMin) {
          mocks = mocks.filter((m) => m.preco >= filters.priceMin!);
        }
        if (filters?.priceMax) {
          mocks = mocks.filter((m) => m.preco <= filters.priceMax!);
        }

        return mocks;
      }

      return mapped as ClassificadoWithVendedor[];
    },
    enabled: true, // Sempre executa - filtro territorial Ã© opcional
  });

  return {
    classificados: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    /** Filtro territorial ativo */
    filter,
    /** Indica se hÃ¡ filtro territorial ativo */
    hasTerritory: filterReady,
  };
}

