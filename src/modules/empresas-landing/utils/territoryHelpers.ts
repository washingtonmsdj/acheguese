/**
 * Territory Helpers
 * 
 * Funções utilitárias para manipulação de dados territoriais
 */

import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

/**
 * Extrai nome do território resolvido
 */
export function getTerritoryName(resolved: ResolvedTerritory | null | undefined): string {
  if (!resolved) return "Sua Região";
  const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
  return name;
}

/**
 * Nome abreviado para títulos (Complexo -> Cpx)
 */
export function getTerritoryNameShort(territoryName: string): string {
  return territoryName.replace(/^Complexo\s+/i, 'Cpx ');
}

/**
 * Determina preposição correta (de/do/da)
 */
export function getTerritoryPreposition(territoryName: string): string {
  const name = territoryName.toLowerCase();
  
  // Regras de preposição
  if (name.startsWith('complexo')) return 'do';
  if (name.startsWith('cpx')) return 'do';
  if (name.startsWith('conjunto')) return 'do';
  if (name.startsWith('vale')) return 'do';
  if (name.startsWith('parque')) return 'do';
  if (name.startsWith('jardim')) return 'do';
  
  // Femininos comuns
  if (name.endsWith('cidade')) return 'da';
  if (name.endsWith('vila')) return 'da';
  if (name.endsWith('praia')) return 'da';
  if (name.endsWith('chapada')) return 'da';
  
  // Padrão: "de"
  return 'de';
}
