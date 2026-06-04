/**
 * territoryUrls - SSOT para URLs territoriais e aliases publicos.
 *
 * Nunca concatenar paths manualmente no app; usar estas funcoes.
 *
 * Padroes publicos territoriais:
 *   Cidade:   /:state/:city
 *   Bairro:   /:state/:city/:district
 *   Grupo:    /:state/:city/:groupSlug
 *   Modulo:   /[modulo]/:state/:city/:district?
 *
 * Comunidade publica preferencial:
 *   /:communityAlias
 *   /:communityAlias/:module
 *   /:communityAlias/:businessSlug
 *
 * Fallback tecnico de comunidade:
 *   /comunidade/:state/:city
 *   /comunidade/:state/:city/:districtOrGroup
 */

import type { Location, TerritorialGroup } from '@/core/location/types';
import { ROUTING_MODULE_SLUGS } from '@/config/moduleSlugs';

// ── Slugs de módulo canônicos ────────────────────────────────────────────────
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
const LEGACY_COMMUNITY_AREA_SEGMENT = 'area';
const COMMUNITY_EMBEDDED_MODULE_SEGMENTS = new Set<string>([
  MODULE_SLUGS.business,
  MODULE_SLUGS.services,
  MODULE_SLUGS.classifieds,
  MODULE_SLUGS.gastronomy,
  MODULE_SLUGS.education,
  MODULE_SLUGS.jobs,
  MODULE_SLUGS.events,
  MODULE_SLUGS.map,
  MODULE_SLUGS.mobility,
]);

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

export function isCommunityEmbeddedModuleSegment(segment: string | undefined): boolean {
  return Boolean(segment && COMMUNITY_EMBEDDED_MODULE_SEGMENTS.has(segment));
}

export function isCommunityRouteSuffixSegment(segment: string | undefined): boolean {
  return (
    isCommunityCanonicalSuffixSegment(segment) ||
    isCommunityEmbeddedModuleSegment(segment)
  );
}

export function extractCommunityTerritoryBaseUrl(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== MODULE_SLUGS.community || parts.length < 3) return null;
  if (!/^[a-z]{2}$/i.test(parts[1])) return null;

  const firstAfterCity = parts[3];
  if (
    firstAfterCity &&
    firstAfterCity !== LEGACY_COMMUNITY_AREA_SEGMENT &&
    !isCommunityRouteSuffixSegment(firstAfterCity)
  ) {
    return `/${parts[1]}/${parts[2]}/${firstAfterCity}`;
  }

  return `/${parts[1]}/${parts[2]}`;
}

// ── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Detecta se um pathname corresponde a uma página de detalhe de entidade.
 *
 * Páginas de detalhe têm 5+ segmentos: /[modulo]/:state/:city/:district/:slug
 * Ex: /gastronomia/ba/salvador/rio-vermelho/pizza-do-forno
 *     /empresas/ba/salvador/pituba/nome-do-negocio
 *
 * Páginas territoriais (listagem) têm no máximo 4 segmentos:
 * Ex: /gastronomia/ba/salvador           (3 segmentos)
 *     /gastronomia/ba/salvador/pituba    (4 segmentos)
 */
export function isEntityDetailRoute(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length >= 5;
}

/**
 * Converte geographic_path interno (/br/ba/salvador/pituba)
 * para URL pública (/ba/salvador/pituba) removendo o country.
 */
export function geoPathToPublicUrl(geoPath: string): string {
  const parts = geoPath.split('/').filter(Boolean);
  return '/' + parts.slice(1).join('/');
}

/**
 * Normaliza caminhos territoriais internos ou públicos para o formato público:
 * - /br/ba/salvador/pituba -> /ba/salvador/pituba
 * - /ba/salvador/pituba -> /ba/salvador/pituba
 * - ba/salvador/pituba -> /ba/salvador/pituba
 */
export function normalizePublicTerritoryPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return '/';

  const normalizedParts = parts[0] === 'br' ? parts.slice(1) : parts;
  return '/' + normalizedParts.join('/');
}

