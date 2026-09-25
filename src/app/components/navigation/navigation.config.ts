/**
 * Navigation Configuration - SSOT
 *
 * Single Source of Truth para todos os itens de navegacao da aplicacao.
 * Usado pelo AppSidebar legado nas rotas ainda não migradas.
 * Os seis destinos canônicos do Território Vivo vivem em
 * src/core/navigation/territoryNavigationModes.ts e são consumidos por
 * TerritoryAdaptiveNavigation + BottomNav.
 */

import {
  Home,
  Building2,
  Wrench,
  Tag,
  UtensilsCrossed,
  Calendar,
  Briefcase,
  Users,
  Map,
  Car,
  Search,
  MapPin,
  GraduationCap,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from '@/app/config/lifecycleRegistry';
import type { PlatformCapabilityKey } from '@/app/config/platformCapabilityRegistry';
import type { ProductModuleKey } from '@/app/config/productModuleRegistry';
import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/shared/config/moduleSlugs';

type NavigationLifecycle =
  | { kind: 'always' }
  | { kind: 'product'; key: ProductModuleKey }
  | { kind: 'capability'; key: PlatformCapabilityKey };

export interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  lifecycle: NavigationLifecycle;
  description?: string;
  requiresAuth?: boolean;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_MODULE_ROOTS = {
  business: buildAppModulePath(APP_MODULE_SLUGS.business),
  gastronomy: buildAppModulePath(APP_MODULE_SLUGS.gastronomy),
  services: buildAppModulePath(APP_MODULE_SLUGS.services),
  education: buildAppModulePath(APP_MODULE_SLUGS.education),
  classifieds: buildAppModulePath(APP_MODULE_SLUGS.classifieds),
  jobs: buildAppModulePath(APP_MODULE_SLUGS.jobs),
  events: buildAppModulePath(APP_MODULE_SLUGS.events),
  map: buildAppModulePath(APP_MODULE_SLUGS.map),
  nearby: buildAppModulePath(APP_MODULE_SLUGS.nearby),
  mobility: buildAppModulePath(APP_MODULE_SLUGS.mobility),
} as const;

/**
 * Sidebar desktop.
 *
 * A sidebar deve levar a destinos principais. Fluxos especificos de comunidade
 * ficam dentro de "Meu Bairro", onde o usuario ja tem contexto territorial.
 */
const RAW_NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      {
        id: 'home',
        lifecycle: { kind: 'always' },
        icon: Home,
        label: 'Hoje',
        href: '/',
        description: 'Home do território atual',
      },
      {
        id: 'neighborhood',
        lifecycle: { kind: 'product', key: 'community' },
        icon: Users,
        label: 'Meu Bairro',
        href: LAUNCH_URLS.community,
        description: 'Hub da comunidade',
        requiresAuth: true,
      },
      {
        id: 'business',
        lifecycle: { kind: 'product', key: 'business' },
        icon: Building2,
        label: 'Empresas',
        href: NAV_MODULE_ROOTS.business,
        description: 'Empresas locais',
      },
      {
        id: 'gastronomy',
        lifecycle: { kind: 'product', key: 'gastronomy' },
        icon: UtensilsCrossed,
        label: 'Gastronomia',
        href: NAV_MODULE_ROOTS.gastronomy,
        description: 'Restaurantes e cardápios',
      },
      {
        id: 'services',
        lifecycle: { kind: 'product', key: 'services' },
        icon: Wrench,
        label: 'Serviços',
        href: NAV_MODULE_ROOTS.services,
        description: 'Profissionais locais',
      },
      {
        id: 'education',
        lifecycle: { kind: 'product', key: 'education' },
        icon: GraduationCap,
        label: 'Educação',
        href: NAV_MODULE_ROOTS.education,
        description: 'Cursos e escolas locais',
      },
      {
        id: 'classifieds',
        lifecycle: { kind: 'product', key: 'classifieds' },
        icon: Tag,
        label: 'Classificados',
        href: NAV_MODULE_ROOTS.classifieds,
        description: 'Anúncios locais',
      },
    ],
  },
  {
    id: 'management',
    label: 'Gestão',
    items: [
      {
        id: 'central',
        lifecycle: { kind: 'capability', key: 'central' },
        icon: LayoutGrid,
        label: 'Central',
        href: '/central',
        description: 'Hub de gestão e operação',
        requiresAuth: true,
      },
    ],
  },
  {
    id: 'opportunities',
    label: 'Oportunidades',
    items: [
      {
        id: 'jobs',
        lifecycle: { kind: 'product', key: 'jobs' },
        icon: Briefcase,
        label: 'Vagas',
        href: NAV_MODULE_ROOTS.jobs,
        description: 'Oportunidades de emprego',
      },
      {
        id: 'events',
        lifecycle: { kind: 'product', key: 'events' },
        icon: Calendar,
        label: 'Eventos',
        href: NAV_MODULE_ROOTS.events,
        description: 'Agenda local',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    items: [
      {
        id: 'nearby',
        lifecycle: { kind: 'capability', key: 'nearby' },
        icon: MapPin,
        label: 'Perto de Mim',
        href: NAV_MODULE_ROOTS.nearby,
        description: 'Descubra o que está próximo',
      },
      {
        id: 'map',
        lifecycle: { kind: 'capability', key: 'map' },
        icon: Map,
        label: 'Mapa',
        href: NAV_MODULE_ROOTS.map,
        description: 'Mapa de empresas',
      },
      {
        id: 'mobility',
        lifecycle: { kind: 'product', key: 'mobility' },
        icon: Car,
        label: 'Mobilidade',
        href: NAV_MODULE_ROOTS.mobility,
        description: 'Caronas e transporte',
      },
      {
        id: 'search',
        lifecycle: { kind: 'capability', key: 'search' },
        icon: Search,
        label: 'Busca',
        href: '/busca',
        description: 'Busca no conteúdo ativo',
      },
    ],
  },
];

function isNavigationItemEnabled(item: NavItem): boolean {
  switch (item.lifecycle.kind) {
    case 'always':
      return true;
    case 'product':
      return isProductModuleEnabled(item.lifecycle.key);
    case 'capability':
      return isPlatformCapabilityEnabled(item.lifecycle.key);
  }
}

function filterNavigationSections(
  sections: readonly NavSection[],
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(isNavigationItemEnabled),
    }))
    .filter((section) => section.items.length > 0);
}

export const NAV_SECTIONS: NavSection[] =
  filterNavigationSections(RAW_NAV_SECTIONS);
