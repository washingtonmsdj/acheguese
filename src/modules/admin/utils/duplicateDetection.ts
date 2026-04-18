/**
 * Duplicate detection utilities para Admin Territory Management
 * 
 * SSOT: Funções utilitárias centralizadas
 * Sem gambiarras: Código limpo e testável
 */

import type { TerritoryNode, VisualDuplicate, SlugDuplicate } from "../sections/types";

/**
 * Detecta duplicados visuais (por nome e tipo)
 */
export function detectVisualDuplicates(
  locations: readonly TerritoryNode[]
): VisualDuplicate[] {
  const nameCount = new Map<string, TerritoryNode[]>();

  locations.forEach((loc) => {
    const key = `${loc.name}-${loc.type}`;
    if (!nameCount.has(key)) {
      nameCount.set(key, []);
    }
    nameCount.get(key)!.push(loc);
  });

  return Array.from(nameCount.entries())
    .filter(([_, locs]) => locs.length > 1)
    .map(([_, locs]) => ({
      name: locs[0].name,
      type: locs[0].type,
      count: locs.length,
      locations: locs,
    }));
}

/**
 * Detecta duplicados por slug
 */
export function detectSlugDuplicates(
  locations: readonly TerritoryNode[]
): SlugDuplicate[] {
  const slugCount = new Map<string, number>();

  locations.forEach((loc) => {
    slugCount.set(loc.slug, (slugCount.get(loc.slug) || 0) + 1);
  });

  return Array.from(slugCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([slug, count]) => ({ slug, count }));
}
