export const APP_MODULE_SLUGS = {
  community: "comunidade",
  communityAlerts: "alertas",
  communityIssues: "problemas",
  communityGroups: "grupos",
  communityRecommendations: "recomendacoes",
  communityLostFound: "achados-perdidos",
  business: "empresas",
  services: "servicos",
  classifieds: "classificados",
  events: "eventos",
  jobs: "vagas",
  gastronomy: "gastronomia",
  touristPoints: "pontos-turisticos",
  mobility: "mobilidade",
  education: "educacao",
  map: "mapa",
  search: "busca",
  ranking: "ranking",
} as const;

export type AppModuleSlug = typeof APP_MODULE_SLUGS[keyof typeof APP_MODULE_SLUGS];

export function buildAppModulePath(slug: AppModuleSlug, suffix = ""): string {
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, "")}` : "";
  return `/${slug}${normalizedSuffix}`;
}

export function isAppModulePath(pathname: string, slug: AppModuleSlug): boolean {
  const root = buildAppModulePath(slug);
  return pathname === root || pathname.startsWith(`${root}/`);
}

export const ROUTING_MODULE_SLUGS = {
  community: APP_MODULE_SLUGS.community,
  business: APP_MODULE_SLUGS.business,
  education: APP_MODULE_SLUGS.education,
  services: APP_MODULE_SLUGS.services,
  classifieds: APP_MODULE_SLUGS.classifieds,
  mobility: APP_MODULE_SLUGS.mobility,
  gastronomy: APP_MODULE_SLUGS.gastronomy,
  events: APP_MODULE_SLUGS.events,
  jobs: APP_MODULE_SLUGS.jobs,
  alerts: APP_MODULE_SLUGS.communityAlerts,
  map: APP_MODULE_SLUGS.map,
  guide: "guia",
  search: APP_MODULE_SLUGS.search,
  ranking: APP_MODULE_SLUGS.ranking,
} as const;
