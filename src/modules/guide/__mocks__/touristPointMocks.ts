/**
 * Mock data for tourist points — item-first experience
 *
 * Dados estáticos para desenvolvimento enquanto o backend não tem os campos expandidos.
 */

import type { TouristPoint } from '../types';
import type { TouristPointCategory } from '../types/categories';

// ── Category shortcut cards ──────────────────────────────────────────────────

export interface TouristCategoryShortcut {
  id: string;
  label: string;
  emoji: string;
  categoryFilter: TouristPointCategory;
  count: number;
  image: string;
}

export const TOURIST_CATEGORY_SHORTCUTS: TouristCategoryShortcut[] = [
  {
    id: 'cat-praia',
    label: 'Praias',
    emoji: '🏖️',
    categoryFilter: 'praia',
    count: 12,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-historico',
    label: 'Histórico',
    emoji: '🏰',
    categoryFilter: 'historico',
    count: 8,
    image: 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-museu',
    label: 'Museus',
    emoji: '🏛️',
    categoryFilter: 'museu',
    count: 6,
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-parque',
    label: 'Parques',
    emoji: '🌿',
    categoryFilter: 'parque',
    count: 5,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-mirante',
    label: 'Mirantes',
    emoji: '🏔️',
    categoryFilter: 'mirante',
    count: 4,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-igreja',
    label: 'Igrejas',
    emoji: '⛪',
    categoryFilter: 'igreja',
    count: 7,
    image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-mercado',
    label: 'Mercados',
    emoji: '🛍️',
    categoryFilter: 'mercado',
    count: 3,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-cultural',
    label: 'Centros Culturais',
    emoji: '🎭',
    categoryFilter: 'centro-cultural',
    count: 4,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
  },
];

// ── Mock tourist points with extended fields ─────────────────────────────────

export interface MockTouristPointExtended extends Partial<TouristPoint> {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  address_text: string | null;
  price_type: TouristPoint['price_type'];
  status: TouristPoint['status'];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category: TouristPointCategory;
  rating: number;
  review_count: number;
  is_free: boolean;
  is_accessible: boolean;
  is_family_friendly: boolean;
  neighborhood: string;
  latitude: number;
  longitude: number;
  tips: string | null;
  how_to_get_there: string | null;
}

