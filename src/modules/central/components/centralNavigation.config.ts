import { Building2, Car, Home, LayoutGrid, User, Bike } from 'lucide-react';

export interface CentralNavItem {
  id: string;
  icon: React.ElementType;
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

/**
 * Estrutura de navegação da Central
 * 
 * Áreas:
 * - Visão geral
 * - Empresas
 * - Profissional
 * - Motorista
 * - Motoboy
 */
export const CENTRAL_NAV_SECTIONS: CentralNavSection[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    items: [
      {
        id: 'central-home',
        icon: Home,
        label: 'Início',
        href: '/central',
        description: 'Visão geral da Central',
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
        href: '/central/empresas',
        description: 'Gerenciar empresas',
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
        href: '/central/profissional',
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
        label: 'Início',
        href: '/central/motorista',
        description: 'Resumo operacional',
      },
      {
        id: 'driver-cadastro',
        icon: Car,
        label: 'Cadastro',
        href: '/central/motorista/cadastro',
        description: 'Dados e documentos',
      },
      {
        id: 'driver-disponibilidade',
        icon: Car,
        label: 'Disponibilidade',
        href: '/central/motorista/disponibilidade',
        description: 'Controle online/offline',
      },
      {
        id: 'driver-corridas',
        icon: Car,
        label: 'Corridas',
        href: '/central/motorista/corridas',
        description: 'Marketplace de corridas',
      },
      {
        id: 'driver-ganhos',
        icon: Car,
        label: 'Ganhos',
        href: '/central/motorista/ganhos',
        description: 'Resumo de ganhos',
      },
      {
        id: 'driver-configuracoes',
        icon: Car,
        label: 'Configurações',
        href: '/central/motorista/configuracoes',
        description: 'Preferências e notificações',
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
        label: 'Início',
        href: '/central/motoboy',
        description: 'Resumo operacional',
      },
      {
        id: 'motoboy-cadastro',
        icon: Bike,
        label: 'Cadastro',
        href: '/central/motoboy/cadastro',
        description: 'Dados e documentos',
      },
      {
        id: 'motoboy-disponibilidade',
        icon: Bike,
        label: 'Disponibilidade',
        href: '/central/motoboy/disponibilidade',
        description: 'Controle online/offline',
      },
      {
        id: 'motoboy-entregas',
        icon: Bike,
        label: 'Entregas',
        href: '/central/motoboy/entregas',
        description: 'Marketplace de entregas',
      },
      {
        id: 'motoboy-ganhos',
        icon: Bike,
        label: 'Ganhos',
        href: '/central/motoboy/ganhos',
        description: 'Resumo de ganhos',
      },
      {
        id: 'motoboy-configuracoes',
        icon: Bike,
        label: 'Configurações',
        href: '/central/motoboy/configuracoes',
        description: 'Preferências e notificações',
      },
    ],
  },
];
