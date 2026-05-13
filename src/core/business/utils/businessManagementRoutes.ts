export const businessManagementRoutes = {
  list: () => "/central/empresas",
  create: () => "/central/empresas/nova",
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
  education: (businessId: string) => `/central/empresas/${businessId}/education`,
  educationSetup: (businessId: string) => `/central/empresas/${businessId}/education/setup`,
  educationProgramas: (businessId: string) => `/central/empresas/${businessId}/education/programas`,
  educationLeads: (businessId: string) => `/central/empresas/${businessId}/education/leads`,
  educationEventos: (businessId: string) => `/central/empresas/${businessId}/education/eventos`,
  educationAnalytics: (businessId: string) => `/central/empresas/${businessId}/education/analytics`,
  educationPlanos: (businessId: string) => `/central/empresas/${businessId}/education/planos`,
};

export function getBusinessManagementSectionLabel(pathname: string) {
  if (/\/dados$/.test(pathname)) return "Dados da empresa";
  if (/\/gastronomia(\/|$)/.test(pathname)) return "Gastronomia";
  if (/\/education(\/|$)/.test(pathname)) return "Educação";
  if (/\/planos$/.test(pathname)) return "Planos";
  if (/\/link-premium$/.test(pathname)) return "Link premium";
  if (/\/analytics$/.test(pathname)) return "Analytics";
  if (/\/configuracoes$/.test(pathname)) return "Configuracoes";
  return "Visao geral";
}
