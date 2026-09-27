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
  nearby: "perto-de-mim",
  search: "busca",
  ranking: "ranking",
} as const;

export type AppModuleSlug = typeof APP_MODULE_SLUGS[keyof typeof APP_MODULE_SLUGS];

export function buildAppModulePath(slug: AppModuleSlug, suffix = ""): string {
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, "")}` : "";
  return `/${slug}${normalizedSuffix}`;
}

const APP_MODULE_SLUG_SET = new Set<AppModuleSlug>(
  Object.values(APP_MODULE_SLUGS),
);

function isStateSegment(value: string | undefined): boolean {
  return Boolean(value && /^[a-z]{2}$/i.test(value));
}

export function getAppModuleSlugFromPath(
  pathname: string,
): AppModuleSlug | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const first = segments[0] as AppModuleSlug;
  if (APP_MODULE_SLUG_SET.has(first)) {
    // Standalone module surfaces such as /empresas and /empresas/cadastrar
    // remain valid. The retired /module/:state/:city shape is intentionally
    // not recognized.
    if (isStateSegment(segments[1]) && segments[2]) return null;
    return first;
  }

  if (!isStateSegment(segments[0]) || !segments[1]) return null;

  const cityLevel = segments[2] as AppModuleSlug | undefined;
  if (cityLevel && APP_MODULE_SLUG_SET.has(cityLevel)) return cityLevel;

  const scoped = segments[3] as AppModuleSlug | undefined;
  if (scoped && APP_MODULE_SLUG_SET.has(scoped)) return scoped;

  return null;
}

export function isAppModulePath(pathname: string, slug: AppModuleSlug): boolean {
  return getAppModuleSlugFromPath(pathname) === slug;
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
  nearby: APP_MODULE_SLUGS.nearby,
  guide: "guia",
  search: APP_MODULE_SLUGS.search,
  ranking: APP_MODULE_SLUGS.ranking,
} as const;