export function buildCityTerritoryBaseUrl(territoryBaseUrl: string): string {
  const normalizedBase = normalizePublicTerritoryPath(territoryBaseUrl);
  const rawParts = normalizedBase.split('/').filter(Boolean);
  const parts = rawParts[0] === MODULE_SLUGS.community ? rawParts.slice(1) : rawParts;

  if (parts.length < 2) {
    throw new Error('buildCityTerritoryBaseUrl exige /:state/:city.');
  }

  if (parts[2] === LEGACY_COMMUNITY_AREA_SEGMENT) {
    throw new Error('buildCityTerritoryBaseUrl nao aceita /area/. Use /:state/:city.');
  }

  return `/${parts[0]}/${parts[1]}`;
}

function buildScopedTerritoryBaseUrl(territoryBaseUrl: string): string {
  const normalizedBase = normalizePublicTerritoryPath(territoryBaseUrl);
  const rawParts = normalizedBase.split('/').filter(Boolean);
  const parts = rawParts[0] === MODULE_SLUGS.community ? rawParts.slice(1) : rawParts;

  if (parts.length < 2) {
    throw new Error('buildScopedTerritoryBaseUrl exige /:state/:city.');
  }

  if (parts[2] === LEGACY_COMMUNITY_AREA_SEGMENT) {
    throw new Error('buildScopedTerritoryBaseUrl nao aceita /area/. Use /:state/:city/:territorySlug.');
  }

  return `/${parts.slice(0, 3).join('/')}`;
}

export function hasPublicCityTerritoryPath(path: string | null | undefined): boolean {
  if (!path) return false;
  const parts = normalizePublicTerritoryPath(path).split('/').filter(Boolean);
  const publicParts = parts[0] === MODULE_SLUGS.community ? parts.slice(1) : parts;
  return publicParts.length >= 2;
}

// ── Builders ─────────────────────────────────────────────────────────────────

/**
 * URL base de uma location (cidade ou bairro).
 * geographic_path: /br/ba/salvador/pituba → /ba/salvador/pituba
 */
export function buildLocationBaseUrl(location: Location): string {
  return geoPathToPublicUrl(location.geographic_path);
}

/**
 * URL base de um grupo territorial.
 * cityPath: geographic_path da cidade âncora (ex: /br/ba/salvador)
 */
export function buildGroupBaseUrl(group: TerritorialGroup, cityPath: string): string {
  const publicCity = geoPathToPublicUrl(cityPath);
  return `${publicCity}/${group.slug}`;
}

/**
 * URL de um módulo dentro de um bairro.
 */
export function buildLocationModuleUrl(location: Location, module: ModuleSlug): string {
  return buildModuleTerritoryUrl(module, buildLocationBaseUrl(location));
}

/**
 * URL de um módulo dentro de um grupo territorial.
 */
export function buildGroupModuleUrl(
  group: TerritorialGroup,
  cityPath: string,
  module: ModuleSlug,
): string {
  return buildModuleTerritoryUrl(module, buildGroupBaseUrl(group, cityPath));
}

/**
 * Constrói a URL base do território ativo.
 */
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

/**
 * Constrói a URL de um módulo no território ativo.
 */
export function buildTerritoryModuleUrl(
  territory:
    | { kind: 'location'; location: Location }
    | { kind: 'group'; group: TerritorialGroup; cityPath: string },
  module: ModuleSlug,
): string {
  return buildModuleTerritoryUrl(module, buildTerritoryBaseUrl(territory));
}

