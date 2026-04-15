/**
 * Core Geocoding Module - Barrel Exports
 * 
 * SSOT para geocoding, reverse geocoding e busca por CEP.
 * 
 * Padrão: Banco → Service → Hook → Component
 */

// Types
export type {
  GeocodeRequest,
  GeocodeResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  PostalCodeLookupRequest,
  PostalCodeLookupResult,
  NormalizeAddressRequest,
  NormalizedAddress,
  GeocodingProvider,
  GeocodingServiceConfig,
  GeocodingError,
  GeocodingStatus,
  GeocodingMetrics,
} from './types';

// Services
export { GeocodingService } from './services/GeocodingService';

// Instance & Configuration
export {
  geocodingService,
  defaultGeocodingConfig,
  initializeGeocodingService,
  isGeocodingAvailable,
  getGeocodingStatus,
  getGeocodingMetrics,
  resetGeocodingMetrics,
} from './instance';

// Hooks
export {
  useGeocoding,
  usePostalCodeLookup,
  useAddressGeocoding,
  useReverseGeocoding,
} from './hooks/useGeocoding';

// Providers (internal use - não exportar para consumidores)
export { ViaCepProvider } from './providers/ViaCepProvider';
export { NominatimProvider } from './providers/NominatimProvider';
export { BaseGeocodingProvider } from './providers/BaseGeocodingProvider';