import { Building2, Car, Home, User, Bike, Calendar, Radio } from 'lucide-react';
import { mobilityRoutes } from '@/modules/mobility/routes/mobilityRoutes';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

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
        href: '/central/eventos',
        description: 'Gerenciar eventos',
      },
      {
        id: 'events-new',
        icon: Calendar,
        label: 'Criar Evento',
        href: '/central/eventos/novo',
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
        href: '/central/comunicacao',
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
        href: mobilityRoutes.motorista.home,
        description: 'Resumo operacional',
      },
      {
        id: 'driver-cadastro',
        icon: Car,
        label: 'Cadastro',
        href: mobilityRoutes.motorista.cadastro,
        description: 'Dados e documentos',
      },
      {
        id: 'driver-disponibilidade',
        icon: Car,
        label: 'Disponibilidade',
        href: mobilityRoutes.motorista.disponibilidade,
        description: 'Controle online/offline',
      },
      {
        id: 'driver-corridas',
        icon: Car,
        label: 'Corridas',
        href: mobilityRoutes.motorista.corridas,
        description: 'Marketplace de corridas',
      },
      {
        id: 'driver-ganhos',
        icon: Car,
        label: 'Ganhos',
        href: mobilityRoutes.motorista.ganhos,
        description: 'Resumo de ganhos',
      },
      {
        id: 'driver-configuracoes',
        icon: Car,
        label: 'Configurações',
        href: mobilityRoutes.motorista.configuracoes,
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
        href: mobilityRoutes.motoboy.home,
        description: 'Resumo operacional',
      },
      {
        id: 'motoboy-cadastro',
        icon: Bike,
        label: 'Cadastro',
        href: mobilityRoutes.motoboy.cadastro,
        description: 'Dados e documentos',
      },
      {
        id: 'motoboy-disponibilidade',
        icon: Bike,
        label: 'Disponibilidade',
        href: mobilityRoutes.motoboy.disponibilidade,
        description: 'Controle online/offline',
      },
      {
        id: 'motoboy-entregas',
        icon: Bike,
        label: 'Entregas',
        href: mobilityRoutes.motoboy.entregas,
        description: 'Marketplace de entregas',
      },
      {
        id: 'motoboy-ganhos',
        icon: Bike,
        label: 'Ganhos',
        href: mobilityRoutes.motoboy.ganhos,
        description: 'Resumo de ganhos',
      },
      {
        id: 'motoboy-configuracoes',
        icon: Bike,
        label: 'Configurações',
        href: mobilityRoutes.motoboy.configuracoes,
        description: 'Preferências e notificações',
      },
    ],
  },
];
