/**
 * Core Address Module - Barrel Export
 *
 * SSOT para enderecos postais.
 *
 * Migracao: para geocoding/CEP, use
 * '@/core/location/services/LocationGeocodingService'.
 */

export * from './types';

export { AddressService } from './services/AddressService';
export { ResidentAddressService, residentAddressService } from './services/ResidentAddressService';
export { AddressPrivacyGuard } from './services/AddressPrivacyGuard';

/**
 * @deprecated Use locationGeocodingService from
 * '@/core/location/services/LocationGeocodingService'.
 * CepService sera removido em versoes futuras.
 */
export { CepService } from './services/CepService';

export * from './repositories/IAddressRepository';
export * from './repositories/createAddressRepository';

export { useResidentAddress } from './hooks/useResidentAddress';
export type { ResidentAddressFormState } from './hooks/useResidentAddress';
