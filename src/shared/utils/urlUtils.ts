/**
 * Utilitários de URL para empresas
 *
 * ATENÇÃO: Para URLs de empresas, use BusinessUrlService.
 * Para funções de slug, use as funções abaixo.
 */

// Re-exporta da fonte canônica
export { RESERVED_SLUGS, isReservedSlug } from '@/core/routing/reservedSlugs';

/**
 * Remove acentos de uma string
 */
function removeAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Gera um slug a partir de um texto
 * Exemplo: "Salão da Ju" → "salao-da-ju"
 */
export function gerarSlug(texto: string): string {
  return removeAcentos(texto)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim
}

/**
 * Valida se um slug é válido (não está na lista de palavras reservadas)
 */
export function isSlugValido(slug: string): boolean {
  return !isReservedSlug(slug.toLowerCase());
}

/**
 * Gera um slug único adicionando sufixo numérico se necessário
 */
export function gerarSlugUnico(
  texto: string,
  slugsExistentes: string[],
): string {
  let slug = gerarSlug(texto);

  // Se for palavra reservada, adiciona sufixo
  if (!isSlugValido(slug)) {
    slug = `${slug}-business`;
  }

  // Se não existe, retorna
  if (!slugsExistentes.includes(slug)) {
    return slug;
  }

  // Adiciona sufixo numérico
  let contador = 1;
  let slugComSufixo = `${slug}-${contador}`;

  while (slugsExistentes.includes(slugComSufixo)) {
    contador++;
    slugComSufixo = `${slug}-${contador}`;
  }

  return slugComSufixo;
}

/**
 * Normaliza texto para URL (city/neighborhood)
 */
export function normalizarParaUrl(texto: string): string {
  return gerarSlug(texto);
}