export const MOCK_TOURIST_POINTS: MockTouristPointExtended[] = [
  {
    id: 'tp-1',
    location_id: 'loc-salvador',
    slug: 'elevador-lacerda',
    title: 'Elevador Lacerda',
    summary: 'O cartão postal de Salvador, ligando Cidade Alta e Cidade Baixa desde 1873.',
    description: 'O Elevador Lacerda é o primeiro elevador urbano público do mundo. Oferece uma vista panorâmica deslumbrante da Baía de Todos os Santos.',
    address_text: 'Praça Tomé de Souza, Centro Histórico',
    price_type: 'paid',
    price_text: 'R$ 0,15',
    opening_hours: 'Diariamente, 6h às 23h',
    accessibility_notes: 'Acessível para cadeirantes',
    official_url: null,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'historico',
    rating: 4.7,
    review_count: 2340,
    is_free: false,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Centro Histórico',
    latitude: -12.974017,
    longitude: -38.513290,
    tips: 'Vá no final da tarde para o pôr do sol mais bonito da cidade.',
    how_to_get_there: 'Ônibus até Praça Municipal ou metrô até Campo da Pólvora.',
    media: [
      { id: 'm1-1', tourist_point_id: 'tp-1', url: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=1200&q=85', alt_text: 'Elevador Lacerda — vista frontal', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm1-2', tourist_point_id: 'tp-1', url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=85', alt_text: 'Elevador Lacerda — vista noturna', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm1-3', tourist_point_id: 'tp-1', url: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1200&q=85', alt_text: 'Vista da Baía de Todos os Santos', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm1-4', tourist_point_id: 'tp-1', url: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=85', alt_text: 'Cidade Baixa vista do Elevador', is_cover: false, display_order: 3, created_at: '' },
      { id: 'm1-5', tourist_point_id: 'tp-1', url: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=1200&q=85', alt_text: 'Detalhes da estrutura do elevador', is_cover: false, display_order: 4, created_at: '' },
    ],
  },
  {
    id: 'tp-2',
    location_id: 'loc-salvador',
    slug: 'pelourinho',
    title: 'Pelourinho',
    summary: 'Centro histórico tombado pela UNESCO com casarões coloniais coloridos.',
    description: 'O Pelourinho é o coração cultural de Salvador, com igrejas barrocas, música ao vivo, restaurantes e galerias de arte.',
    address_text: 'Pelourinho, Salvador',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Aberto 24h (comércio varia)',
    accessibility_notes: 'Ruas de paralelepípedo, acesso parcial.',
    official_url: null,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'historico',
    rating: 4.8,
    review_count: 5120,
    is_free: true,
    is_accessible: false,
    is_family_friendly: true,
    neighborhood: 'Pelourinho',
    latitude: -12.971389,
    longitude: -38.509444,
    tips: 'Terça é dia de Olodum! Chegue cedo para garantir lugar.',
    how_to_get_there: 'Elevador Lacerda + caminhada, ou táxi direto.',
    media: [
      { id: 'm2-1', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?w=1200&q=85', alt_text: 'Casarões coloridos do Pelourinho', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm2-2', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85', alt_text: 'Largo do Pelourinho', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm2-3', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=85', alt_text: 'Ruas do Centro Histórico', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm2-4', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&q=85', alt_text: 'Igreja no Pelourinho', is_cover: false, display_order: 3, created_at: '' },
      { id: 'm2-5', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=85', alt_text: 'Vista aérea do Pelourinho', is_cover: false, display_order: 4, created_at: '' },
      { id: 'm2-6', tourist_point_id: 'tp-2', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85', alt_text: 'Noite no Pelourinho', is_cover: false, display_order: 5, created_at: '' },
    ],
  },
  {
    id: 'tp-3',
    location_id: 'loc-salvador',
    slug: 'farol-da-barra',
    title: 'Farol da Barra',
    summary: 'Farol histórico com museu náutico e a praia mais famosa de Salvador.',
    description: 'O Forte de Santo Antônio da Barra abriga o Farol da Barra e o Museu Náutico, com vista privilegiada do pôr do sol.',
    address_text: 'Largo do Farol da Barra, Barra',
    price_type: 'paid',
    price_text: 'R$ 20',
    opening_hours: 'Ter-Dom, 9h às 18h',
    accessibility_notes: 'Acesso limitado ao forte.',
    official_url: null,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'praia',
    rating: 4.9,
    review_count: 4500,
    is_free: false,
    is_accessible: false,
    is_family_friendly: true,
    neighborhood: 'Barra',
    latitude: -13.010556,
    longitude: -38.532778,
    tips: 'Melhor pôr do sol de Salvador. Leve uma canga e chegue às 16h.',
    how_to_get_there: 'Ônibus até Barra ou táxi/app.',
    media: [
      { id: 'm3-1', tourist_point_id: 'tp-3', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85', alt_text: 'Farol da Barra — vista panorâmica', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm3-2', tourist_point_id: 'tp-3', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85', alt_text: 'Forte de Santo Antônio da Barra', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm3-3', tourist_point_id: 'tp-3', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85', alt_text: 'Pôr do sol no Farol da Barra', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm3-4', tourist_point_id: 'tp-3', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85', alt_text: 'Praia ao lado do Farol', is_cover: false, display_order: 3, created_at: '' },
      { id: 'm3-5', tourist_point_id: 'tp-3', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=85', alt_text: 'Museu Náutico interior', is_cover: false, display_order: 4, created_at: '' },
    ],
  },
  {
    id: 'tp-4',
    location_id: 'loc-salvador',
    slug: 'mercado-modelo',
    title: 'Mercado Modelo',
    summary: 'O mercado de artesanato mais tradicional da Bahia.',
    description: 'Antigo mercado de escravos transformado no maior centro de artesanato baiano. Encontre lembranças, comidas típicas e capoeira.',
    address_text: 'Praça Visconde de Cayru, Comércio',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Seg-Sáb, 9h às 18h',
    accessibility_notes: 'Térreo acessível.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'mercado',
    rating: 4.3,
    review_count: 1800,
    is_free: true,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Comércio',
    latitude: -12.974583,
    longitude: -38.514722,
    tips: 'Negocie os preços! Os vendedores esperam isso.',
    how_to_get_there: 'Desça pelo Elevador Lacerda, fica em frente.',
    media: [
      { id: 'm4-1', tourist_point_id: 'tp-4', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85', alt_text: 'Fachada do Mercado Modelo', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm4-2', tourist_point_id: 'tp-4', url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&q=85', alt_text: 'Artesanato baiano', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm4-3', tourist_point_id: 'tp-4', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85', alt_text: 'Interior do mercado', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm4-4', tourist_point_id: 'tp-4', url: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=85', alt_text: 'Vista da Baía desde o Mercado', is_cover: false, display_order: 3, created_at: '' },
    ],
  },
  {
    id: 'tp-5',
    location_id: 'loc-salvador',
    slug: 'igreja-do-bonfim',
    title: 'Igreja do Nosso Senhor do Bonfim',
    summary: 'A igreja mais famosa de Salvador e símbolo de fé da Bahia.',
    description: 'Construída em 1745, é palco da icônica Lavagem do Bonfim. As fitinhas coloridas amarradas nas grades são tradição.',
    address_text: 'Largo do Bonfim, Bonfim',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Diariamente, 6h30 às 18h',
    accessibility_notes: 'Rampas disponíveis.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'igreja',
    rating: 4.8,
    review_count: 3200,
    is_free: true,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Bonfim',
    latitude: -12.923056,
    longitude: -38.509167,
    tips: 'Amarre 3 fitinhas e faça 3 pedidos — tradição local!',
    how_to_get_there: 'Ônibus "Bonfim" ou táxi.',
    media: [
      { id: 'm5-1', tourist_point_id: 'tp-5', url: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&q=85', alt_text: 'Fachada da Igreja do Bonfim', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm5-2', tourist_point_id: 'tp-5', url: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=1200&q=85', alt_text: 'Fitinhas do Bonfim', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm5-3', tourist_point_id: 'tp-5', url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=85', alt_text: 'Interior da igreja', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm5-4', tourist_point_id: 'tp-5', url: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=85', alt_text: 'Largo do Bonfim', is_cover: false, display_order: 3, created_at: '' },
    ],
  },
  {
    id: 'tp-6',
    location_id: 'loc-salvador',
    slug: 'dique-do-tororo',
    title: 'Dique do Tororó',
    summary: 'Lago urbano com esculturas dos orixás e pista de caminhada.',
    description: 'O Dique do Tororó é um dos cartões postais de Salvador, com as famosas esculturas de orixás de Tati Moreno.',
    address_text: 'Dique do Tororó, Tororó',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Aberto 24h',
    accessibility_notes: 'Pista plana, acessível.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'parque',
    rating: 4.4,
    review_count: 1560,
    is_free: true,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Tororó',
    latitude: -12.982778,
    longitude: -38.497222,
    tips: 'Ótimo para caminhada matinal. Cuidado com o sol a partir das 10h.',
    how_to_get_there: 'Metrô Estação Lapa + 10 min caminhada.',
    media: [
      { id: 'm6-1', tourist_point_id: 'tp-6', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=85', alt_text: 'Esculturas dos orixás no Dique', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm6-2', tourist_point_id: 'tp-6', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85', alt_text: 'Vista panorâmica do lago', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm6-3', tourist_point_id: 'tp-6', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85', alt_text: 'Pista de caminhada', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm6-4', tourist_point_id: 'tp-6', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=85', alt_text: 'Entardecer no Dique', is_cover: false, display_order: 3, created_at: '' },
    ],
  },
  {
    id: 'tp-7',
    location_id: 'loc-salvador',
    slug: 'museu-de-arte-moderna',
    title: 'Museu de Arte Moderna da Bahia',
    summary: 'MAM-BA com exposições contemporâneas e vista para a baía.',
    description: 'Instalado no Solar do Unhão, conjunto arquitetônico do séc. XVI, o MAM oferece exposições, oficinas e eventos culturais.',
    address_text: 'Av. Contorno, Solar do Unhão',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Ter-Dom, 13h às 19h',
    accessibility_notes: 'Parcialmente acessível.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'museu',
    rating: 4.5,
    review_count: 980,
    is_free: true,
    is_accessible: false,
    is_family_friendly: true,
    neighborhood: 'Contorno',
    latitude: -12.983056,
    longitude: -38.522222,
    tips: 'Domingo à tarde tem jam session de jazz no pôr do sol.',
    how_to_get_there: 'Táxi ou Uber até Solar do Unhão.',
    media: [
      { id: 'm7-1', tourist_point_id: 'tp-7', url: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=1200&q=85', alt_text: 'Solar do Unhão — MAM', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm7-2', tourist_point_id: 'tp-7', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=85', alt_text: 'Exposição de arte contemporânea', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm7-3', tourist_point_id: 'tp-7', url: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1200&q=85', alt_text: 'Vista da baía desde o MAM', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm7-4', tourist_point_id: 'tp-7', url: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=1200&q=85', alt_text: 'Jardins do museu', is_cover: false, display_order: 3, created_at: '' },
    ],
  },
  {
    id: 'tp-8',
    location_id: 'loc-salvador',
    slug: 'praia-do-porto-da-barra',
    title: 'Praia do Porto da Barra',
    summary: 'Praia urbana de águas calmas, eleita uma das melhores do mundo.',
    description: 'Considerada uma das praias mais bonitas do mundo pelo The Guardian. Águas cristalinas e calmas, ideal para banho.',
    address_text: 'Porto da Barra, Barra',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Aberto 24h',
    accessibility_notes: 'Esteiras de acesso na areia em alguns pontos.',
    official_url: null,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'praia',
    rating: 4.6,
    review_count: 6100,
    is_free: true,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Barra',
    latitude: -13.004167,
    longitude: -38.531389,
    tips: 'Cedo de manhã a praia é quase vazia. Acarajé da Dinha fica perto.',
    how_to_get_there: 'Ônibus até Porto da Barra ou a pé desde o Farol.',
    media: [
      { id: 'm8-1', tourist_point_id: 'tp-8', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85', alt_text: 'Praia do Porto da Barra — vista geral', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm8-2', tourist_point_id: 'tp-8', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85', alt_text: 'Águas cristalinas', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm8-3', tourist_point_id: 'tp-8', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85', alt_text: 'Pôr do sol na praia', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm8-4', tourist_point_id: 'tp-8', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1200&q=85', alt_text: 'Manhã tranquila na Barra', is_cover: false, display_order: 3, created_at: '' },
      { id: 'm8-5', tourist_point_id: 'tp-8', url: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=1200&q=85', alt_text: 'Vista aérea Porto da Barra', is_cover: false, display_order: 4, created_at: '' },
    ],
  },
  {
    id: 'tp-9',
    location_id: 'loc-salvador',
    slug: 'ponta-de-humaita',
    title: 'Ponta de Humaitá',
    summary: 'Mirante natural com vista espetacular da Baía de Todos os Santos.',
    description: 'Localizado na ponta da península de Itapagipe, oferece vista 180° da baía, sol poente e brisa constante.',
    address_text: 'Ponta de Humaitá, Monte Serrat',
    price_type: 'free',
    price_text: null,
    opening_hours: 'Aberto 24h',
    accessibility_notes: 'Terreno irregular.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'mirante',
    rating: 4.5,
    review_count: 720,
    is_free: true,
    is_accessible: false,
    is_family_friendly: true,
    neighborhood: 'Monte Serrat',
    latitude: -12.927639,
    longitude: -38.501944,
    tips: 'Pôr do sol incrível. Leve algo para beber.',
    how_to_get_there: 'Ônibus até Bonfim e caminhe 15min.',
    media: [
      { id: 'm9-1', tourist_point_id: 'tp-9', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85', alt_text: 'Vista do mirante de Humaitá', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm9-2', tourist_point_id: 'tp-9', url: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=1200&q=85', alt_text: 'Baía de Todos os Santos ao entardecer', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm9-3', tourist_point_id: 'tp-9', url: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=85', alt_text: 'Rochas na ponta', is_cover: false, display_order: 2, created_at: '' },
    ],
  },
  {
    id: 'tp-10',
    location_id: 'loc-salvador',
    slug: 'teatro-castro-alves',
    title: 'Teatro Castro Alves',
    summary: 'O maior e mais importante teatro da Bahia.',
    description: 'Inaugurado em 1967, é palco de grandes espetáculos musicais, teatrais e de dança. Arquitetura modernista icônica.',
    address_text: 'Praça Dois de Julho, Campo Grande',
    price_type: 'range',
    price_text: 'R$ 20 - R$ 200',
    opening_hours: 'Conforme programação',
    accessibility_notes: 'Totalmente acessível.',
    official_url: null,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-15',
    created_by: null,
    updated_by: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    category: 'centro-cultural',
    rating: 4.6,
    review_count: 1100,
    is_free: false,
    is_accessible: true,
    is_family_friendly: true,
    neighborhood: 'Campo Grande',
    latitude: -12.988056,
    longitude: -38.511111,
    tips: 'Confira a programação online antes de ir. Shows gratuitos na concha acústica.',
    how_to_get_there: 'Metrô até Campo da Pólvora + 5min caminhada.',
    media: [
      { id: 'm10-1', tourist_point_id: 'tp-10', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=85', alt_text: 'Fachada do Teatro Castro Alves', is_cover: true, display_order: 0, created_at: '' },
      { id: 'm10-2', tourist_point_id: 'tp-10', url: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=1200&q=85', alt_text: 'Palco principal', is_cover: false, display_order: 1, created_at: '' },
      { id: 'm10-3', tourist_point_id: 'tp-10', url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&q=85', alt_text: 'Concha acústica', is_cover: false, display_order: 2, created_at: '' },
      { id: 'm10-4', tourist_point_id: 'tp-10', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85', alt_text: 'Interior do teatro', is_cover: false, display_order: 3, created_at: '' },
    ],
  },
];

// ── Helper functions ─────────────────────────────────────────────────────────

export function getMockFeaturedPoints(): MockTouristPointExtended[] {
  return MOCK_TOURIST_POINTS.filter(p => p.is_featured);
}

export function getMockFreePoints(): MockTouristPointExtended[] {
  return MOCK_TOURIST_POINTS.filter(p => p.is_free);
}

export function getMockTopRatedPoints(limit = 6): MockTouristPointExtended[] {
  return [...MOCK_TOURIST_POINTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getMockPointsByCategory(category: TouristPointCategory): MockTouristPointExtended[] {
  return MOCK_TOURIST_POINTS.filter(p => p.category === category);
}

export function searchMockPoints(query: string): MockTouristPointExtended[] {
  const q = query.toLowerCase();
  return MOCK_TOURIST_POINTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    p.neighborhood.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
}
