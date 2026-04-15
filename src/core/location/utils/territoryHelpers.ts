/**
 * Territory Helpers
 * 
 * Funções utilitárias para extrair informações de territórios
 * de forma dinâmica, sem hardcoded.
 */

import type { Location, TerritorialGroupWithMembers } from '../types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

/**
 * Converte slug para título legível.
 * "nordeste-de-amaralina" → "Nordeste de Amaralina"
 */
function slugToTitle(slug: string): string {
  const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
  return slug
    .split('-')
    .map((word, i) =>
      i === 0 || !LOWERCASE_WORDS.has(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');
}

/**
 * Extrai informações de cidade e estado a partir do geographic_path.
 * /br/ba/salvador/nordeste-de-amaralina → { city: "Salvador", state: "BA" }
 */
export function extractCityStateFromPath(geographicPath: string): { city: string; state: string } {
  const parts = geographicPath.split('/').filter(Boolean);
  // parts: ['br', 'ba', 'salvador', ...]
  const stateSlug = parts[1] ?? '';
  const citySlug = parts[2] ?? '';
  
  return {
    city: slugToTitle(citySlug),
    state: stateSlug.toUpperCase(),
  };
}

/**
 * Obtém informações de cidade e estado a partir de uma Location.
 */
export function getCityStateFromLocation(location: Location): { city: string; state: string } {
  return extractCityStateFromPath(location.geographic_path);
}

/**
 * Obtém informações de cidade e estado a partir de um grupo territorial.
 * Usa o primeiro membro do grupo para extrair as informações.
 */
export function getCityStateFromGroup(group: TerritorialGroupWithMembers): { city: string; state: string } {
  // Usa o primeiro membro para extrair cidade/estado
  if (group.members.length > 0) {
    return getCityStateFromLocation(group.members[0]);
  }
  
  // Fallback: tenta extrair do metadata se disponível
  if (group.metadata?.city && group.metadata?.state) {
    return {
      city: String(group.metadata.city),
      state: String(group.metadata.state).toUpperCase(),
    };
  }
  
  // Último fallback: retorna vazio
  return { city: '', state: '' };
}

/**
 * Obtém informações de cidade e estado a partir de um território resolvido.
 */
export function getCityStateFromResolved(resolved: ResolvedTerritory): { city: string; state: string } {
  if (!resolved) return { city: '', state: '' };
  
  if (resolved.kind === 'location') {
    return getCityStateFromLocation(resolved.location);
  }
  
  return getCityStateFromGroup(resolved.group);
}

/**
 * Formata cidade e estado no padrão "Cidade, UF".
 * { city: "Salvador", state: "BA" } → "Salvador, BA"
 */
export function formatCityState(cityState: { city: string; state: string }): string {
  if (!cityState.city || !cityState.state) return '';
  return `${cityState.city}, ${cityState.state}`;
}
