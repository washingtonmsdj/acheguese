/**
 * Path Normalization Utilities
 * 
 * Funções centralizadas para normalização de paths territoriais.
 * SSOT para manipulação de paths geográficos.
 */

/**
 * Normaliza um path territorial removendo o prefixo /br se presente.
 * 
 * @param path - Path territorial (ex: "/br/ba/salvador" ou "/ba/salvador")
 * @returns Path normalizado sem /br (ex: "/ba/salvador")
 * 
 * @example
 * normalizeTerritoryPath("/br/ba/salvador") // "/ba/salvador"
 * normalizeTerritoryPath("/ba/salvador")    // "/ba/salvador"
 */
export function normalizeTerritoryPath(path: string): string {
  if (!path) return path;
  return path.startsWith('/br/') ? path.replace(/^\/br/, '') : path;
}

/**
 * Adiciona o prefixo /br a um path territorial se não estiver presente.
 * 
 * @param path - Path territorial (ex: "/ba/salvador" ou "/br/ba/salvador")
 * @returns Path com prefixo /br (ex: "/br/ba/salvador")
 * 
 * @example
 * addCountryPrefix("/ba/salvador")    // "/br/ba/salvador"
 * addCountryPrefix("/br/ba/salvador") // "/br/ba/salvador"
 */
export function addCountryPrefix(path: string): string {
  if (!path) return path;
  return path.startsWith('/br/') ? path : `/br${path}`;
}

/**
 * Extrai segmentos de um path territorial.
 * 
 * @param path - Path territorial (ex: "/br/ba/salvador/barra")
 * @returns Array de segmentos (ex: ["br", "ba", "salvador", "barra"])
 * 
 * @example
 * extractPathSegments("/br/ba/salvador/barra") // ["br", "ba", "salvador", "barra"]
 * extractPathSegments("/ba/salvador")          // ["ba", "salvador"]
 */
export function extractPathSegments(path: string): string[] {
  if (!path) return [];
  return path.split('/').filter(Boolean);
}

/**
 * Verifica se um path é territorial válido.
 * 
 * @param path - Path a validar
 * @returns true se o path é válido
 * 
 * @example
 * isValidTerritoryPath("/ba/salvador")    // true
 * isValidTerritoryPath("/br/ba/salvador") // true
 * isValidTerritoryPath("/invalid")        // false
 */
export function isValidTerritoryPath(path: string): boolean {
  if (!path) return false;
  const segments = extractPathSegments(path);
  
  // Mínimo: estado/cidade (2 segmentos) ou país/estado/cidade (3 segmentos)
  if (segments.length < 2) return false;
  
  // Se começa com br, precisa ter pelo menos 3 segmentos
  if (segments[0] === 'br' && segments.length < 3) return false;
  
  return true;
}

/**
 * Compara dois paths territoriais ignorando o prefixo /br.
 * 
 * @param path1 - Primeiro path
 * @param path2 - Segundo path
 * @returns true se os paths são equivalentes
 * 
 * @example
 * arePathsEquivalent("/br/ba/salvador", "/ba/salvador") // true
 * arePathsEquivalent("/ba/salvador", "/ba/salvador")    // true
 * arePathsEquivalent("/ba/salvador", "/ba/feira")       // false
 */
export function arePathsEquivalent(path1: string, path2: string): boolean {
  const normalized1 = normalizeTerritoryPath(path1);
  const normalized2 = normalizeTerritoryPath(path2);
  return normalized1 === normalized2;
}
