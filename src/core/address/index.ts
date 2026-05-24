/**
 * Core Address Module - Barrel Export
 *
 * SSOT para endereços postais.
 * Para geocoding/CEP, use '@/core/location/services/LocationGeocodingService'.
 */

export * from './types';

export { AddressService } from './services/AddressService';
export { ResidentAddressService, residentAddressService } from './services/ResidentAddressService';
export { AddressPrivacyGuard } from './services/AddressPrivacyGuard';

export * from './repositories/IAddressRepository';
export * from './repositories/createAddressRepository';

export { useResidentAddress } from './hooks/useResidentAddress';
export type { ResidentAddressFormState } from './hooks/useResidentAddress';
