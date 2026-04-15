/**
 * Navigation Configuration - SSOT
 * 
 * Single Source of Truth para todos os itens de navegação da aplicação.
 * Usado por AppSidebar (desktop) e AppBottomNav (mobile).
 * 
 * Para adicionar um novo item:
 * 1. Adicione na seção apropriada em NAV_SECTIONS
 * 2. Se for importante para mobile, adicione em MOBILE_NAV_ITEMS
 * 3. Pronto! Aparecerá automaticamente em todos os componentes de navegação
 */

import {
  Home, Building2, Wrench, Tag, UtensilsCrossed,
  Calendar, Briefcase, Users, UsersRound, Megaphone,
  PackageSearch, Map, Car, Search, Trophy, MessageCircle,
  BarChart3, MapPin,
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
 * Seções de navegação para desktop (sidebar)
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'explore',
    label: 'Explorar',
    items: [
      { 
        id: 'home', 
        icon: Home, 
        label: 'Início', 
        href: '/', 
        description: 'Feed Principal' 
      },
      { 
        id: 'business', 
        icon: Building2, 
        label: 'Empresas', 
        href: LAUNCH_URLS.business, 
        description: 'Empresas Locais' 
      },
      { 
        id: 'services', 
        icon: Wrench, 
        label: 'Serviços', 
        href: LAUNCH_URLS.services, 
        description: 'Profissionais Locais' 
      },
      { 
        id: 'classifieds', 
        icon: Tag, 
        label: 'Classificados', 
        href: LAUNCH_URLS.classifieds, 
        description: 'Anúncios' 
      },
      { 
        id: 'gastronomy', 
        icon: UtensilsCrossed, 
        label: 'Gastronomia', 
        href: LAUNCH_URLS.gastronomy, 
        description: 'Restaurantes e Cardápios' 
      },
      { 
        id: 'events', 
        icon: Calendar, 
        label: 'Eventos', 
        href: LAUNCH_URLS.events, 
        description: 'Eventos Locais' 
      },
      { 
        id: 'jobs', 
        icon: Briefcase, 
        label: 'Vagas', 
        href: LAUNCH_URLS.jobs, 
        description: 'Oportunidades de Emprego' 
      },
    ],
  },
  {
    id: 'community',
    label: 'Comunidade',
    items: [
      { 
        id: 'neighborhood', 
        icon: Users, 
        label: 'Meu Bairro', 
        href: LAUNCH_URLS.community, 
        description: 'Comunidade do Bairro', 
        requiresAuth: true 
      },
      { 
        id: 'feed', 
        icon: UsersRound, 
        label: 'Feed Local', 
        href: `${LAUNCH_URLS.community}?tab=feed`, 
        description: 'Feed da Comunidade' 
      },
      { 
        id: 'recommendations', 
        icon: Megaphone, 
        label: 'Recomendações', 
        href: '/recomendacoes', 
        description: 'Recomendações da Comunidade' 
      },
      { 
        id: 'lostfound', 
        icon: PackageSearch, 
        label: 'Achados e Perdidos', 
        href: '/achados-perdidos', 
        description: 'Objetos Perdidos e Encontrados' 
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
        description: 'Descubra o que está próximo' 
      },
      { 
        id: 'map', 
        icon: Map, 
        label: 'Mapa', 
        href: '/mapa', 
        description: 'Mapa de Empresas' 
      },
      { 
        id: 'mobility', 
        icon: Car, 
        label: 'Mobilidade', 
        href: '/mobilidade', 
        description: 'Caronas e Transporte' 
      },
      { 
        id: 'search', 
        icon: Search, 
        label: 'Busca', 
        href: '/busca', 
        description: 'Buscar no Achegue-se' 
      },
      { 
        id: 'ranking', 
        icon: Trophy, 
        label: 'Ranking', 
        href: '/ranking', 
        description: 'Ranking de Usuários' 
      },
      { 
        id: 'analytics', 
        icon: BarChart3, 
        label: 'Analytics', 
        href: '/analytics', 
        description: 'Dashboards e Métricas', 
        requiresAuth: true 
      },
      { 
        id: 'messages', 
        icon: MessageCircle, 
        label: 'Mensagens', 
        href: '/mensagens', 
        description: 'Mensagens Privadas', 
        requiresAuth: true 
      },
    ],
  },
];

/**
 * Itens de navegação para mobile (bottom nav)
 * Versão simplificada com os itens mais importantes
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { 
    id: 'home', 
    icon: Home, 
    label: 'Início', 
    href: '/', 
    description: 'Feed Principal' 
  },
  { 
    id: 'business', 
    icon: Building2, 
    label: 'Empresas', 
    href: LAUNCH_URLS.business, 
    description: 'Empresas Locais' 
  },
  { 
    id: 'community', 
    icon: Users, 
    label: 'Comunidade', 
    href: LAUNCH_URLS.community, 
    description: 'Comunidade' 
  },
  // Botão "Postar" é inserido aqui dinamicamente no componente
  { 
    id: 'gastronomy', 
    icon: UtensilsCrossed, 
    label: 'Gastronomia', 
    href: LAUNCH_URLS.gastronomy, 
    description: 'Restaurantes e Cardápios' 
  },
  { 
    id: 'classifieds', 
    icon: Tag, 
    label: 'Anúncios', 
    href: LAUNCH_URLS.classifieds, 
    description: 'Classificados' 
  },
  { 
    id: 'services', 
    icon: Wrench, 
    label: 'Serviços', 
    href: LAUNCH_URLS.services, 
    description: 'Profissionais Locais' 
  },
  { 
    id: 'map', 
    icon: Map, 
    label: 'Mapa', 
    href: '/mapa', 
    description: 'Mapa de Empresas' 
  },
];

/**
 * Helper: Encontrar item por ID
 */
export function findNavItem(id: string): NavItem | undefined {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(i => i.id === id);
    if (item) return item;
  }
  return MOBILE_NAV_ITEMS.find(i => i.id === id);
}

/**
 * Helper: Obter todos os itens (flat)
 */
export function getAllNavItems(): NavItem[] {
  return NAV_SECTIONS.flatMap(section => section.items);
}
