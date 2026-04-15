/**
 * LandingFeaturedServiceMock
 *
 * Dados de demonstração para a landing do Complexo do Nordeste de Amaralina.
 * Usado em modo mock (VITE_USE_MOCK_DATA=true).
 *
 * Conteúdo coerente com uma vitrine de bairro real — sem fake genérico.
 * Todos os dados são fictícios mas plausíveis para o território.
 *
 * Filtro territorial aplicado: retorna apenas dados dos location_ids do grupo
 * ou do bairro individual, respeitando o TerritoryFilter canônico.
 */

import type { TerritoryFilter } from '@/core/location/types';
import type {
  FeaturedBusiness,
  FeaturedService,
  FeaturedClassified,
  TerritoryStats,
} from './services/LandingFeaturedService';

// ── IDs dos bairros do Complexo (espelha o LocationRepositoryMock) ────────────

const COMPLEXO_LOCATION_IDS = new Set([
  'loc-nordeste-de-amaralina',
  'loc-santa-cruz',
  'loc-chapada-do-rio-vermelho',
  'loc-vale-das-pedrinhas',
]);

// ── Seed de negócios ──────────────────────────────────────────────────────────

const BUSINESSES_SEED: Array<FeaturedBusiness & { location_id: string }> = [
  {
    id: 'biz-001',
    location_id: 'loc-nordeste-de-amaralina',
    name: 'Padaria do Seu Manoel',
    category: 'padaria',
    logo_url: undefined,
    rating: 4.8,
    is_premium: true,
    is_verified: true,
    slug: 'padaria-seu-manoel',
  },
  {
    id: 'biz-002',
    location_id: 'loc-nordeste-de-amaralina',
    name: 'Mercadinho Boa Sorte',
    category: 'mercado',
    logo_url: undefined,
    rating: 4.5,
    is_premium: false,
    is_verified: true,
    slug: 'mercadinho-boa-sorte',
  },
  {
    id: 'biz-003',
    location_id: 'loc-santa-cruz',
    name: 'Salão da Cida',
    category: 'salão de beleza',
    logo_url: undefined,
    rating: 4.9,
    is_premium: true,
    is_verified: true,
    slug: 'salao-da-cida',
  },
  {
    id: 'biz-004',
    location_id: 'loc-chapada-do-rio-vermelho',
    name: 'Lanchonete Sabor do Morro',
    category: 'lanchonete',
    logo_url: undefined,
    rating: 4.3,
    is_premium: false,
    is_verified: false,
    slug: 'lanchonete-sabor-do-morro',
  },
  {
    id: 'biz-005',
    location_id: 'loc-vale-das-pedrinhas',
    name: 'Farmácia Popular Vale',
    category: 'farmácia',
    logo_url: undefined,
    rating: 4.6,
    is_premium: false,
    is_verified: true,
    slug: 'farmacia-popular-vale',
  },
];

// ── Seed de serviços ──────────────────────────────────────────────────────────

const SERVICES_SEED: Array<FeaturedService & { location_id: string }> = [
  {
    id: 'svc-001',
    location_id: 'loc-nordeste-de-amaralina',
    name: 'Dona Zélia — Artesanato',
    category: 'artesanato',
    logo_url: undefined,
    rating: 5.0,
    is_verified: true,
    price_range: 'R$ 30–150',
  },
  {
    id: 'svc-002',
    location_id: 'loc-santa-cruz',
    name: 'Eletricista Seu Raimundo',
    category: 'elétrica',
    logo_url: undefined,
    rating: 4.7,
    is_verified: true,
    price_range: 'R$ 80–300',
  },
  {
    id: 'svc-003',
    location_id: 'loc-nordeste-de-amaralina',
    name: 'Professora Ana — Reforço Escolar',
    category: 'educação',
    logo_url: undefined,
    rating: 4.9,
    is_verified: false,
    price_range: 'R$ 50/h',
  },
  {
    id: 'svc-004',
    location_id: 'loc-chapada-do-rio-vermelho',
    name: 'Pedreiro Josivaldo',
    category: 'construção',
    logo_url: undefined,
    rating: 4.4,
    is_verified: false,
    price_range: 'Sob consulta',
  },
  {
    id: 'svc-005',
    location_id: 'loc-vale-das-pedrinhas',
    name: 'Costureira Margarida',
    category: 'costura',
    logo_url: undefined,
    rating: 4.8,
    is_verified: true,
    price_range: 'R$ 20–80',
  },
];

