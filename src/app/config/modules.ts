/**
 * Configuração de Módulos
 * 
 * Catálogo de apresentação dos módulos da aplicação.
 * Metadados visuais vivem aqui; o ciclo de vida (active/paused e dependências)
 * pertence exclusivamente a productModuleRegistry.ts.
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
  Navigation,
  Car,
  GraduationCap,
} from 'lucide-react';
import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from './lifecycleRegistry';

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
 * Catálogo centralizado de metadados dos módulos.
 * O status efetivo é derivado diretamente dos registries canônicos de lifecycle.
 */
export const MODULES: Record<string, ModuleConfig> = {
  communityFeed: {
    id: 'community-feed',
    name: 'Feed da Comunidade',
    slug: APP_MODULE_SLUGS.community,
    icon: Users,
    contextMessage: 'Comunidade de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('community'),
    order: 1,
  },

  communityAlerts: {
    id: 'community-alerts',
    name: 'Alertas da Comunidade',
    slug: APP_MODULE_SLUGS.communityAlerts,
    icon: MapPin,
    contextMessage: 'Alertas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('communityAlerts'),
    order: 2,
  },

  communityIssues: {
    id: 'community-issues',
    name: 'Problemas Urbanos',
    slug: APP_MODULE_SLUGS.communityIssues,
    icon: MapPin,
    contextMessage: 'Problemas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('communityIssues'),
    order: 3,
  },

  communityGroups: {
    id: 'community-groups',
    name: 'Grupos',
    slug: APP_MODULE_SLUGS.communityGroups,
    icon: Users,
    contextMessage: 'Grupos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('community'),
    order: 4,
  },

  communityRecommendations: {
    id: 'community-recommendations',
    name: 'Recomendações',
    slug: APP_MODULE_SLUGS.communityRecommendations,
    icon: Users,
    contextMessage: 'Recomendações de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('community'),
    order: 5,
  },

  communityLostFound: {
    id: 'community-lost-found',
    name: 'Achados e Perdidos',
    slug: APP_MODULE_SLUGS.communityLostFound,
    icon: Tag,
    contextMessage: 'Achados e perdidos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('communityLostFound'),
    order: 6,
  },
  
  business: {
    id: 'business',
    name: 'Empresas',
    slug: APP_MODULE_SLUGS.business,
    icon: Building2,
    contextMessage: 'Exibindo empresas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('business'),
    order: 7,
  },
  
  services: {
    id: 'services',
    name: 'Serviços',
    slug: APP_MODULE_SLUGS.services,
    icon: Wrench,
    contextMessage: 'Exibindo serviços de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('services'),
    order: 8,
  },
  
  classifieds: {
    id: 'classifieds',
    name: 'Classificados',
    slug: APP_MODULE_SLUGS.classifieds,
    icon: Tag,
    contextMessage: 'Exibindo anúncios de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('classifieds'),
    order: 9,
  },
  
  events: {
    id: 'community-events',
    name: 'Eventos',
    slug: APP_MODULE_SLUGS.events,
    icon: Calendar,
    contextMessage: 'Exibindo eventos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('events'),
    order: 10,
  },
  
  jobs: {
    id: 'jobs',
    name: 'Vagas',
    slug: APP_MODULE_SLUGS.jobs,
    icon: Briefcase,
    contextMessage: 'Exibindo vagas de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('jobs'),
    order: 11,
  },
  
  gastronomy: {
    id: 'gastronomy',
    name: 'Gastronomia',
    slug: APP_MODULE_SLUGS.gastronomy,
    icon: UtensilsCrossed,
    contextMessage: 'Gastronomia de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('gastronomy'),
    order: 12,
  },
  
  touristPoints: {
    id: 'touristPoints',
    name: 'Pontos Turísticos',
    slug: APP_MODULE_SLUGS.touristPoints,
    icon: MapPin,
    contextMessage: 'Pontos turísticos de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('touristPoints'),
    order: 18,
  },
  
  mobility: {
    id: 'mobility',
    name: 'Mobilidade',
    slug: APP_MODULE_SLUGS.mobility,
    icon: Car,
    contextMessage: 'Mobilidade em',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('mobility'),
    order: 14,
  },

  education: {
    id: 'education',
    name: 'Educação',
    slug: APP_MODULE_SLUGS.education,
    icon: GraduationCap,
    contextMessage: 'Educação em',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('education'),
    order: 15,
  },

  map: {
    id: 'map',
    name: 'Mapa',
    slug: APP_MODULE_SLUGS.map,
    icon: MapPin,
    contextMessage: 'Mapa de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isPlatformCapabilityEnabled('map'),
    order: 16,
  },

  nearby: {
    id: 'nearby',
    name: 'Perto de Mim',
    slug: APP_MODULE_SLUGS.nearby,
    icon: Navigation,
    contextMessage: 'Perto de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isPlatformCapabilityEnabled('nearby'),
    order: 17,
  },

  search: {
    id: 'search',
    name: 'Busca',
    slug: APP_MODULE_SLUGS.search,
    icon: MapPin,
    contextMessage: 'Buscar em',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isPlatformCapabilityEnabled('search'),
    order: 18,
  },

  ranking: {
    id: 'ranking',
    name: 'Ranking',
    slug: APP_MODULE_SLUGS.ranking,
    icon: MapPin,
    contextMessage: 'Ranking de',
    color: 'hsl(var(--primary))',
    isTerritorial: true,
    isActive: isProductModuleEnabled('gamification'),
    order: 13,
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
  
  return MODULES_ARRAY.find(m => m.slug === firstSegment) ?? null;
}

/**
 * Helper: Obter mensagem contextual pela URL
 * 
 * @param pathname - Pathname da URL
 * @returns Mensagem contextual ou null
 */
export function getContextMessageFromPath(pathname: string): string | null {
  // Página inicial: Feed da comunidade
  if (pathname === '/') {
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
  return module?.isActive ? module.contextMessage || null : null;
}
