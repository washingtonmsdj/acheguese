export const businessManagementRoutes = {
  overview: (businessId: string) => `/perfil/empresas/${businessId}`,
  dados: (businessId: string) => `/perfil/empresas/${businessId}/dados`,
  gastronomia: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia`,
  planos: (businessId: string) => `/perfil/empresas/${businessId}/planos`,
  linkPremium: (businessId: string) => `/perfil/empresas/${businessId}/link-premium`,
  analytics: (businessId: string) => `/perfil/empresas/${businessId}/analytics`,
  configuracoes: (businessId: string) => `/perfil/empresas/${businessId}/configuracoes`,
  gastronomySetup: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/setup`,
  gastronomyCardapio: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/cardapio`,
  gastronomyHorarios: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/horarios`,
  gastronomyAreaEntrega: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/area-entrega`,
  gastronomyPedidos: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/pedidos`,
  gastronomyEntregas: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/entregas`,
  gastronomyAnalytics: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/analytics`,
  gastronomyPromocoes: (businessId: string) => `/perfil/empresas/${businessId}/gastronomia/promocoes`,
};

export function getBusinessManagementSectionLabel(pathname: string) {
  if (/\/dados$/.test(pathname)) return "Dados da empresa";
  if (/\/gastronomia(\/|$)/.test(pathname)) return "Gastronomia";
  if (/\/planos$/.test(pathname)) return "Planos";
  if (/\/link-premium$/.test(pathname)) return "Link premium";
  if (/\/analytics$/.test(pathname)) return "Analytics";
  if (/\/configuracoes$/.test(pathname)) return "Configuracoes";
  return "Visao geral";
}
