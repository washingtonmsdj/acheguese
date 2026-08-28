import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import { TERRITORY_CONFIG } from '@/core/routing/config/territory';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { buildGroupBaseUrl, geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { touristPointPublicRoutes } from './touristPointPublicRoutes';

export const TOURIST_POINTS_SLUG = APP_MODULE_SLUGS.touristPoints;

export interface TouristPointPublicUrls {
  /** /pontos-turisticos/ba/salvador ou /pontos-turisticos/ba/salvador/barra */
  touristPoints: string;
  /** /pontos-turisticos/ba/salvador/:slug */
  touristPointDetail: (slug: string) => string;
}

function buildTouristPointPublicUrls(territoryPublicPath: string): TouristPointPublicUrls {
  const base = touristPointPublicRoutes.listFromTerritoryPath(territoryPublicPath);
  return {
    touristPoints: base,
    touristPointDetail: (slug: string) =>
      touristPointPublicRoutes.detailFromTerritoryPath(territoryPublicPath, slug),
  };
}

function buildResolvedTerritoryPublicPath(
  routeResolved?: ResolvedTerritory | null,
): string | null {
  if (!routeResolved) return null;

  if (routeResolved.kind === 'group') {
    const firstMember = routeResolved.group.members[0];
    if (!firstMember?.geographic_path) return null;

    const parts = firstMember.geographic_path.split('/').filter(Boolean);
    if (parts.length < 3) return null;

    return buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
  }

  return geoPathToPublicUrl(routeResolved.location.geographic_path);
}

export function useTouristPointPublicUrls(
  routeResolved?: ResolvedTerritory | null,
): TouristPointPublicUrls {
  const { activeLocation } = useActiveTerritory();
  const resolvedPublicPath = buildResolvedTerritoryPublicPath(routeResolved);

  if (resolvedPublicPath) {
    return buildTouristPointPublicUrls(resolvedPublicPath);
  }

  if (activeLocation?.geographic_path) {
    return buildTouristPointPublicUrls(geoPathToPublicUrl(activeLocation.geographic_path));
  }

  return buildTouristPointPublicUrls(
    `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`,
  );
}

export function buildTouristPointDetailUrl(
  pointLocation: { geographic_path?: string | null } | null | undefined,
  slug: string,
): string {
  if (pointLocation?.geographic_path) {
    return touristPointPublicRoutes.detailFromGeographicPath(pointLocation.geographic_path, slug);
  }

  return touristPointPublicRoutes.detail({
    state: TERRITORY_CONFIG.launch.state,
    city: TERRITORY_CONFIG.launch.city,
    slug,
  });
}
