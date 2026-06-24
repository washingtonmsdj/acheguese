import type { ElementType } from 'react';
import { Building2, Car, Home, User, Bike, Calendar, Radio } from 'lucide-react';
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from '@/config/launchScope';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { centralRoutes } from '@/modules/central/routes/centralRoutes';

export interface CentralNavItem {
  id: string;
  icon: ElementType;
  label: string;
  href: string;
  description?: string;
  children?: CentralNavItem[];
  subItems?: CentralNavItem[];
}

export interface CentralNavSection {
  id: string;
  label: string;
  items: CentralNavItem[];
}

const CENTRAL_PRIMARY_NAV_IDS = [
  'central-home',
  'business-list',
  'events-list',
  'communication-home',
  'professional-home',
  'driver-home',
  'motoboy-home',
] as const;

const CENTRAL_NAV_ITEM_SURFACES: Partial<Record<string, LaunchSurfaceKey>> = {
  'events-list': 'events',
  'events-new': 'events',
  'communication-home': 'communication',
  'driver-home': 'mobility',
  'driver-cadastro': 'mobility',
  'driver-disponibilidade': 'mobility',
  'driver-corridas': 'mobility',
  'driver-ganhos': 'mobility',
  'driver-configuracoes': 'mobility',
  'motoboy-home': 'mobility',
  'motoboy-cadastro': 'mobility',
  'motoboy-disponibilidade': 'mobility',
  'motoboy-entregas': 'mobility',
  'motoboy-ganhos': 'mobility',
  'motoboy-configuracoes': 'mobility',
};

function isCentralNavItemEnabled(item: CentralNavItem): boolean {
  const surface = CENTRAL_NAV_ITEM_SURFACES[item.id];
  return surface ? isLaunchSurfaceEnabled(surface) : true;
}

const RAW_CENTRAL_NAV_SECTIONS: CentralNavSection[] = [
  {
    id: 'overview',
    label: 'Visao Geral',
    items: [
      {
        id: 'central-home',
        icon: Home,
        label: 'Inicio',
        href: centralRoutes.home,
        description: 'Visao geral da Central',
      },
    ],
  },
  {
    id: 'business',
    label: 'Empresas',
    items: [
      {
        id: 'business-list',
        icon: Building2,
        label: 'Minhas Empresas',
        href: businessManagementRoutes.list(),
        description: 'Gerenciar empresas',
      },
    ],
  },
  {
    id: 'events',
    label: 'Eventos',
    items: [
      {
        id: 'events-list',
        icon: Calendar,
        label: 'Meus Eventos',
        href: centralRoutes.eventos.list,
        description: 'Gerenciar eventos',
      },
      {
        id: 'events-new',
        icon: Calendar,
        label: 'Criar Evento',
        href: centralRoutes.eventos.create,
        description: 'Criar novo evento',
      },
    ],
  },
  {
    id: 'communication',
    label: 'Comunicacao',
    items: [
      {
        id: 'communication-home',
        icon: Radio,
        label: 'Meus Canais',
        href: centralRoutes.comunicacao.home,
        description: 'Publicar conteudo territorial',
      },
    ],
  },
  {
    id: 'professional',
    label: 'Profissional',
    items: [
      {
        id: 'professional-home',
        icon: User,
        label: 'Perfil Profissional',
        href: centralRoutes.profissional.home,
        description: 'Gerenciar perfil profissional',
      },
    ],
  },
  {
    id: 'driver',
    label: 'Motorista',
    items: [
      {
        id: 'driver-home',
        icon: Car,
        label: 'Inicio',
        href: centralRoutes.motorista.home,
        description: 'Resumo operacional',
      },
      {
        id: 'driver-cadastro',
        icon: Car,
        label: 'Cadastro',
        href: centralRoutes.motorista.cadastro,
        description: 'Dados e documentos',
      },
      {
        id: 'driver-disponibilidade',
        icon: Car,
        label: 'Disponibilidade',
        href: centralRoutes.motorista.disponibilidade,
        description: 'Controle online/offline',
      },
      {
        id: 'driver-corridas',
        icon: Car,
        label: 'Corridas',
        href: centralRoutes.motorista.corridas,
        description: 'Marketplace de corridas',
      },
      {
        id: 'driver-ganhos',
        icon: Car,
        label: 'Ganhos',
        href: centralRoutes.motorista.ganhos,
        description: 'Resumo de ganhos',
      },
      {
        id: 'driver-configuracoes',
        icon: Car,
        label: 'Configuracoes',
        href: centralRoutes.motorista.configuracoes,
        description: 'Preferencias e notificacoes',
      },
    ],
  },
  {
    id: 'motoboy',
    label: 'Motoboy',
    items: [
      {
        id: 'motoboy-home',
        icon: Bike,
        label: 'Inicio',
        href: centralRoutes.motoboy.home,
        description: 'Resumo operacional',
      },
      {
        id: 'motoboy-cadastro',
        icon: Bike,
        label: 'Cadastro',
        href: centralRoutes.motoboy.cadastro,
        description: 'Dados e documentos',
      },
      {
        id: 'motoboy-disponibilidade',
        icon: Bike,
        label: 'Disponibilidade',
        href: centralRoutes.motoboy.disponibilidade,
        description: 'Controle online/offline',
      },
      {
        id: 'motoboy-entregas',
        icon: Bike,
        label: 'Entregas',
        href: centralRoutes.motoboy.entregas,
        description: 'Marketplace de entregas',
      },
      {
        id: 'motoboy-ganhos',
        icon: Bike,
        label: 'Ganhos',
        href: centralRoutes.motoboy.ganhos,
        description: 'Resumo de ganhos',
      },
      {
        id: 'motoboy-configuracoes',
        icon: Bike,
        label: 'Configuracoes',
        href: centralRoutes.motoboy.configuracoes,
        description: 'Preferencias e notificacoes',
      },
    ],
  },
];

export const CENTRAL_NAV_SECTIONS: CentralNavSection[] = RAW_CENTRAL_NAV_SECTIONS
  .map((section) => ({
    ...section,
    items: section.items.filter(isCentralNavItemEnabled),
  }))
  .filter((section) => section.items.length > 0);

export function getCentralPrimaryNavItems(): CentralNavItem[] {
  const allItems = CENTRAL_NAV_SECTIONS.flatMap((section) => section.items);
  return CENTRAL_PRIMARY_NAV_IDS.map((id) => allItems.find((item) => item.id === id)).filter(
    (item): item is CentralNavItem => Boolean(item),
  );
}
