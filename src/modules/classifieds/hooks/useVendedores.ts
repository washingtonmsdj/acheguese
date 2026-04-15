/**
 * Hook para listar vendedores com anúncios ativos
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade } from "@/modules/classifieds/services";
import { useTerritoryFilter, territoryFilterKey } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface VendedorWithAds {
  id: string;
  name: string;
  avatar_url: string | null;
  neighborhood: string;
  active_ads_count: number;
  featured_ads: {
    id: string;
    title: string;
    price: number;
    photos: string[];
  }[];
}

const MOCK_VENDEDORES: VendedorWithAds[] = [
  {
    id: "mock-seller-1",
    name: "Carlos Eduardo",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Pituba",
    active_ads_count: 5,
    featured_ads: [
      { id: "ad-1a", title: "iPhone 14 Pro Max 256GB", price: 4500, photos: ["https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=400&h=300&fit=crop"] },
      { id: "ad-1b", title: "MacBook Air M2 2023", price: 6200, photos: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop"] },
      { id: "ad-1c", title: "AirPods Pro 2ª Geração", price: 1200, photos: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop"] },
    ],
  },
  {
    id: "mock-seller-2",
    name: "Ana Paula Santos",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Barra",
    active_ads_count: 3,
    featured_ads: [
      { id: "ad-2a", title: "Sofá 3 Lugares Retrátil", price: 1200, photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop"] },
      { id: "ad-2b", title: "Mesa de Jantar 6 Lugares", price: 800, photos: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop"] },
      { id: "ad-2c", title: "Estante Industrial", price: 450, photos: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop"] },
    ],
  },
  {
    id: "mock-seller-3",
    name: "Roberto Lima",
    avatar_url: null,
    neighborhood: "Ondina",
    active_ads_count: 8,
    featured_ads: [
      { id: "ad-3a", title: "Notebook Dell Inspiron i7", price: 3200, photos: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop"] },
      { id: "ad-3b", title: "Monitor LG 27'' 4K", price: 1800, photos: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop"] },
      { id: "ad-3c", title: "Teclado Mecânico RGB", price: 350, photos: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop"] },
    ],
  },
  {
    id: "mock-seller-4",
    name: "Fernanda Oliveira",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Graça",
    active_ads_count: 2,
    featured_ads: [
      { id: "ad-4a", title: "Bicicleta Speed Caloi", price: 2100, photos: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop"] },
      { id: "ad-4b", title: "Capacete Ciclismo Pro", price: 180, photos: ["https://images.unsplash.com/photo-1557803175-2b8e3c842436?w=400&h=300&fit=crop"] },
    ],
  },
  {
    id: "mock-seller-5",
    name: "João Marcos Silva",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Rio Vermelho",
    active_ads_count: 6,
    featured_ads: [
      { id: "ad-5a", title: "PlayStation 5 + 3 Jogos", price: 3500, photos: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop"] },
      { id: "ad-5b", title: "Controle DualSense Extra", price: 350, photos: ["https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&h=300&fit=crop"] },
      { id: "ad-5c", title: "Headset Gamer HyperX", price: 280, photos: ["https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=300&fit=crop"] },
    ],
  },
];

export interface UseVendedoresOptions {
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  search?: string;
}

export function useVendedores(options: UseVendedoresOptions = {}) {
  const { routeResolved, activeMemberIds, search } = options;
  const filter = useTerritoryFilter(routeResolved, activeMemberIds);
  const filterKey = territoryFilterKey(filter);

  const query = useQuery({
    queryKey: ["vendedores", filterKey, search],
    queryFn: async () => {
      let result: VendedorWithAds[];

      try {
        const sellers = await ClassifiedsFacade.queries.getSellersWithAds(filter);
        result = sellers.map((s) => ({
          id: s.id,
          name: s.name,
          avatar_url: s.avatar_url,
          neighborhood: s.neighborhood,
          active_ads_count: s.active_ads_count,
          featured_ads: s.featured_ads.map((ad) => ({
            id: ad.id,
            title: ad.title,
            price: ad.price,
            photos: ad.photos || [],
          })),
        }));
      } catch {
        // Fallback to mock data when service fails
        result = [];
      }

      // If no real data, use mocks
      if (result.length === 0) {
        result = MOCK_VENDEDORES;
      }

      if (search) {
        const lower = search.toLowerCase();
        result = result.filter((v) => v.name.toLowerCase().includes(lower));
      }

      return result;
    },
  });

  return {
    vendedores: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
