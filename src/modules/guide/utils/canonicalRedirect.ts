/**
 * Canonical Redirect Utility
 * 
 * Garante que URLs de pontos turísticos sempre incluam o bairro.
 * Redireciona URLs sem bairro para a URL canônica com bairro.
 * 
 * SSOT: Toda URL de ponto turístico DEVE seguir o padrão:
 * /pontos-turisticos/:state/:city/:district/:slug
 */

import type { TouristPoint } from '../types';

const TOURIST_POINTS_SLUG = 'pontos-turisticos';

/**
 * Constrói a URL canônica para um ponto turístico.
 * 
 * @param point - Ponto turístico
 * @returns URL canônica com bairro
 */
export function buildCanonicalUrl(point: TouristPoint): string {
  if (!point.location?.geographic_path) {
    throw new Error('Point must have location.geographic_path to build canonical URL');
  }
  
  const pathParts = point.location.geographic_path.split('/').filter(Boolean);
  const publicPath = pathParts.slice(1).join('/');
  return `/${TOURIST_POINTS_SLUG}/${publicPath}/${point.slug}`;
}

/**
 * Verifica se a URL atual está no formato canônico (com bairro).
 * 
 * @param currentPath - Path atual da URL (ex: /pontos-turisticos/ba/salvador/farol-da-barra)
 * @param point - Ponto turístico carregado
 * @returns true se a URL está canônica, false se precisa redirecionar
 */
export function isCanonicalUrl(currentPath: string, point: TouristPoint): boolean {
  if (!point.location?.geographic_path) return false;
  
  // Construir URL canônica esperada usando buildCanonicalUrl
  const canonicalPath = buildCanonicalUrl(point);
  
  return currentPath === canonicalPath;
}

/**
 * Política de redirecionamento:
 * - URLs sem bairro → Redireciona para URL canônica com bairro
 * - URLs com bairro errado → Redireciona para URL canônica correta
 * - URLs canônicas → Sem redirecionamento
 */
export function shouldRedirect(currentPath: string, point: TouristPoint | null): {
  shouldRedirect: boolean;
  canonicalUrl: string | null;
} {
  if (!point) {
    return { shouldRedirect: false, canonicalUrl: null };
  }
  
  if (!isCanonicalUrl(currentPath, point)) {
    return {
      shouldRedirect: true,
      canonicalUrl: buildCanonicalUrl(point),
    };
  }
  
  return { shouldRedirect: false, canonicalUrl: null };
}
