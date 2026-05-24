import { logger } from '@/shared/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { ClassifiedsService, mapToClassificadoList } from "@/modules/classifieds/services";
import {
  useModuleTerritoryFilter,
  type ModuleTerritoryUiFilter,
} from "@/core/location/hooks/useModuleTerritoryFilter";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { ClassifiedData } from "../services/types";
import type { TerritoryFilter } from "@/core/location/types";
export interface ClassificadoWithVendedor {
  id: string;
  public_id: string;
  slug: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  subcategoria?: string | null;
  condition?: string; // novo | seminovo | usado
  aceita_troca?: boolean;
  entrega_disponivel?: boolean;
  fotos: string[];
  status: string;
  bairro: string;
  location_id?: string;
  seller_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at?: string;
  // Dados para construir URL canônica
  geographic_path?: string;
  category_slug?: string;
  subcategory_slug?: string;
  vendedor: {
    id: string;
    nome: string;
    avatar_url: string | null;
    rating?: number;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
}

interface UseClassificadosOptions {
  enabled?: boolean;
  filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    priceMin?: number;
    priceMax?: number;
  };
  /** Território resolvido pela rota — passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
  /** IDs dos membros ativos do grupo (quando routeResolved.kind === 'group') */
  activeMemberIds?: string[];
  territoryFilter?: TerritoryFilter;
  uiTerritoryFilter?: ModuleTerritoryUiFilter;
}

export function useClassificados(options: UseClassificadosOptions = {}) {
  const { filters, routeResolved } = options;

  // Filtro territorial canônico — suporta location e group
  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved,
    uiFilter: options.uiTerritoryFilter,
  });
  const filter = options.territoryFilter ?? moduleTerritory.territoryFilter;
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);

  const query = useQuery({
    // filterKey garante invalidação correta ao trocar de território
    queryKey: ["classificados", filterKey, filters],
    queryFn: async () => {
      let mapped: ClassificadoWithVendedor[];

      try {
        // Passa o filtro territorial para o service — query real no backend
        const data = await ClassifiedsService.queries.getAllClassifieds(filter);

        // Filtros locais de UI (categoria, busca, preço)
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
        logger.warn('[useClassificados] API failed', error);
        mapped = [];
      }
      return mapped as ClassificadoWithVendedor[];
    },
    enabled: options.enabled ?? true, // Sempre executa por padrao - filtro territorial e opcional
  });

  return {
    classificados: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    /** Filtro territorial ativo */
    filter,
    /** Indica se há filtro territorial ativo */
    hasTerritory: filterReady,
  };
}
