import { isBusinessCategory, type BusinessCategory } from "@/shared/taxonomy/businessCategories";

/**
 * Validadores para Business Service
 * 
 * Centraliza validação de entrada para garantir consistência e segurança
 * Inspirado no padrão estabelecido em Gastronomia
 */

/**
 * Valida se um ID é válido (não vazio, formato UUID)
 */
export function isValidBusinessId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }

  if (!id.trim()) {
    return false;
  }

  // Validar formato UUID (opcional mas recomendado)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
}

/**
 * Valida se um array de IDs é válido
 */
export function isValidBusinessIdArray(ids: unknown): ids is string[] {
  if (!Array.isArray(ids)) {
    return false;
  }

  if (ids.length === 0) {
    return false;
  }

  return ids.every(isValidBusinessId);
}

/**
 * Valida se coordenadas são válidas
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
 * Valida categoria de negócio
 */
export function isValidBusinessCategory(category: unknown): category is BusinessCategory {
  return isBusinessCategory(category);
}

/**
 * Valida email
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Valida telefone (formato brasileiro)
 */
export function isValidPhone(phone: unknown): phone is string {
  if (typeof phone !== 'string') {
    return false;
  }

  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Telefone brasileiro: 10 ou 11 dígitos
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Valida URL
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
 * Valida rating (0-5)
 */
export function isValidRating(rating: unknown): rating is number {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating >= 0 &&
    rating <= 5
  );
}

/**
 * Valida número de página
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
 * Valida tamanho de página
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
 * Sanitiza string de busca
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
 * Valida location_id (UUID)
 */
export function isValidLocationId(locationId: unknown): locationId is string {
  if (typeof locationId !== 'string') {
    return false;
  }

  if (!locationId.trim()) {
    return false;
  }

  // Validar formato UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(locationId);
}

/**
 * Valida business role
 */
export function isValidBusinessRole(role: unknown): role is 'standalone' | 'brand_hub' | 'branch' {
  return role === 'standalone' || role === 'brand_hub' || role === 'branch';
}

/**
 * Valida status de negócio
 */
export function isValidBusinessStatus(status: unknown): status is 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted' {
  return (
    status === 'active' ||
    status === 'inactive' ||
    status === 'pending' ||
    status === 'suspended' ||
    status === 'deleted'
  );
}
