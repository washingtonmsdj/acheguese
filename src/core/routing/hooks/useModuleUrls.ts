import { useParams } from 'react-router-dom';
import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import {
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  hasPublicCityTerritoryPath,
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
  const { state, city, territorySlug, district, groupSlug, groupSlugOrDistrict } = useParams<{
    state?: string;
    city?: string;
    territorySlug?: string;
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
    const scopedSlug =
      territorySlug ?? groupSlug ?? district ?? groupSlugOrDistrict;
    const base = scopedSlug
      ? `/${state}/${city}/${scopedSlug}`
      : `/${state}/${city}`;
    const territoryName = slugToTitle(scopedSlug ?? city);
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
): ModuleUrls {
  const community = communityBaseUrl ??
    (hasPublicCityTerritoryPath(base)
      ? buildCommunityTerritoryUrl(base)
      : LAUNCH_URLS.community);

  return {
    base,
    territoryName,
    community,
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
