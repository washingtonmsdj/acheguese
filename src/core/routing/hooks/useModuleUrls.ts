/**
 * useModuleUrls
 *
 * Retorna as URLs canônicas dos módulos baseado no território ativo.
 * Se há território resolvido na URL (params), usa esse.
 * Caso contrário, usa o território do store (locationContextStore).
 * Fallback final: URLs legadas (que redirecionam para o território de lançamento).
 *
 * Usar este hook em qualquer componente de navegação global.
 */

import { useParams } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { lastTerritoryStore, type LastTerritory } from '../stores/LastTerritoryStore';
import {
  MODULE_SLUGS,
  geoPathToPublicUrl,
} from '../utils/territoryUrls';
import { LAUNCH_URLS, TERRITORY_CONFIG } from '@/config/territory';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import type { ModuleSlug } from '../utils/territoryUrls';

export interface ModuleUrls {
  community:    string;
  business:     string;
  services:     string;
  classifieds:  string;
  /** URL base do território atual (sem módulo) */
  base:         string;
  /**
   * Nome legível do território ativo.
   * Vem dos params da URL (grupo ou bairro) ou do store.
   * Fallback: null (sem território resolvido ainda).
   */
  territoryName: string | null;
}

export function useModuleUrls(): ModuleUrls {
  const { state, city, groupSlugOrDistrict } = useParams<{
    state?: string; city?: string;
    groupSlugOrDistrict?: string;
  }>();

  const { activeLocation } = useActiveTerritory();

  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  );

  // 1. Território resolvido pela URL atual — só se state for UF real, não módulo reservado
  // Ex: /comunidade/ba/salvador → state="comunidade" é reservado, ignorar
  if (state && city && !isReservedSlug(state)) {
    const slug = groupSlugOrDistrict;
    const base = slug ? `/${state}/${city}/${slug}` : `/${state}/${city}`;
    const territoryName = slug ? slugToTitle(slug) : slugToTitle(city);
    return buildModuleUrls(base, territoryName);
  }

  // 2. Último território visitado
  if (lastTerritory) {
    return buildModuleUrls(lastTerritory.baseUrl, lastTerritory.name);
  }

  // 3. Bairro ativo no store (onboarding)
  if (activeLocation?.geographic_path) {
    return buildModuleUrls(geoPathToPublicUrl(activeLocation.geographic_path), activeLocation.name);
  }

  // 4. Fallback: Território de lançamento (SSOT)
  return {
    base: `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
    territoryName: TERRITORY_CONFIG.launch.name,
    community: LAUNCH_URLS.community,
    business: LAUNCH_URLS.business,
    services: LAUNCH_URLS.services,
    classifieds: LAUNCH_URLS.classifieds,
  };
}

function buildModuleUrls(base: string, territoryName: string | null): ModuleUrls {
  const m = (slug: ModuleSlug) => `${base}/${slug}`;
  return {
    base,
    territoryName,
    community:   m(MODULE_SLUGS.community),
    business:    m(MODULE_SLUGS.business),
    services:    m(MODULE_SLUGS.services),
    classifieds: m(MODULE_SLUGS.classifieds),
  };
}

/** "complexo-do-nordeste-de-amaralina" → "Complexo do Nordeste de Amaralina" */
function slugToTitle(slug: string): string {
  const LOWERCASE = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(' ');
}
