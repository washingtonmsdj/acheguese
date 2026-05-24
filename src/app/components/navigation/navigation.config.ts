/**
 * Navigation Configuration - SSOT
 *
 * Single Source of Truth para todos os itens de navegacao da aplicacao.
 * Usado por AppSidebar (desktop) e AppBottomNav (mobile).
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
import { LAUNCH_URLS } from '@/config/territory';

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

/**
 * Sidebar desktop.
 *
 * A sidebar deve levar a destinos principais. Fluxos especificos de comunidade
 * ficam dentro de "Meu Bairro", onde o usuario ja tem contexto territorial.
 */
export const NAV_SECTIONS: NavSection[] = [
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
        href: '/empresas',
        description: 'Empresas locais',
      },
      {
        id: 'gastronomy',
        icon: UtensilsCrossed,
        label: 'Gastronomia',
        href: '/gastronomia',
        description: 'Restaurantes e cardápios',
      },
      {
        id: 'services',
        icon: Wrench,
        label: 'Serviços',
        href: '/servicos',
        description: 'Profissionais locais',
      },
      {
        id: 'education',
        icon: GraduationCap,
        label: 'Educação',
        href: '/educacao',
        description: 'Cursos e escolas locais',
      },
      {
        id: 'classifieds',
        icon: Tag,
        label: 'Classificados',
        href: '/classificados',
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
        href: '/vagas',
        description: 'Oportunidades de emprego',
      },
      {
        id: 'events',
        icon: Calendar,
        label: 'Eventos',
        href: '/eventos',
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
        href: '/mapa',
        description: 'Mapa de empresas e serviços',
      },
      {
        id: 'mobility',
        icon: Car,
        label: 'Mobilidade',
        href: '/mobilidade',
        description: 'Caronas e transporte',
      },
      {
        id: 'search',
        icon: Search,
        label: 'Busca',
        href: '/buscar',
        description: 'Busca inteligente territorial',
      },
    ],
  },
];

/**
 * Itens de navegacao para mobile (bottom nav).
 * Versao simplificada com os itens mais importantes.
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    icon: Home,
    label: 'Início',
    href: '/',
    description: 'Página inicial',
  },
  {
    id: 'business',
    icon: Building2,
    label: 'Empresas',
    href: '/empresas',
    description: 'Empresas locais',
  },
  {
    id: 'community',
    icon: Users,
    label: 'Meu Bairro',
    href: LAUNCH_URLS.community,
    description: 'Comunidade',
  },
  {
    id: 'gastronomy',
    icon: UtensilsCrossed,
    label: 'Gastronomia',
    href: '/gastronomia',
    description: 'Restaurantes e cardápios',
  },
  {
    id: 'classifieds',
    icon: Tag,
    label: 'Anúncios',
    href: '/classificados',
    description: 'Classificados',
  },
  {
    id: 'services',
    icon: Wrench,
    label: 'Serviços',
    href: '/servicos',
    description: 'Profissionais locais',
  },
  {
    id: 'map',
    icon: Map,
    label: 'Mapa',
    href: '/mapa',
    description: 'Mapa',
  },
];

export function findNavItem(id: string): NavItem | undefined {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.id === id);
    if (item) return item;
  }
  return MOBILE_NAV_ITEMS.find((i) => i.id === id);
}

export function getAllNavItems(): NavItem[] {
  return NAV_SECTIONS.flatMap((section) => section.items);
}
