/**
 * Address Types - Core Address Module
 * 
 * Tipos canônicos para endereços postais (SSOT).
 */

export type AddressType = 'exact' | 'approximate' | 'landmark' | 'gps_only';

export type AddressPrecision = 'exact' | 'interpolated' | 'street' | 'neighborhood' | 'district' | 'city';

export type AddressVerificationStatus = 'pending' | 'verified' | 'rejected';

export type GeocodingSource = 'viacep' | 'google' | 'manual' | 'gps' | 'migration_legacy';

export interface Address {
  id: string;
  location_id: string;
  metadata: Record<string, unknown>;
  postal_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  address_type: AddressType;
  precision: AddressPrecision;
  verification_status: AddressVerificationStatus;
  verified_reason: string | null;
  owner_user_id: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
  geocoding_source: GeocodingSource | null;
  geocoding_confidence: number | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  location_id: string;
  metadata?: Record<string, unknown> | null;
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  address_type?: AddressType;
  precision?: AddressPrecision;
  owner_user_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocoded_at?: string | null;
  geocoding_source?: GeocodingSource | null;
  geocoding_confidence?: number | null;
}

export interface UpdateAddressInput {
  location_id?: string;
  metadata?: Record<string, unknown> | null;
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  address_type?: AddressType;
  precision?: AddressPrecision;
  verification_status?: AddressVerificationStatus;
  verified_reason?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocoded_at?: string | null;
  geocoding_source?: GeocodingSource | null;
  geocoding_confidence?: number | null;
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
}

/**
 * DTO público — nunca expõe rua, número, complemento ou CEP.
 * Fonte de verdade para exibição pública de endereços.
 */
export interface AddressPublicDTO {
  id: string;
  location_id: string;
  address_type: AddressType;
  precision: AddressPrecision;
  verification_status: AddressVerificationStatus;
  /** Coordenadas só se verificado */
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
}

/**
 * Resultado de consulta ViaCEP
 */
export interface CepLookupResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
}

/**
 * Input para o fluxo completo de cadastro de endereço residencial
 */
export interface RegisterResidentAddressInput {
  user_id: string;
  postal_code: string;
  street: string;
  number: string;
  complement?: string;
  /** Se não fornecido, será resolvido via CEP */
  location_id?: string;
}

/**
 * Resultado do registro de endereço residencial
 */
export interface RegisterResidentAddressResult {
  address: Address;
  location_id: string;
  location_name: string;
  residence_id: string;
  verification_status: AddressVerificationStatus;
}
