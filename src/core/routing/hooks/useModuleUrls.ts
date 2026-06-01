import { useParams } from 'react-router-dom';
import { LAUNCH_URLS } from '@/config/territory';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import {
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  hasPublicCityTerritoryPath,
  type ModuleSlug,
  MODULE_SLUGS,
} from '@/core/routing/utils/territoryUrls';

export interface ModuleUrls {
  community: string;
  business: string;
  services: string;
  classifieds: string;
  base: string;
  territoryName: string | null;
}

export function useModuleUrls(): ModuleUrls {
  const territorialContext = useTerritorialContextOptional();
  const { state, city, district, groupSlug, groupSlugOrDistrict } = useParams<{
    state?: string;
    city?: string;
    district?: string;
    groupSlug?: string;
    groupSlugOrDistrict?: string;
  }>();

  if (territorialContext) {
    const territoryName =
      territorialContext.resolved?.kind === 'group'
        ? territorialContext.resolved.group.name
        : territorialContext.resolved?.location.name ?? null;

    return buildTerritorialModuleUrls(
      territorialContext.baseUrl,
      territoryName,
      territorialContext.communityBaseUrl,
    );
  }

  if (state && city && !isReservedSlug(state)) {
    const base = groupSlug
      ? `/${state}/${city}/${groupSlug}`
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
    community: LAUNCH_URLS.community,
    business: LAUNCH_URLS.business,
    services: LAUNCH_URLS.services,
    classifieds: LAUNCH_URLS.classifieds,
  };
}

function buildScopedModuleUrl(
  module: ModuleSlug,
  base: string,
  communityBaseUrl?: string | null,
): string {
  if (communityBaseUrl === base) {
    return `${base}/${module}`;
  }

  return buildModuleTerritoryUrl(module, base);
}

function buildTerritorialModuleUrls(
  base: string,
  territoryName: string | null,
  communityBaseUrl?: string | null,
): ModuleUrls {
  const community = communityBaseUrl ??
    (hasPublicCityTerritoryPath(base)
      ? buildCommunityTerritoryUrl(base)
      : LAUNCH_URLS.community);

  return {
    base,
    territoryName,
    community,
    business: buildScopedModuleUrl(MODULE_SLUGS.business, base, communityBaseUrl),
    services: buildScopedModuleUrl(MODULE_SLUGS.services, base, communityBaseUrl),
    classifieds: buildScopedModuleUrl(MODULE_SLUGS.classifieds, base, communityBaseUrl),
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
