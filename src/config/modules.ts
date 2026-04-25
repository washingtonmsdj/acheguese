/**
 * Configuração de Módulos
 * 
 * SSOT para todos os módulos territoriais da aplicação.
 * Define metadados, rotas e comportamentos de forma centralizada.
 * 
 * Princípio: Adicionar um novo módulo deve ser trivial - apenas uma entrada aqui.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Building2,
  Wrench,
  Tag,
  Calendar,
  Briefcase,
  UtensilsCrossed,
  MapPin,
  Car,
} from 'lucide-react';

export interface ModuleConfig {
  /** Identificador único do módulo */
  id: string;
  
  /** Nome de exibição */
  name: string;
  
  /** Slug usado nas URLs (ex: /empresas, /servicos) */
  slug: string;
  
  /** Ícone do módulo */
  icon: LucideIcon;
  
  /** Mensagem contextual na topbar (ex: "Exibindo empresas de") */
  contextMessage?: string;
  
  /** Cor de destaque (opcional) */
  color?: string;
  
  /** Se o módulo é territorial (tem rotas /:state/:city) */
  isTerritorial: boolean;
  
  /** Se o módulo está ativo/disponível */
  isActive: boolean;
  
  /** Ordem de exibição em menus */
  order: number;
}

/**
 * Configuração centralizada de todos os módulos
 * 
 * IMPORTANTE: Esta é a única fonte de verdade para módulos.
 * Qualquer novo módulo deve ser adicionado aqui.
 */
export const MODULES: Record<string, ModuleConfig> = {
  community: {
    id: 'community',
    name: 'Comunidade',
    slug: 'comunidade',
    icon: Users,
    contextMessage: 'Comunidade de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 1,
  },
  
  business: {
    id: 'business',
    name: 'Empresas',
    slug: 'empresas',
    icon: Building2,
    contextMessage: 'Exibindo empresas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 2,
  },
  
  services: {
    id: 'services',
    name: 'Serviços',
    slug: 'servicos',
    icon: Wrench,
    contextMessage: 'Exibindo serviços de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 3,
  },
  
  classifieds: {
    id: 'classifieds',
    name: 'Classificados',
    slug: 'classificados',
    icon: Tag,
    contextMessage: 'Exibindo anúncios de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 4,
  },
  
  events: {
    id: 'events',
    name: 'Eventos',
    slug: 'eventos',
    icon: Calendar,
    contextMessage: 'Exibindo eventos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 5,
  },
  
  jobs: {
    id: 'jobs',
    name: 'Vagas',
    slug: 'vagas',
    icon: Briefcase,
    contextMessage: 'Exibindo vagas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 6,
  },
  
  gastronomy: {
    id: 'gastronomy',
    name: 'Gastronomia',
    slug: 'gastronomia',
    icon: UtensilsCrossed,
    contextMessage: 'Gastronomia de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 7,
  },
  
  touristPoints: {
    id: 'touristPoints',
    name: 'Pontos Turísticos',
    slug: 'pontos-turisticos',
    icon: MapPin,
    contextMessage: 'Pontos turísticos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 8,
  },
  
  mobility: {
    id: 'mobility',
    name: 'Mobilidade',
    slug: 'mobilidade',
    icon: Car,
    contextMessage: 'Mobilidade em',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: true,
    order: 9,
  },
  
  map: {
    id: 'map',
    name: 'Mapa',
    slug: 'mapa',
    icon: MapPin,
    contextMessage: 'Mapa de',
    color: 'hsl(var(--primary))',
    isTerritorial: false,
    isActive: true,
    order: 10,
  },
  
  search: {
    id: 'search',
    name: 'Busca',
    slug: 'busca',
    icon: MapPin,
    contextMessage: 'Buscar em',
    color: 'hsl(var(--primary))',
    isTerritorial: false,
    isActive: true,
    order: 11,
  },
  
  ranking: {
    id: 'ranking',
    name: 'Ranking',
    slug: 'ranking',
    icon: MapPin,
    contextMessage: 'Ranking de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,  // ✅ É territorial - mostra ranking do bairro/cidade
    isActive: true,
    order: 12,
  },
} as const;

/**
 * Array de módulos ordenados
 */
export const MODULES_ARRAY = Object.values(MODULES).sort((a, b) => a.order - b.order);

/**
 * Apenas módulos ativos
 */
export const ACTIVE_MODULES = MODULES_ARRAY.filter(m => m.isActive);

/**
 * Apenas módulos territoriais
 */
export const TERRITORIAL_MODULES = MODULES_ARRAY.filter(m => m.isTerritorial);

function getModuleById(moduleId: string): ModuleConfig | null {
  switch (moduleId) {
    case 'community':
      return MODULES.community;
    case 'business':
      return MODULES.business;
    case 'services':
      return MODULES.services;
    case 'classifieds':
      return MODULES.classifieds;
    case 'events':
      return MODULES.events;
    case 'jobs':
      return MODULES.jobs;
    case 'gastronomy':
      return MODULES.gastronomy;
    case 'touristPoints':
      return MODULES.touristPoints;
    case 'mobility':
      return MODULES.mobility;
    case 'map':
      return MODULES.map;
    case 'search':
      return MODULES.search;
    case 'ranking':
      return MODULES.ranking;
    default:
      return null;
  }
}

function resolveLegacyAlias(firstSegment: string): string | null {
  switch (firstSegment) {
    case 'business':
      return 'business';
    case 'pontos-turisticos':
      return 'guide';
    default:
      return null;
  }
}

/**
 * Helper: Detectar módulo pela URL
 * 
 * @param pathname - Pathname da URL (ex: /empresas/ba/salvador)
 * @returns ModuleConfig ou null
 */
export function detectModuleFromPath(pathname: string): ModuleConfig | null {
  // Remove leading slash e pega o primeiro segmento
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  const firstSegment = segments[0];
  
  // Busca por slug exato
  const module = MODULES_ARRAY.find(m => m.slug === firstSegment);
  if (module) return module;
  
  // Aliases legados
  const moduleId = resolveLegacyAlias(firstSegment);
  return moduleId ? getModuleById(moduleId) : null;
}

/**
 * Helper: Obter mensagem contextual pela URL
 * 
 * @param pathname - Pathname da URL
 * @returns Mensagem contextual ou null
 */
export function getContextMessageFromPath(pathname: string): string | null {
  // Página inicial: Feed da comunidade
  if (pathname === '/' || pathname === '/home-v1') {
    return 'Feed de';
  }
  
  // Landing pages territoriais: /ba/salvador ou /ba/salvador/bairro
  // Detecta se é uma rota territorial sem módulo (apenas 2 ou 3 segmentos)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 2 || segments.length === 3) {
    // Verifica se o primeiro segmento NÃO é um módulo conhecido
    const firstSegment = segments[0];
    const isModule = MODULES_ARRAY.some(m => m.slug === firstSegment);
    
    if (!isModule) {
      // É uma landing page territorial (ex: /ba/salvador)
      return 'Início de';
    }
  }
  
  // Módulos territoriais
  const module = detectModuleFromPath(pathname);
  return module?.contextMessage || null;
}
