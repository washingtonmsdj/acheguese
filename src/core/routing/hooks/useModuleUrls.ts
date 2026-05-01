import { useParams } from 'react-router-dom';
import { isReservedSlug } from '@/core/routing/reservedSlugs';

export interface ModuleUrls {
  community: string;
  business: string;
  services: string;
  classifieds: string;
  base: string;
  territoryName: string | null;
}

export function useModuleUrls(): ModuleUrls {
  const { state, city, groupSlugOrDistrict } = useParams<{
    state?: string;
    city?: string;
    groupSlugOrDistrict?: string;
  }>();

  if (state && city && !isReservedSlug(state)) {
    const base = groupSlugOrDistrict ? `/${state}/${city}/${groupSlugOrDistrict}` : `/${state}/${city}`;
    const territoryName = slugToTitle(groupSlugOrDistrict ?? city);
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
    community: `/comunidade${base}`,
    business: `/empresas${base}`,
    services: `/servicos${base}`,
    classifieds: `/classificados${base}`,
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
