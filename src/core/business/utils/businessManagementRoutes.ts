export interface BusinessRouteTarget {
  target?: "central" | "legacy";
}

export const businessManagementRoutes = {
  list: (opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? "/perfil/empresas" : "/central/empresas",
  overview: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}` : `/central/empresas/${businessId}`,
  dados: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/dados` : `/central/empresas/${businessId}/dados`,
  gastronomia: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia` : `/central/empresas/${businessId}/gastronomia`,
  planos: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/planos` : `/central/empresas/${businessId}/planos`,
  linkPremium: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/link-premium` : `/central/empresas/${businessId}/link-premium`,
  analytics: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/analytics` : `/central/empresas/${businessId}/analytics`,
  configuracoes: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/configuracoes` : `/central/empresas/${businessId}/configuracoes`,
  gastronomySetup: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/setup` : `/central/empresas/${businessId}/gastronomia/setup`,
  gastronomyCardapio: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/cardapio` : `/central/empresas/${businessId}/gastronomia/cardapio`,
  gastronomyHorarios: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/horarios` : `/central/empresas/${businessId}/gastronomia/horarios`,
  gastronomyAreaEntrega: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/area-entrega` : `/central/empresas/${businessId}/gastronomia/area-entrega`,
  gastronomyPedidos: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/pedidos` : `/central/empresas/${businessId}/gastronomia/pedidos`,
  gastronomyPedidoDetalhe: (businessId: string, orderId: string, opts?: BusinessRouteTarget) =>
    `${businessManagementRoutes.gastronomyPedidos(businessId, opts)}/${orderId}`,
  gastronomyPedidoPublico: (orderId: string) =>
    `/gastronomia/pedidos/${orderId}`,
  gastronomyEntregas: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/entregas` : `/central/empresas/${businessId}/gastronomia/entregas`,
  gastronomyAnalytics: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/analytics` : `/central/empresas/${businessId}/gastronomia/analytics`,
  gastronomyPromocoes: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/gastronomia/promocoes` : `/central/empresas/${businessId}/gastronomia/promocoes`,
  education: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education` : `/central/empresas/${businessId}/education`,
  educationSetup: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/setup` : `/central/empresas/${businessId}/education/setup`,
  educationProgramas: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/programas` : `/central/empresas/${businessId}/education/programas`,
  educationLeads: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/leads` : `/central/empresas/${businessId}/education/leads`,
  educationEventos: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/eventos` : `/central/empresas/${businessId}/education/eventos`,
  educationAnalytics: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/analytics` : `/central/empresas/${businessId}/education/analytics`,
  educationPlanos: (businessId: string, opts?: BusinessRouteTarget) =>
    opts?.target === "legacy" ? `/perfil/empresas/${businessId}/education/planos` : `/central/empresas/${businessId}/education/planos`,
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
