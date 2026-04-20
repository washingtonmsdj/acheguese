/**
 * 🔒 MOBILITY VALIDATORS - Validação Centralizada
 * 
 * ✅ Validadores reutilizáveis para todo o módulo Mobility
 * ✅ Type guards para type safety
 * ✅ Sanitização de inputs
 * ✅ Prevenção de SQL injection
 * 
 * @module mobility/validators
 */

import { logger } from "@/shared/utils/logger";

// ==================== IDs ====================

/**
 * Valida ID de corrida (UUID v4)
 */
export function isValidRideId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Valida ID de motorista (UUID v4)
 */
export function isValidDriverId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Valida ID de perfil (UUID v4)
 */
export function isValidProfileId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Valida array de IDs
 */
export function isValidIdArray(ids: unknown): ids is string[] {
  if (!Array.isArray(ids)) return false;
  return ids.every(id => isValidProfileId(id));
}

// ==================== COORDENADAS ====================

/**
 * Valida latitude (-90 a 90)
 */
export function isValidLatitude(lat: unknown): lat is number {
  if (typeof lat !== 'number') return false;
  return lat >= -90 && lat <= 90 && !isNaN(lat);
}

/**
 * Valida longitude (-180 a 180)
 */
export function isValidLongitude(lng: unknown): lng is number {
  if (typeof lng !== 'number') return false;
  return lng >= -180 && lng <= 180 && !isNaN(lng);
}

/**
 * Valida par de coordenadas
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Valida objeto de localização
 */
export function isValidLocation(location: unknown): location is { lat: number; lng: number } {
  if (!location || typeof location !== 'object') return false;
  const loc = location as { lat?: unknown; lng?: unknown };
  return isValidLatitude(loc.lat) && isValidLongitude(loc.lng);
}

// ==================== STATUS E MODOS ====================

/**
 * Status válidos de corrida
 */
export const VALID_RIDE_STATUSES = [
  'pending',
  'searching',
  'driver_assigned',
  'driver_arriving',
  'in_progress',
  'completed',
  'cancelled',
  'delivered',
] as const;

export type RideStatus = typeof VALID_RIDE_STATUSES[number];

/**
 * Valida status de corrida
 */
export function isValidRideStatus(status: unknown): status is RideStatus {
  if (typeof status !== 'string') return false;
  return VALID_RIDE_STATUSES.includes(status as RideStatus);
}

/**
 * Modos válidos de corrida
 */
export const VALID_RIDE_MODES = [
  'ride',
  'motoboy',
  'shared',
] as const;

export type RideMode = typeof VALID_RIDE_MODES[number];

/**
 * Valida modo de corrida
 */
export function isValidRideMode(mode: unknown): mode is RideMode {
  if (typeof mode !== 'string') return false;
  return VALID_RIDE_MODES.includes(mode as RideMode);
}

// ==================== VALORES NUMÉRICOS ====================

/**
 * Valida preço (positivo, máximo 10000)
 */
export function isValidPrice(price: unknown): price is number {
  if (typeof price !== 'number') return false;
  return price >= 0 && price <= 10000 && !isNaN(price);
}

/**
 * Valida distância em metros (positivo, máximo 500km)
 */
export function isValidDistance(distance: unknown): distance is number {
  if (typeof distance !== 'number') return false;
  return distance >= 0 && distance <= 500000 && !isNaN(distance);
}

/**
 * Valida avaliação (1 a 5)
 */
export function isValidRating(rating: unknown): rating is number {
  if (typeof rating !== 'number') return false;
  return rating >= 1 && rating <= 5 && !isNaN(rating);
}

/**
 * Valida duração em minutos (positivo, máximo 24h)
 */
export function isValidDuration(duration: unknown): duration is number {
  if (typeof duration !== 'number') return false;
  return duration >= 0 && duration <= 1440 && !isNaN(duration);
}

