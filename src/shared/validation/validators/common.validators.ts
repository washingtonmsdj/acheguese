/**
 * Validadores comuns reutilizáveis
 * 
 * Validadores genéricos que podem ser usados em qualquer módulo
 * 
 * @module shared/validation/validators
 * @version 1.0.0
 */

/**
 * Valida se um ID é UUID válido.
 * 
 * @param id - ID a ser validado
 * @returns true se o ID é válido
 * 
 * @example
 * ```typescript
 * if (!isValidId(userId)) {
 *   throw new Error('ID inválido');
 * }
 * ```
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }

  if (!id.trim()) {
    return false;
  }

  // Validação de UUID: formato padrão com hífens
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Valida se um array de IDs é válido
 * 
 * @param ids - Array de IDs a ser validado
 * @returns true se todos os IDs são válidos
 * 
 * @example
 * ```typescript
 * if (!isValidIdArray(userIds)) {
 *   throw new Error('Array de IDs inválido');
 * }
 * ```
 */
export function isValidIdArray(ids: unknown): ids is string[] {
  if (!Array.isArray(ids)) {
    return false;
  }

  if (ids.length === 0) {
    return false;
  }

  return ids.every(isValidId);
}

/**
 * Valida se coordenadas geográficas são válidas
 * 
 * @param latitude - Latitude (-90 a 90)
 * @param longitude - Longitude (-180 a 180)
 * @returns true se as coordenadas são válidas
 * 
 * @example
 * ```typescript
 * if (!isValidCoordinates(lat, lng)) {
 *   throw new Error('Coordenadas inválidas');
 * }
 * ```
 */
export function isValidCoordinates(
  latitude: unknown,
  longitude: unknown,
): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Valida se um slug é válido
 * 
 * Slug deve conter apenas letras minúsculas, números e hífens
 * 
 * @param slug - Slug a ser validado
 * @returns true se o slug é válido
 * 
 * @example
 * ```typescript
 * if (!isValidSlug('meu-slug-123')) {
 *   throw new Error('Slug inválido');
 * }
 * ```
 */
export function isValidSlug(slug: unknown): slug is string {
  if (typeof slug !== 'string') {
    return false;
  }

  if (!slug.trim()) {
    return false;
  }

  // Slug deve conter apenas letras minúsculas, números e hífens
  if (slug.startsWith('-') || slug.endsWith('-') || slug.includes('--')) {
    return false;
  }

  for (let i = 0; i < slug.length; i += 1) {
    const code = slug.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isLowerAlpha = code >= 97 && code <= 122;
    const isHyphen = code === 45;

    if (!isDigit && !isLowerAlpha && !isHyphen) {
      return false;
    }
  }

  return true;
}

/**
 * Valida parâmetros de território (state, city, district, slug)
 * 
 * @param params - Objeto com parâmetros territoriais
 * @returns true se todos os parâmetros são válidos
 * 
 * @example
 * ```typescript
 * if (!isValidTerritoryParams({ state: 'ba', city: 'salvador', district: 'barra', slug: 'meu-negocio' })) {
 *   throw new Error('Parâmetros territoriais inválidos');
 * }
 * ```
 */
export function isValidTerritoryParams(params: {
  state?: string;
  city?: string;
  district?: string;
  slug?: string;
}): boolean {
  const { state, city, district, slug } = params;

  if (!state || !city || !district || !slug) {
    return false;
  }

  return (
    isValidSlug(state) &&
    isValidSlug(city) &&
    isValidSlug(district) &&
    isValidSlug(slug)
  );
}

/**
 * Sanitiza uma string de busca
 * 
 * Remove caracteres perigosos e limita o tamanho
 * 
 * @param query - String de busca a ser sanitizada
 * @returns String sanitizada ou null se inválida
 * 
 * @example
 * ```typescript
 * const sanitized = sanitizeSearchQuery(userInput);
 * if (!sanitized) {
 *   throw new Error('Busca inválida');
 * }
 * ```
 */
export function sanitizeSearchQuery(query: unknown): string | null {
  if (typeof query !== 'string') {
    return null;
  }

  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  // Remover caracteres perigosos
  const sanitized = trimmed
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/['"]/g, '') // Remove aspas
    .slice(0, 200); // Limita tamanho

  return sanitized || null;
}

/**
 * Valida número de página para paginação
 * 
 * @param pageParam - Número da página
 * @returns true se o número de página é válido
 * 
 * @example
 * ```typescript
 * if (!isValidPageParam(page)) {
 *   throw new Error('Número de página inválido');
 * }
 * ```
 */
export function isValidPageParam(pageParam: unknown): pageParam is number {
  return (
    typeof pageParam === 'number' &&
    Number.isFinite(pageParam) &&
    pageParam >= 0 &&
    Number.isInteger(pageParam)
  );
}

/**
 * Valida tamanho de página para paginação
 * 
 * @param pageSize - Tamanho da página (máximo 100)
 * @returns true se o tamanho de página é válido
 * 
 * @example
 * ```typescript
 * if (!isValidPageSize(size)) {
 *   throw new Error('Tamanho de página inválido');
 * }
 * ```
 */
export function isValidPageSize(pageSize: unknown): pageSize is number {
  return (
    typeof pageSize === 'number' &&
    Number.isFinite(pageSize) &&
    pageSize > 0 &&
    pageSize <= 100 &&
    Number.isInteger(pageSize)
  );
}

/**
 * Valida se um email é válido
 * 
 * @param email - Email a ser validado
 * @returns true se o email é válido
 * 
 * @example
 * ```typescript
 * if (!isValidEmail('user@example.com')) {
 *   throw new Error('Email inválido');
 * }
 * ```
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Valida se uma URL é válida
 * 
 * @param url - URL a ser validada
 * @returns true se a URL é válida
 * 
 * @example
 * ```typescript
 * if (!isValidUrl('https://example.com')) {
 *   throw new Error('URL inválida');
 * }
 * ```
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se uma string não está vazia
 * 
 * @param value - String a ser validada
 * @returns true se a string não está vazia
 * 
 * @example
 * ```typescript
 * if (!isNonEmptyString(name)) {
 *   throw new Error('Nome não pode estar vazio');
 * }
 * ```
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Valida se um número está dentro de um intervalo
 * 
 * @param value - Número a ser validado
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (inclusivo)
 * @returns true se o número está no intervalo
 * 
 * @example
 * ```typescript
 * if (!isNumberInRange(rating, 1, 5)) {
 *   throw new Error('Rating deve estar entre 1 e 5');
 * }
 * ```
 */
export function isNumberInRange(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
