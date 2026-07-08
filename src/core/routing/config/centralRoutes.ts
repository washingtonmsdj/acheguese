import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import type { CommunicationDashboardView } from "@/core/communication-territorial/types/communicationDashboard";

const centralMobilityRoutes = {
  motorista: {
    home: "/central/motorista",
    cadastro: "/central/motorista/cadastro",
    disponibilidade: "/central/motorista/disponibilidade",
    corridas: "/central/motorista/corridas",
    ganhos: "/central/motorista/ganhos",
    configuracoes: "/central/motorista/configuracoes",
  },
  motoboy: {
    home: "/central/motoboy",
    cadastro: "/central/motoboy/cadastro",
    disponibilidade: "/central/motoboy/disponibilidade",
    entregas: "/central/motoboy/entregas",
    ganhos: "/central/motoboy/ganhos",
    configuracoes: "/central/motoboy/configuracoes",
  },
} as const;

export const centralRoutes = {
  home: "/central",
  empresas: {
    list: businessManagementRoutes.list(),
    create: businessManagementRoutes.create(),
    createByVertical: (verticalSlug: string) => businessManagementRoutes.createByVerticalSlug(verticalSlug),
    manage: (businessId: string) => businessManagementRoutes.overview(businessId),
  },
  eventos: {
    list: "/central/eventos",
    create: "/central/eventos/novo",
    edit: (eventId: string) => `/central/eventos/editar/${eventId}`,
    analytics: (eventId: string) => `/central/eventos/analytics/${eventId}`,
  },
  comunicacao: {
    home: "/central/comunicacao",
    channel: (channelSlug: string) => `/central/comunicacao/${channelSlug}`,
    channelWithView: (channelSlug: string, view?: CommunicationDashboardView) =>
      view && view !== "overview"
        ? `/central/comunicacao/${channelSlug}?view=${view}`
        : `/central/comunicacao/${channelSlug}`,
  },
  profissional: {
    home: "/central/profissional",
  },
  servicos: {
    create: "/servicos/cadastrar",
    edit: (serviceId: string) => `/servicos/${serviceId}/editar`,
  },
  motorista: centralMobilityRoutes.motorista,
  motoboy: centralMobilityRoutes.motoboy,
  admin: {
    home: "/admin",
  },
} as const;

export type CentralRoutes = typeof centralRoutes;
