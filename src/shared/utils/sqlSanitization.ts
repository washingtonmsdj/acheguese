/**
 * SQL Sanitization Utilities
 * 
 * Funções para sanitizar inputs antes de usar em queries SQL
 * Previne SQL injection e outros ataques
 * 
 * @version 1.0.0
 */

/**
 * Sanitiza string para uso em queries ILIKE do Supabase
 * Remove caracteres especiais que podem causar SQL injection
 * 
 * @param input - String a ser sanitizada
 * @returns String sanitizada
 */
export function sanitizeForILike(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove caracteres especiais que podem ser usados em SQL injection
  // Mantém apenas letras, números, espaços e alguns caracteres seguros
  return input
    .replace(/[(),]/g, '')
    .replace(/[%_\\]/g, '') // Remove wildcards do SQL
    .replace(/['";]/g, '') // Remove aspas e ponto-e-vírgula
    .replace(/--/g, '') // Remove comentários SQL
    .replace(/\/\*/g, '') // Remove início de comentário de bloco
    .replace(/\*\//g, '') // Remove fim de comentário de bloco
    .trim()
    .slice(0, 100); // Limita tamanho para prevenir DoS
}

/**
 * Cria um padrao seguro para uso em ILIKE.
 */
export function buildSafeILikePattern(input: string | null | undefined): string | null {
  const sanitized = sanitizeForILike(input ?? '');
  return sanitized ? `%${sanitized}%` : null;
}

/**
 * Cria uma expressao segura para Supabase .or com filtros ILIKE.
 */
export function buildSafeOrILikeFilter(
  columns: readonly string[],
  input: string | null | undefined,
): string | null {
  const sanitized = sanitizeForILike(input ?? '');
  if (!sanitized || columns.length === 0) return null;

  return columns
    .map((column) => `${column}.ilike.%${sanitized}%`)
    .join(',');
}

/**
 * Sanitiza array de strings para uso em queries
 * 
 * @param inputs - Array de strings a serem sanitizadas
 * @returns Array de strings sanitizadas
 */
export function sanitizeArrayForILike(inputs: string[]): string[] {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs
    .filter(input => typeof input === 'string')
    .map(sanitizeForILike)
    .filter(input => input.length > 0);
}

/**
 * Valida se uma string é segura para uso em queries
 * 
 * @param input - String a ser validada
 * @returns true se a string é segura
 */
export function isQuerySafe(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Verifica se contém padrões suspeitos
  const suspiciousPatterns = [
    /['";]/,           // Aspas
    /--/,              // Comentários SQL
    /\/\*/,            // Comentários de bloco
    /\*\//,            // Fim de comentário
    /union\s+select/i, // UNION SELECT
    /drop\s+table/i,   // DROP TABLE
    /delete\s+from/i,  // DELETE FROM
    /insert\s+into/i,  // INSERT INTO
    /update\s+\w+\s+set/i, // UPDATE SET
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Escapa caracteres especiais para uso seguro em queries
 * 
 * @param input - String a ser escapada
 * @returns String escapada
 */
export function escapeForQuery(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')  // Escapa backslash
    .replace(/'/g, "''")     // Escapa aspas simples (padrão SQL)
    .replace(/"/g, '\\"')    // Escapa aspas duplas
    .replace(/\n/g, '\\n')   // Escapa quebras de linha
    .replace(/\r/g, '\\r')   // Escapa retorno de carro
    .replace(/\t/g, '\\t');  // Escapa tabs
}