export function buildModuleTerritoryUrl(module: ModuleSlug, territoryBaseUrl: string): string {
  return `/${module}${normalizePublicTerritoryPath(territoryBaseUrl)}`;
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

/**
 * Constrói a URL territorial de fallback da comunidade para cidade, bairro ou grupo.
 *
 * Padrões:
 *   /comunidade/:state/:city
 *   /comunidade/:state/:city/:districtOrGroup
 *
 * Aceita base territorial pública no formato:
 *   /:state/:city ou /:state/:city/:territorySlug
 * Nunca usar /area/ em URLs publicas de comunidade.
 *
 * Exemplos:
 *   buildCommunityTerritoryUrl('/ba/salvador/pituba')
 *   → '/comunidade/ba/salvador/pituba'
 *
 *   buildCommunityTerritoryUrl('/ba/salvador/pituba', 'feed')
 *   → '/comunidade/ba/salvador/pituba/feed'
 */
export function buildCommunityTerritoryUrl(territoryBaseUrl: string, suffix = ''): string {
  const scopedBase = buildScopedTerritoryBaseUrl(territoryBaseUrl);
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `/${MODULE_SLUGS.community}${scopedBase}${normalizedSuffix}`;
}

/**
 * URL publica curta da comunidade.
 *
 * Esta URL depende de um alias explicito/unico resolvido pelo backend
 * ou pela tabela community_public_aliases. A rota territorial completa
 * continua disponivel como fallback tecnico via buildCommunityTerritoryUrl.
 */
export function buildCommunityAliasUrl(alias: string, suffix = ''): string {
  const cleanAlias = cleanUrlSegment(alias, 'alias publico da comunidade');
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return `/${cleanAlias}${normalizedSuffix}`;
}

export type CommunityTabSuffix = 'feed' | 'grupos';

/**
 * Deriva URL de aba da comunidade a partir de uma rota territorial atual.
 * Suporta o fallback /comunidade/:state/:city e normaliza rotas antigas com slug territorial.
 */
export function buildCommunityTabUrlFromPath(pathname: string, tab: CommunityTabSuffix): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== MODULE_SLUGS.community || parts.length < 3) return null;
  if (isCommunityCanonicalSuffixSegment(parts[3])) return null;

  const base = [MODULE_SLUGS.community, parts[1], parts[2]];
  const territorySlug = parts[3];
  if (territorySlug && territorySlug !== LEGACY_COMMUNITY_AREA_SEGMENT) {
    base.push(territorySlug);
  }

  return `/${base.join('/')}/${tab}`;
}

// ── Route Context Extraction ─────────────────────────────────────────────────

/**
 * Extrai o contexto da rota atual (módulo + sufixo após o território).
 * 
 * Exemplos:
 *   /empresas/ba/salvador/categoria/restaurantes → { module: 'empresas', suffix: '/categoria/restaurantes' }
 *   /empresas/ba/salvador/pituba/categoria/saude → { module: 'empresas', suffix: '/categoria/saude' }
 *   /empresas/ba/salvador → { module: 'empresas', suffix: '' }
 *   /comunidade/ba/salvador → { module: 'comunidade', suffix: '' }
 *   /ba/salvador → { module: null, suffix: '' }
 * 
 * @param pathname - pathname da URL atual (ex: location.pathname)
 * @returns Objeto com módulo e sufixo, ou null se não for uma rota territorial
 */
export function extractRouteContext(pathname: string): {
  module: ModuleSlug | null;
  suffix: string;
} {
  const parts = pathname.split('/').filter(Boolean);
  
  // Verifica se o primeiro segmento é um módulo conhecido
  const firstSegment = parts[0];
  const moduleValues = Object.values(MODULE_SLUGS);
  const isModule = moduleValues.includes(firstSegment as ModuleSlug);
  
  if (!isModule) {
    // Não é uma rota de módulo (ex: /ba/salvador)
    return { module: null, suffix: '' };
  }
  
  const module = firstSegment as ModuleSlug;
  
  // Encontra onde termina o território e começa o sufixo
  // Padrões possíveis:
  // /empresas/:state/:city → 3 segmentos, sem sufixo
  // /empresas/:state/:city/:district → 4 segmentos, sem sufixo
  // /empresas/:state/:city/categoria/:category → 5 segmentos, sufixo = /categoria/:category
  // /empresas/:state/:city/:district/categoria/:category → 6 segmentos, sufixo = /categoria/:category
  
  // Detecta se há um sufixo após o território
  // Sufixos conhecidos: /categoria/:slug
  let suffixStartIndex = -1;
  
  for (let i = 1; i < parts.length; i++) {
    // Se encontrar "categoria" ou outros sufixos conhecidos
    if (parts.at(i) === 'categoria') {
      suffixStartIndex = i;
      break;
    }
  }
  
  if (suffixStartIndex === -1) {
    // Sem sufixo
    return { module, suffix: '' };
  }
  
  // Constrói o sufixo
  const suffixParts = parts.slice(suffixStartIndex);
  const suffix = '/' + suffixParts.join('/');
  
  return { module, suffix };
}