// ── Seed de classificados ─────────────────────────────────────────────────────

const CLASSIFIEDS_SEED: Array<FeaturedClassified & { location_id: string }> = [
  {
    id: 'cls-001',
    location_id: 'loc-nordeste-de-amaralina',
    titulo: 'Geladeira Brastemp 400L — semi-nova',
    category: 'eletrodomésticos',
    price: 850,
    photos: [],
    created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
  {
    id: 'cls-002',
    location_id: 'loc-santa-cruz',
    titulo: 'Bicicleta aro 26 — ótimo estado',
    category: 'esportes',
    price: 320,
    photos: [],
    created_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
  {
    id: 'cls-003',
    location_id: 'loc-nordeste-de-amaralina',
    titulo: 'Quarto para alugar — Nordeste',
    category: 'imóveis',
    price: 600,
    photos: [],
    created_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
  },
  {
    id: 'cls-004',
    location_id: 'loc-chapada-do-rio-vermelho',
    titulo: 'Celular Samsung A14 — 128GB',
    category: 'eletrônicos',
    price: 750,
    photos: [],
    created_at: new Date(Date.now() - 4 * 86400_000).toISOString(),
  },
  {
    id: 'cls-005',
    location_id: 'loc-vale-das-pedrinhas',
    titulo: 'Sofá 3 lugares — retirar no local',
    category: 'móveis',
    price: 400,
    photos: [],
    created_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
  },
];

// ── Helpers de filtro ─────────────────────────────────────────────────────────

function matchesFilter<T extends { location_id: string }>(
  items: T[],
  filter: TerritoryFilter,
): T[] {
  if (filter.scope === 'none') return [];
  if (filter.scope === 'location') {
    return items.filter((i) => i.location_id === filter.location_id);
  }
  // group
  const ids = new Set(filter.location_ids);
  return items.filter((i) => ids.has(i.location_id));
}

// ── Serviço mock ──────────────────────────────────────────────────────────────

export class LandingFeaturedServiceMock {
  static getFeaturedBusinesses(filter: TerritoryFilter, limit = 4): FeaturedBusiness[] {
    return matchesFilter(BUSINESSES_SEED, filter)
      .sort((a, b) => Number(b.is_premium) - Number(a.is_premium) || b.rating - a.rating)
      .slice(0, limit)
      .map(({ location_id: _loc, ...rest }) => rest);
  }

  static getFeaturedServices(filter: TerritoryFilter, limit = 4): FeaturedService[] {
    return matchesFilter(SERVICES_SEED, filter)
      .sort((a, b) => Number(b.is_verified) - Number(a.is_verified) || b.rating - a.rating)
      .slice(0, limit)
      .map(({ location_id: _loc, ...rest }) => rest);
  }

  static getFeaturedClassifieds(filter: TerritoryFilter, limit = 4): FeaturedClassified[] {
    return matchesFilter(CLASSIFIEDS_SEED, filter)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(({ location_id: _loc, ...rest }) => rest);
  }

  static getTerritoryStats(filter: TerritoryFilter): TerritoryStats {
    return {
      businesses:  matchesFilter(BUSINESSES_SEED,  filter).length,
      services:    matchesFilter(SERVICES_SEED,    filter).length,
      classifieds: matchesFilter(CLASSIFIEDS_SEED, filter).length,
    };
  }
}
