import { getBusinessCreateRoute, type VerticalKey } from "@/core/verticals/config";

export const businessManagementRoutes = {
  list: () => "/central/empresas",
  create: (vertical?: VerticalKey) => getBusinessCreateRoute(vertical),
  overview: (businessId: string) => `/central/empresas/${businessId}`,
  dados: (businessId: string) => `/central/empresas/${businessId}/dados`,
  gastronomia: (businessId: string) => `/central/empresas/${businessId}/gastronomia`,
  planos: (businessId: string) => `/central/empresas/${businessId}/planos`,
  linkPremium: (businessId: string) => `/central/empresas/${businessId}/link-premium`,
  analytics: (businessId: string) => `/central/empresas/${businessId}/analytics`,
  configuracoes: (businessId: string) => `/central/empresas/${businessId}/configuracoes`,
  gastronomySetup: (businessId: string) => `/central/empresas/${businessId}/gastronomia/setup`,
  gastronomyCardapio: (businessId: string) => `/central/empresas/${businessId}/gastronomia/cardapio`,
  gastronomyHorarios: (businessId: string) => `/central/empresas/${businessId}/gastronomia/horarios`,
  gastronomyAreaEntrega: (businessId: string) => `/central/empresas/${businessId}/gastronomia/area-entrega`,
  gastronomyPedidos: (businessId: string) => `/central/empresas/${businessId}/gastronomia/pedidos`,
  gastronomyPedidoDetalhe: (businessId: string, orderId: string) =>
    `${businessManagementRoutes.gastronomyPedidos(businessId)}/${orderId}`,
  gastronomyPedidoPublico: (orderId: string) =>
    `/gastronomia/pedidos/${orderId}`,
  gastronomyEntregas: (businessId: string) => `/central/empresas/${businessId}/gastronomia/entregas`,
  gastronomyAnalytics: (businessId: string) => `/central/empresas/${businessId}/gastronomia/analytics`,
  gastronomyPromocoes: (businessId: string) => `/central/empresas/${businessId}/gastronomia/promocoes`,
  education: (businessId: string) => `/central/empresas/${businessId}/educacao`,
  educationSetup: (businessId: string) => `/central/empresas/${businessId}/educacao/setup`,
  educationProgramas: (businessId: string) => `/central/empresas/${businessId}/educacao/programas`,
  educationLeads: (businessId: string) => `/central/empresas/${businessId}/educacao/leads`,
  educationEventos: (businessId: string) => `/central/empresas/${businessId}/educacao/eventos`,
  educationAnalytics: (businessId: string) => `/central/empresas/${businessId}/educacao/analytics`,
  educationPlanos: (businessId: string) => `/central/empresas/${businessId}/educacao/planos`,
};

export function getBusinessManagementSectionLabel(pathname: string) {
  if (/\/dados$/.test(pathname)) return "Dados da empresa";
  if (/\/gastronomia(\/|$)/.test(pathname)) return "Gastronomia";
  if (/\/educacao(\/|$)/.test(pathname)) return "Educação";
  if (/\/planos$/.test(pathname)) return "Planos";
  if (/\/link-premium$/.test(pathname)) return "Link premium";
  if (/\/analytics$/.test(pathname)) return "Analytics";
  if (/\/configuracoes$/.test(pathname)) return "Configurações";
  return "Visão geral";
}
