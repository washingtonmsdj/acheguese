/**
 * Delivery Destination Utilities
 * 
 * Lógica centralizada para gerenciamento de destino de entrega
 * Extraído de GastronomyLandingPage para reutilização e testabilidade
 */

import { isFiniteCoordinate } from './coordinates';

const DELIVERY_DESTINATION_STORAGE_KEY = 'gastronomy.delivery_destination.v1';

export type DeliveryDestinationSource = 'gps' | 'manual_address' | 'saved_residence';

export interface DeliveryDestination {
  source: DeliveryDestinationSource;
  latitude: number;
  longitude: number;
  label: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  reference?: string | null;
  updatedAt: string;
}

/**
 * Lê o destino de entrega armazenado no localStorage
 */
export function readStoredDeliveryDestination(): DeliveryDestination | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DELIVERY_DESTINATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DeliveryDestination>;

    if (
      (parsed.source !== 'gps' &&
        parsed.source !== 'manual_address' &&
        parsed.source !== 'saved_residence') ||
      !isFiniteCoordinate(parsed.latitude) ||
      !isFiniteCoordinate(parsed.longitude) ||
      typeof parsed.label !== 'string' ||
      !parsed.label.trim()
    ) {
      return null;
    }

    return {
      source: parsed.source,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      label: parsed.label,
      street: typeof parsed.street === 'string' ? parsed.street : null,
      number: typeof parsed.number === 'string' ? parsed.number : null,
      complement: typeof parsed.complement === 'string' ? parsed.complement : null,
      neighborhood: typeof parsed.neighborhood === 'string' ? parsed.neighborhood : null,
      city: typeof parsed.city === 'string' ? parsed.city : null,
      state: typeof parsed.state === 'string' ? parsed.state : null,
      postalCode: typeof parsed.postalCode === 'string' ? parsed.postalCode : null,
      reference: typeof parsed.reference === 'string' ? parsed.reference : null,
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Salva o destino de entrega no localStorage
 */
export function saveDeliveryDestination(destination: DeliveryDestination | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!destination) {
    window.localStorage.removeItem(DELIVERY_DESTINATION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    DELIVERY_DESTINATION_STORAGE_KEY,
    JSON.stringify(destination),
  );
}

/**
 * Retorna o label descritivo da fonte do destino
 */
export function getDestinationSourceLabel(source: DeliveryDestinationSource): string {
  switch (source) {
    case 'gps':
      return 'localizacao atual';
    case 'saved_residence':
      return 'endereco salvo';
    case 'manual_address':
      return 'endereco informado';
  }
}

/**
 * Verifica se o navegador pode usar geolocalização
 */
export function canUseBrowserGeolocation(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.isSecureContext) {
    return true;
  }

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

/**
 * Resolve o nível de detalhe para reverse geocoding baseado na fonte e precisão
 */
export function resolveReverseDetailLevel(
  source: 'gps' | 'ip' | 'cache' | null,
  accuracy?: number | null,
): 'full' | 'suburb' | 'city' | null {
  if (typeof accuracy === 'number' && Number.isFinite(accuracy)) {
    if (accuracy > 3000) {
      return null;
    }

    if (accuracy > 1000) {
      return 'city';
    }

    if (accuracy > 250) {
      return 'suburb';
    }
  }

  if (source === 'ip') {
    return 'city';
  }

  return 'full';
}
