import { useParams } from 'react-router-dom';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { buildCommunityTerritoryUrl, buildModuleTerritoryUrl, MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';

export interface ModuleUrls {
  community: string;
  business: string;
  services: string;
  classifieds: string;
  base: string;
  territoryName: string | null;
}

export function useModuleUrls(): ModuleUrls {
  const { state, city, district, groupSlug, groupSlugOrDistrict } = useParams<{
    state?: string;
    city?: string;
    district?: string;
    groupSlug?: string;
    groupSlugOrDistrict?: string;
  }>();

  if (state && city && !isReservedSlug(state)) {
    const base = groupSlug
      ? `/${state}/${city}/area/${groupSlug}`
      : district
        ? `/${state}/${city}/${district}`
      : groupSlugOrDistrict
        ? `/${state}/${city}/${groupSlugOrDistrict}`
        : `/${state}/${city}`;
    const territoryName = slugToTitle(groupSlug ?? district ?? groupSlugOrDistrict ?? city);
    return buildTerritorialModuleUrls(base, territoryName);
  }

  return {
    base: '/',
    territoryName: null,
    community: '/comunidade',
    business: '/empresas',
    services: '/servicos',
    classifieds: '/classificados',
  };
}

function buildTerritorialModuleUrls(base: string, territoryName: string | null): ModuleUrls {
  return {
    base,
    territoryName,
    community: buildCommunityTerritoryUrl(base),
    business: buildModuleTerritoryUrl(MODULE_SLUGS.business, base),
    services: buildModuleTerritoryUrl(MODULE_SLUGS.services, base),
    classifieds: buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, base),
  };
}

function slugToTitle(slug: string): string {
  const lowerCaseWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, index) =>
      index === 0 || !lowerCaseWords.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word,
    )
    .join(' ');
}
