/**
 * Tree utilities para Admin Territory Management
 * 
 * SSOT: Funções utilitárias centralizadas
 * Sem gambiarras: Código limpo e testável
 */

import type { TerritoryNode } from "../sections/types";

/**
 * Constrói uma árvore hierárquica a partir de uma lista plana de localizações
 */
export function buildTree(locations: readonly TerritoryNode[]): TerritoryNode[] {
  const map = new Map<string, TerritoryNode>();
  const roots: TerritoryNode[] = [];

  // Primeiro, criar o mapa
  locations.forEach((loc) => {
    map.set(loc.id, { ...loc, children: [] });
  });

  // Depois, construir a hierarquia
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children!.push(node);
      }
    } else if (!node.parent_id) {
      roots.push(node);
    } else {
      console.warn(
        "Orphan node (parent not found):",
        node.name,
        "parent_id:",
        node.parent_id
      );
    }
  });

  return roots;
}
