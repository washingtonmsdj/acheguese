/**
 * territoryUrls — Helpers canônicos de URL territorial
 *
 * SSOT para construção de URLs territoriais públicas (sem /br).
 * Nunca concatenar paths manualmente no app — usar estas funções.
 *
 * Padrões canônicos (públicos):
 *   Cidade:  /:state/:city
 *   Bairro:  /:state/:city/:district
 *   Grupo:   /:state/:city/area/:groupSlug
 *   Módulo:  /[modulo]/:state/:city/:district?
 *   Grupo em módulo: /[modulo]/:state/:city/area/:groupSlug
 */

import type { Location, TerritorialGroup } from '@/core/location/types';
import { TERRITORY_CONFIG } from '@/config/territory';

// ── Slugs de módulo canônicos ────────────────────────────────────────────────
export const MODULE_SLUGS = {
  community:    'comunidade',
  business:     'empresas',
  services:     'servicos',
  classifieds:  'classificados',
  mobility:     'mobilidade',
  gastronomy:   'gastronomia',
  events:       'eventos',
  jobs:         'vagas',
  alerts:       'alertas',
  map:          'mapa',
  guide:        'guia',
  ranking:      'ranking',
} as const;

export type ModuleSlug = typeof MODULE_SLUGS[keyof typeof MODULE_SLUGS];

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
  return `${publicCity}/area/${group.slug}`;
}

/**
 * URL de um módulo dentro de um bairro.
 */
export function buildLocationModuleUrl(location: Location, module: ModuleSlug): string {
  return `${buildLocationBaseUrl(location)}/${module}`;
}

/**
 * URL de um módulo dentro de um grupo territorial.
 */
export function buildGroupModuleUrl(
  group: TerritorialGroup,
  cityPath: string,
  module: ModuleSlug,
): string {
  return `${buildGroupBaseUrl(group, cityPath)}/${module}`;
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
  return `${buildTerritoryBaseUrl(territory)}/${module}`;
}

export function buildModuleTerritoryUrl(module: ModuleSlug, territoryBaseUrl: string): string {
  return `/${module}${normalizePublicTerritoryPath(territoryBaseUrl)}`;
}

export function buildCommunityTerritoryUrl(territoryBaseUrl: string, suffix = ''): string {
  const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  return buildModuleTerritoryUrl(MODULE_SLUGS.community, territoryBaseUrl) + normalizedSuffix;
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
