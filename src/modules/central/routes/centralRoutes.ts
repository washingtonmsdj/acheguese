import type { CommunicationDashboardView } from "@/modules/communication-territorial/types/communicationDashboard";
import { mobilityRoutes } from "@/modules/mobility/routes/mobilityRoutes";

export const centralRoutes = {
  home: "/central",
  empresas: {
    list: "/central/empresas",
    create: "/central/empresas/nova",
    createByVertical: (verticalSlug: string) => `/central/empresas/nova/${verticalSlug}`,
    manage: (businessId: string) => `/central/empresas/${businessId}`,
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
    create: "/services/cadastrar",
    edit: (serviceId: string) => `/services/${serviceId}/editar`,
  },
  motorista: mobilityRoutes.motorista,
  motoboy: mobilityRoutes.motoboy,
  admin: {
    home: "/admin",
  },
} as const;

export type CentralRoutes = typeof centralRoutes;