// ==================== STRINGS ====================

/**
 * Sanitiza endereço (remove caracteres perigosos)
 */
export function sanitizeAddress(address: unknown): string {
  if (typeof address !== 'string') return '';
  
  // Remove caracteres perigosos mas mantém acentos e pontuação comum
  return address
    .trim()
    .replace(/[<>{}[\]\\]/g, '') // Remove caracteres perigosos
    .slice(0, 500); // Limita tamanho
}

/**
 * Sanitiza nota/observação de corrida
 */
export function sanitizeRideNote(note: unknown): string {
  if (typeof note !== 'string') return '';
  
  return note
    .trim()
    .replace(/[<>{}[\]\\]/g, '')
    .slice(0, 1000);
}

/**
 * Valida número de telefone brasileiro
 */
export function isValidPhoneNumber(phone: unknown): phone is string {
  if (typeof phone !== 'string') return false;
  
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida formato brasileiro (10 ou 11 dígitos)
  return /^[1-9]{2}9?[0-9]{8}$/.test(cleaned);
}

/**
 * Sanitiza query de busca
 */
export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>{}[\]\\;'"]/g, '') // Remove caracteres SQL perigosos
    .slice(0, 200);
}

// ==================== PAGINAÇÃO ====================

/**
 * Valida número de página (0 ou positivo)
 */
export function isValidPageParam(page: unknown): page is number {
  if (typeof page !== 'number') return false;
  return Number.isInteger(page) && page >= 0;
}

/**
 * Valida tamanho de página (1 a 100)
 */
export function isValidPageSize(size: unknown): size is number {
  if (typeof size !== 'number') return false;
  return Number.isInteger(size) && size >= 1 && size <= 100;
}

// ==================== OBJETOS COMPLEXOS ====================

/**
 * Valida dados de criação de corrida
 */
export function isValidCreateRideData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const ride = data as Record<string, unknown>;
  
  // Validações obrigatórias
  if (!isValidProfileId(ride.passenger_profile_id)) {
    logger.warn('Invalid passenger_profile_id in create ride data');
    return false;
  }
  
  if (!isValidLocation(ride.pickup_location)) {
    logger.warn('Invalid pickup_location in create ride data');
    return false;
  }
  
  if (!isValidLocation(ride.dropoff_location)) {
    logger.warn('Invalid dropoff_location in create ride data');
    return false;
  }
  
  return true;
}

/**
 * Valida dados de atualização de corrida
 */
export function isValidUpdateRideData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const ride = data as Record<string, unknown>;
  
  // Se status fornecido, validar
  if (ride.status !== undefined && !isValidRideStatus(ride.status)) {
    logger.warn('Invalid status in update ride data', { status: ride.status });
    return false;
  }
  
  // Se preço fornecido, validar
  if (ride.final_price !== undefined && !isValidPrice(ride.final_price)) {
    logger.warn('Invalid final_price in update ride data', { price: ride.final_price });
    return false;
  }
  
  return true;
}

// ==================== HELPERS DE VALIDAÇÃO ====================

/**
 * Valida e retorna ID ou lança erro
 */
export function validateRideId(id: unknown): string {
  if (!isValidRideId(id)) {
    throw new Error(`ID de corrida inválido: ${id}`);
  }
  return id;
}

/**
 * Valida e retorna coordenadas ou lança erro
 */
export function validateCoordinates(lat: unknown, lng: unknown): { lat: number; lng: number } {
  if (!isValidCoordinates(lat, lng)) {
    throw new Error(`Coordenadas inválidas: lat=${lat}, lng=${lng}`);
  }
  return { lat: lat as number, lng: lng as number };
}

/**
 * Valida e retorna status ou lança erro
 */
export function validateRideStatus(status: unknown): RideStatus {
  if (!isValidRideStatus(status)) {
    throw new Error(`Status de corrida inválido: ${status}`);
  }
  return status;
}
