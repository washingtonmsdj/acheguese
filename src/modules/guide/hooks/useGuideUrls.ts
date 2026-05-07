/**
 * useGuideUrls — URLs canônicas do módulo pontos turísticos
 *
 * SSOT para navegação do módulo de pontos turísticos.
 * Nunca construir URLs manualmente fora deste hook.
 */

import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { buildGroupBaseUrl, geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';
import { TERRITORY_CONFIG } from '@/config/territory';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export const TOURIST_POINTS_SLUG = 'pontos-turisticos';

export interface GuideUrls {
  /** /pontos-turisticos/ba/salvador ou /pontos-turisticos/ba/salvador/barra */
  touristPoints: string;
  /** /pontos-turisticos/ba/salvador/:slug */
  touristPointDetail: (slug: string) => string;
}

function buildGuideUrls(territoryPublicPath: string): GuideUrls {
  const base = `/${TOURIST_POINTS_SLUG}${territoryPublicPath}`;
  return {
    touristPoints: base,
    touristPointDetail: (slug: string) => `${base}/${slug}`,
  };
}

export function useGuideUrls(routeResolved?: ResolvedTerritory | null): GuideUrls {
  const { activeLocation } = useActiveTerritory();

  if (routeResolved) {
    if (routeResolved.kind === 'group') {
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        return buildGuideUrls(buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`));
      }
    } else {
      return buildGuideUrls(geoPathToPublicUrl(routeResolved.location.geographic_path));
    }
  }

  if (activeLocation?.geographic_path) {
    return buildGuideUrls(geoPathToPublicUrl(activeLocation.geographic_path));
  }

  return buildGuideUrls(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`);
}

/**
 * Constrói URL de detalhe de ponto turístico usando o geographic_path do ponto.
 * 
 * IMPORTANTE: O ponto turístico pode estar em um bairro diferente do território atual.
 * Esta função usa o geographic_path do próprio ponto para construir a URL correta.
 * 
 * @param pointLocation - Objeto location do ponto turístico (com geographic_path)
 * @param slug - Slug do ponto turístico
 * @returns URL completa para a página de detalhe
 */
export function buildTouristPointDetailUrl(
  pointLocation: { geographic_path: string } | null | undefined,
  slug: string
): string {
  if (pointLocation?.geographic_path) {
    const publicPath = geoPathToPublicUrl(pointLocation.geographic_path);
    return `/${TOURIST_POINTS_SLUG}${publicPath}/${slug}`;
  }
  // Fallback: usa o território de lançamento
  return `/${TOURIST_POINTS_SLUG}/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}/${slug}`;
}
