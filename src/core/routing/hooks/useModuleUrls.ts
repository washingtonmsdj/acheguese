import { useLocation, useParams } from 'react-router-dom';
import { LAUNCH_URLS } from '@/config/territory';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import {
  buildCommunityTerritoryUrl,
  hasPublicCityTerritoryPath,
  MODULE_SLUGS,
} from '@/core/routing/utils/territoryUrls';
import {
  buildContextualModuleUrl,
  shouldUseCommunityScopedModuleUrls,
} from '@/core/routing/utils/communityModuleUrls';

export interface ModuleUrls {
  community: string;
  business: string;
  services: string;
  classifieds: string;
  base: string;
  territoryName: string | null;
}

export function useModuleUrls(): ModuleUrls {
  const { pathname } = useLocation();
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
      shouldUseCommunityScopedModuleUrls({
        pathname,
        territoryBaseUrl: territorialContext.baseUrl,
        communityBaseUrl: territorialContext.communityBaseUrl,
      }),
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

function buildTerritorialModuleUrls(
  base: string,
  territoryName: string | null,
  communityBaseUrl?: string | null,
  useCommunityScopedModules = false,
): ModuleUrls {
  const community = communityBaseUrl ??
    (hasPublicCityTerritoryPath(base)
      ? buildCommunityTerritoryUrl(base)
      : LAUNCH_URLS.community);

  return {
    base,
    territoryName,
    community,
    business: buildContextualModuleUrl({
      module: MODULE_SLUGS.business,
      territoryBaseUrl: base,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    services: buildContextualModuleUrl({
      module: MODULE_SLUGS.services,
      territoryBaseUrl: base,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
    classifieds: buildContextualModuleUrl({
      module: MODULE_SLUGS.classifieds,
      territoryBaseUrl: base,
      communityBaseUrl,
      useCommunityScopedModules,
    }),
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
