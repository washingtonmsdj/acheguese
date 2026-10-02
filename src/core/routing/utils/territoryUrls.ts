/**
 * territoryUrls - SSOT para URLs territoriais públicas.
 *
 * Nunca concatenar paths territoriais manualmente no app; usar estas funções.
 *
 * Hierarquia canônica:
 *   Cidade:   /:state/:city
 *   Território: /:state/:city/:territorySlug
 *   Módulo:   /:state/:city/:territorySlug?/:module
 *   Entidade: /:state/:city/:territorySlug?/:module/:entitySlug
 *
 * O território é sempre o contêiner. Community é um módulo irmão de Empresas,
 * Mapa, Perto de mim etc. Não existem aliases públicos module-first nem
 * redirects de compatibilidade para a arquitetura anterior.
 */

import { getStateByNameOrCode } from '@/core/location/data/brazilianStates';
import type { Location } from '@/core/location/types';
import type { TerritorialGroup } from '@/core/territorial/contracts';
import { ROUTING_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import { slugifyTerritory } from '@/shared/utils/slugify';

export const MODULE_SLUGS = ROUTING_MODULE_SLUGS;
export type ModuleSlug = typeof MODULE_SLUGS[keyof typeof MODULE_SLUGS];

export const COMMUNITY_CANONICAL_SUFFIX_SEGMENTS = [
  'feed',
  'grupos',
  'alertas',
  'problemas',
  'achados-e-perdidos',
  'interesse',
  'comunicacao',
] as const;

export type CommunityCanonicalSuffixSegment = (typeof COMMUNITY_CANONICAL_SUFFIX_SEGMENTS)[number];

const COMMUNITY_CANONICAL_SUFFIX_SET = new Set<string>(COMMUNITY_CANONICAL_SUFFIX_SEGMENTS);


function cleanUrlSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, '');
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} exige um unico segmento de URL.`);
  }
  return segment;
}

export function isCommunityCanonicalSuffixSegment(segment: string | undefined): boolean {
  return Boolean(segment && COMMUNITY_CANONICAL_SUFFIX_SET.has(segment));
}

export function isCommunityRouteSuffixSegment(segment: string | undefined): boolean {
  return isCommunityCanonicalSuffixSegment(segment);
}

export function extractCommunityTerritoryBaseUrl(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (!/^[a-z]{2}$/i.test(parts[0]) || !parts[1]) return null;

  if (parts[2] === MODULE_SLUGS.community) {
    return `/${parts[0]}/${parts[1]}`;
  }

  if (parts[2] && parts[3] === MODULE_SLUGS.community) {
    return `/${parts[0]}/${parts[1]}/${parts[2]}`;
  }

  return null;
}

export function isEntityDetailRoute(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length >= 5;
}

export function geoPathToPublicUrl(geoPath: string): string {
  const parts = geoPath.split('/').filter(Boolean);
  return '/' + parts.slice(1).join('/');
}

export function normalizePublicTerritoryPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return '/';

  const normalizedParts = parts[0] === 'br' ? parts.slice(1) : parts;
  return '/' + normalizedParts.join('/');
}

export function buildPublicTerritoryBaseUrlFromInput(
  state: string,
  city: string,
  territory?: string,
): string {
  const stateEntry = getStateByNameOrCode(state);
  if (!stateEntry) {
    throw new Error('buildPublicTerritoryBaseUrlFromInput exige estado brasileiro valido.');
  }

  const citySlug = slugifyTerritory(city);
  if (!citySlug) {
    throw new Error('buildPublicTerritoryBaseUrlFromInput exige cidade valida.');
  }

  const territorySlug = territory ? slugifyTerritory(territory) : '';
  return `/${[stateEntry.code, citySlug, territorySlug].filter(Boolean).join('/')}`;
}

export function buildCityTerritoryBaseUrl(territoryBaseUrl: string): string {
  const parts = normalizePublicTerritoryPath(territoryBaseUrl)
    .split('/')
    .filter(Boolean);

  if (parts.length < 2 || !/^[a-z]{2}$/i.test(parts[0])) {
    throw new Error('buildCityTerritoryBaseUrl exige /:state/:city.');
  }

  return `/${parts[0]}/${parts[1]}`;
}

function buildScopedTerritoryBaseUrl(territoryBaseUrl: string): string {
  const parts = normalizePublicTerritoryPath(territoryBaseUrl)
    .split('/')
    .filter(Boolean);

  if (parts.length < 2 || !/^[a-z]{2}$/i.test(parts[0])) {
    throw new Error('buildScopedTerritoryBaseUrl exige /:state/:city.');
  }

  return `/${parts.slice(0, 3).join('/')}`;
}

export function hasPublicCityTerritoryPath(path: string | null | undefined): boolean {
  if (!path) return false;
  const parts = normalizePublicTerritoryPath(path).split('/').filter(Boolean);
  return parts.length >= 2 && /^[a-z]{2}$/i.test(parts[0]);
}

export function buildLocationBaseUrl(location: Location): string {
  return geoPathToPublicUrl(location.geographic_path);
}

export function buildGroupBaseUrl(group: TerritorialGroup, cityPath: string): string {
  const publicCity = buildCityTerritoryBaseUrl(cityPath);
  return `${publicCity}/${group.slug}`;
}

export function buildLocationModuleUrl(location: Location, module: ModuleSlug): string {
  return buildModuleTerritoryUrl(module, buildLocationBaseUrl(location));
}

export function buildGroupModuleUrl(
  group: TerritorialGroup,
  cityPath: string,
  module: ModuleSlug,
): string {
  return buildModuleTerritoryUrl(module, buildGroupBaseUrl(group, cityPath));
}

export function buildTerritoryBaseUrl(
  territory:
    | { kind: 'location'; location: Location }
    | { kind: 'group'; group: TerritorialGroup; cityPath: string },
): string {
  if (territory.kind === 'location') {
    return buildLocationBaseUrl(territory.location);
  }
  return buildGroupBaseUrl(territory.group, territory.cityPath);
}

export function buildTerritoryModuleUrl(
  territory:
    | { kind: 'location'; location: Location }
    | { kind: 'group'; group: TerritorialGroup; cityPath: string },
  module: ModuleSlug,
): string {
  return buildModuleTerritoryUrl(module, buildTerritoryBaseUrl(territory));
}

export function buildModuleTerritoryUrl(module: ModuleSlug, territoryBaseUrl: string): string {
  const base = normalizePublicTerritoryPath(territoryBaseUrl).replace(/\/+$/g, '');
  return `${base}/${module}`;
}

export function buildModuleTerritoryUrlFromSegments(
  module: ModuleSlug,
  state: string,
  city: string,
  suffixSegments: readonly string[] = [],
): string {
  return buildModuleTerritoryUrl(module, [state, city, ...suffixSegments].join('/'));
}

export function buildModuleTerritoryEntityUrl(
  module: ModuleSlug,
  territoryBaseUrl: string,
  entitySlug: string,
): string {
  const normalizedSlug = entitySlug.trim().replace(/^\/+|\/+$/g, '');
  if (!normalizedSlug || /[/?#]/.test(normalizedSlug)) {
    throw new Error('buildModuleTerritoryEntityUrl exige slug de entidade em segmento unico.');
  }
  return `${buildModuleTerritoryUrl(module, territoryBaseUrl)}/${normalizedSlug}`;
}

export function buildCommunityTerritoryUrl(territoryBaseUrl: string, suffix = ''): string {
  const scopedBase = buildScopedTerritoryBaseUrl(territoryBaseUrl);
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `${buildModuleTerritoryUrl(MODULE_SLUGS.community, scopedBase)}${normalizedSuffix}`;
}

export function buildCommunityScopedUrl(communityBaseUrl: string, suffix = ''): string {
  const cleanBase = communityBaseUrl.trim().replace(/\/+$/g, '');
  if (!cleanBase.startsWith('/') || cleanBase === '/' || /[?#]/.test(cleanBase)) {
    throw new Error('buildCommunityScopedUrl exige uma base publica de comunidade.');
  }

  const suffixSegments = suffix
    .split('/')
    .filter(Boolean)
    .map((segment) => cleanUrlSegment(segment, 'sufixo da comunidade'));

  if (!suffixSegments.length) return cleanBase;

  const suffixPath = suffixSegments.join('/');
  return cleanBase.endsWith(`/${suffixPath}`)
    ? cleanBase
    : `${cleanBase}/${suffixPath}`;
}

export type CommunityTabSuffix = 'feed' | 'grupos';

export function buildCommunityTabUrlFromPath(pathname: string, tab: CommunityTabSuffix): string | null {
  const territoryBase = extractCommunityTerritoryBaseUrl(pathname);
  if (!territoryBase) return null;
  return buildCommunityTerritoryUrl(territoryBase, tab);
}

export function extractRouteContext(pathname: string): {
  module: ModuleSlug | null;
  suffix: string;
} {
  const parts = pathname.split('/').filter(Boolean);
  const moduleValues = new Set<string>(Object.values(MODULE_SLUGS));

  let moduleIndex = -1;
  if (moduleValues.has(parts[0] ?? '')) {
    if (!/^[a-z]{2}$/i.test(parts[1] ?? '')) moduleIndex = 0;
  } else if (/^[a-z]{2}$/i.test(parts[0] ?? '') && parts[1]) {
    if (moduleValues.has(parts[2] ?? '')) moduleIndex = 2;
    else if (moduleValues.has(parts[3] ?? '')) moduleIndex = 3;
  }

  if (moduleIndex < 0) return { module: null, suffix: '' };

  const module = parts[moduleIndex] as ModuleSlug;
  const suffixParts = parts.slice(moduleIndex + 1);
  return {
    module,
    suffix: suffixParts.length ? `/${suffixParts.join('/')}` : '',
  };
}
