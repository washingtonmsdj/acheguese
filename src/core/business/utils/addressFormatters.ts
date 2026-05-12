/**
 * Address Formatters
 * 
 * Utilitários para formatação de endereços
 */

import type { BusinessDataWithProfiles } from '../types';

type AddressLike = {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_type?: 'exact' | 'approximate' | 'landmark' | null;
};

function getAddress(business: BusinessDataWithProfiles): AddressLike | null {
  const candidate = (business as { address?: unknown }).address;
  if (!candidate || typeof candidate !== 'object') return null;
  return candidate as AddressLike;
}

/**
 * Formata endereço completo (modelo canônico)
 */
export function formatFullAddress(business: BusinessDataWithProfiles): string {
  const address = getAddress(business);
  
  if (!address) {
    return '';
  }

  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street);
  }

  if (address.number) {
    parts.push(address.number);
  }

  if (address.complement) {
    parts.push(address.complement);
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  if (address.city) {
    parts.push(address.city);
  }

  if (address.state) {
    parts.push(address.state);
  }

  if (address.postal_code) {
    parts.push(`CEP ${address.postal_code}`);
  }

  return parts.join(', ');
}

/**
 * Formata endereço curto (rua + número)
 */
export function formatShortAddress(business: BusinessDataWithProfiles): string {
  const address = getAddress(business);
  
  if (!address) {
    return '';
  }

  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street);
  }

  if (address.number) {
    parts.push(address.number);
  }

  return parts.join(', ');
}

/**
 * Formata endereço compacto (rua, bairro)
 */
export function formatCompactAddress(business: BusinessDataWithProfiles): string {
  const address = getAddress(business);
  
  if (!address) {
    return '';
  }

  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street);
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  return parts.join(', ');
}

/**
 * Formata CEP (00000-000)
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  
  if (cleaned.length !== 8) {
    return postalCode;
  }

  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

/**
 * Obtém coordenadas do endereço
 */
export function getAddressCoordinates(business: BusinessDataWithProfiles): {
  latitude: number;
  longitude: number;
} | null {
  const address = getAddress(business);
  
  if (!address?.latitude || !address?.longitude) {
    return null;
  }

  if (
    typeof address.latitude !== 'number' ||
    typeof address.longitude !== 'number' ||
    !Number.isFinite(address.latitude) ||
    !Number.isFinite(address.longitude)
  ) {
    return null;
  }

  return {
    latitude: address.latitude,
    longitude: address.longitude,
  };
}

/**
 * Verifica se endereço tem coordenadas válidas
 */
export function hasValidCoordinates(business: BusinessDataWithProfiles): boolean {
  return getAddressCoordinates(business) !== null;
}

/**
 * Formata endereço para exibição em uma linha
 */
export function formatSingleLineAddress(business: BusinessDataWithProfiles): string {
  const address = getAddress(business);
  
  if (!address) {
    return '';
  }

  const parts: string[] = [];

  if (address.street && address.number) {
    parts.push(`${address.street}, ${address.number}`);
  } else if (address.street) {
    parts.push(address.street);
  }

  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  if (address.city) {
    parts.push(address.city);
  }

  return parts.join(' - ');
}

/**
 * Obtém tipo de endereço
 */
export function getAddressType(business: BusinessDataWithProfiles): 'exact' | 'approximate' | 'landmark' | null {
  const address = getAddress(business);
  
  if (!address) {
    return null;
  }

  return address.address_type || null;
}

/**
 * Verifica se endereço é exato
 */
export function isExactAddress(business: BusinessDataWithProfiles): boolean {
  return getAddressType(business) === 'exact';
}

/**
 * Verifica se endereço é aproximado
 */
export function isApproximateAddress(business: BusinessDataWithProfiles): boolean {
  return getAddressType(business) === 'approximate';
}

/**
 * Verifica se endereço é landmark
 */
export function isLandmarkAddress(business: BusinessDataWithProfiles): boolean {
  return getAddressType(business) === 'landmark';
}
