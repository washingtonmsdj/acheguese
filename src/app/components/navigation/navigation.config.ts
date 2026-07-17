/**
 * Navigation Configuration - SSOT
 *
 * Single Source of Truth para todos os itens de navegacao da aplicacao.
 * Usado pelo AppSidebar. A navegacao mobile publica canonica vive em
 * src/core/navigation/BottomNav.tsx porque depende do contexto territorial.
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
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/config/moduleSlugs';
import { LAUNCH_URLS } from '@/config/territory';
import { filterLaunchSections } from '@/config/launchScope';
import { gastronomyPublicRoutes } from '@/core/verticals/gastronomy/routes/gastronomyPublicRoutes';

export interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
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
  gastronomy: gastronomyPublicRoutes.home(),
  services: buildAppModulePath(APP_MODULE_SLUGS.services),
  education: buildAppModulePath(APP_MODULE_SLUGS.education),
  classifieds: buildAppModulePath(APP_MODULE_SLUGS.classifieds),
  jobs: buildAppModulePath(APP_MODULE_SLUGS.jobs),
  events: buildAppModulePath(APP_MODULE_SLUGS.events),
  map: buildAppModulePath(APP_MODULE_SLUGS.map),
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
        icon: Home,
        label: 'Início',
        href: '/',
        description: 'Página inicial',
      },
      {
        id: 'neighborhood',
        icon: Users,
        label: 'Meu Bairro',
        href: LAUNCH_URLS.community,
        description: 'Hub da comunidade',
        requiresAuth: true,
      },
      {
        id: 'business',
        icon: Building2,
        label: 'Empresas',
        href: NAV_MODULE_ROOTS.business,
        description: 'Empresas locais',
      },
      {
        id: 'gastronomy',
        icon: UtensilsCrossed,
        label: 'Gastronomia',
        href: NAV_MODULE_ROOTS.gastronomy,
        description: 'Restaurantes e cardápios',
      },
      {
        id: 'services',
        icon: Wrench,
        label: 'Serviços',
        href: NAV_MODULE_ROOTS.services,
        description: 'Profissionais locais',
      },
      {
        id: 'education',
        icon: GraduationCap,
        label: 'Educação',
        href: NAV_MODULE_ROOTS.education,
        description: 'Cursos e escolas locais',
      },
      {
        id: 'classifieds',
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
        icon: Briefcase,
        label: 'Vagas',
        href: NAV_MODULE_ROOTS.jobs,
        description: 'Oportunidades de emprego',
      },
      {
        id: 'events',
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
        icon: MapPin,
        label: 'Perto de Mim',
        href: '/perto-de-mim',
        description: 'Descubra o que está próximo',
      },
      {
        id: 'map',
        icon: Map,
        label: 'Mapa',
        href: NAV_MODULE_ROOTS.map,
        description: 'Mapa de empresas e serviços',
      },
      {
        id: 'mobility',
        icon: Car,
        label: 'Mobilidade',
        href: NAV_MODULE_ROOTS.mobility,
        description: 'Caronas e transporte',
      },
      {
        id: 'search',
        icon: Search,
        label: 'Busca',
        href: '/busca',
        description: 'Busca territorial federada',
      },
    ],
  },
];

export const NAV_SECTIONS: NavSection[] = filterLaunchSections(RAW_NAV_SECTIONS);
