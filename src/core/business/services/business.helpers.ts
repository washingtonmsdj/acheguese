/**
 * 🛠️ BUSINESS HELPERS — Utilitários de negócio puros
 * 
 * Responsabilidade única: helpers e verificações canônicas
 * - Sem acesso a banco de dados
 * - Sem side effects
 * - Transformações e verificações puras
 */

import type { BusinessDataRecord, BusinessDataWithProfiles } from "../types";

type BusinessCoordinatesSource = BusinessDataRecord & {
  address?: { latitude?: number | null; longitude?: number | null } | null;
  location?: { canonical_lat?: number | null; canonical_lng?: number | null } | null;
  metadata?: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Verificar se empresa está migrada para modelo canônico
 * Canônico = tem location_id (não null e não undefined)
 */
export function isBusinessMigrated(business: BusinessDataRecord): boolean {
  return business.location_id !== null && business.location_id !== undefined;
}

/**
 * Verificar se empresa tem endereço físico cadastrado
 */
export function hasPhysicalAddress(business: BusinessDataRecord): boolean {
  return business.address_id !== null && business.address_id !== undefined;
}

/**
 * Obter endereço formatado como string única
 * Usa apenas dados canônicos quando disponíveis
 */
export function getFormattedAddress(
  business: BusinessDataWithProfiles,
): string {
  const addressData = (
    business as BusinessDataWithProfiles & { address?: unknown }
  ).address;

  if (addressData && typeof addressData === "object") {
    const addr = addressData as {
      street?: string | null;
      number?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
    };
    const parts: string[] = [];

    if (addr.street) parts.push(addr.street);
    if (addr.number) parts.push(addr.number);
    if (addr.neighborhood) parts.push(addr.neighborhood);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postal_code) parts.push(`CEP ${addr.postal_code}`);

    return parts.join(", ");
  }

  return "";
}

/**
 * Obter coordenadas geográficas da empresa
 * Retorna null se não houver coordenadas canônicas
 */
export function getCoordinates(
  business: BusinessCoordinatesSource,
): { latitude: number; longitude: number } | null {
  const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

  const addressCoords = business.address;
  if (
    addressCoords &&
    isFiniteNumber(addressCoords.latitude) &&
    isFiniteNumber(addressCoords.longitude)
  ) {
    return {
      latitude: addressCoords.latitude,
      longitude: addressCoords.longitude,
    };
  }

  const canonicalCoords = business.location;
  if (
    canonicalCoords &&
    isFiniteNumber(canonicalCoords.canonical_lat) &&
    isFiniteNumber(canonicalCoords.canonical_lng)
  ) {
    return {
      latitude: canonicalCoords.canonical_lat,
      longitude: canonicalCoords.canonical_lng,
    };
  }

  const metadata = business.metadata;
  if (isRecord(metadata)) {
    const latitude = metadata.latitude ?? metadata.lat ?? metadata.canonical_lat;
    const longitude =
      metadata.longitude ?? metadata.lng ?? metadata.lon ?? metadata.canonical_lng;

    if (isFiniteNumber(latitude) && isFiniteNumber(longitude)) {
      return {
        latitude,
        longitude,
      };
    }
  }

  return null;
}

/**
 * Obter ID do território principal da empresa
 */
export function getTerritory(business: BusinessDataRecord): string | null {
  return business.location_id || null;
}

/**
 * Obter nome do território (cidade/região)
 * Usa apenas location canônico quando disponível
 */
export function getTerritoryName(business: BusinessDataWithProfiles): string | null {
  const locationData = (
    business as BusinessDataWithProfiles & { location?: unknown }
  ).location;

  if (
    locationData &&
    typeof locationData === "object" &&
    "name" in locationData &&
    typeof (locationData as { name?: string }).name === "string"
  ) {
    return (locationData as { name: string }).name;
  }

  return null;
}

/**
 * Gerar username único para empresa a partir do nome
 * FASE PROFILE.1.3 - Helper para criação de username
 */
export function generateBusinessUsername(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "") // Remove caracteres especiais
    .substring(0, 20);

  return `${normalized}_biz`;
}
