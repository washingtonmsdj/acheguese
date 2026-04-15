/**
 * Geocoding Types - Core Geocoding Module (SSOT)
 * 
 * Tipos canônicos para geocoding, reverse geocoding e busca por CEP.
 * Fonte única de verdade para transformação de CEP/endereço/coordenada em dados de localização.
 */

// ============================================================================
// REQUESTS
// ============================================================================

/**
 * Input para busca por endereço/texto
 */
export interface GeocodeRequest {
  /** Endereço completo, nome de rua, ponto de referência, etc. */
  query: string;
  /** Cidade para restringir busca (opcional) */
  city?: string;
  /** Estado para restringir busca (opcional) */
  state?: string;
  /** País para restringir busca (opcional, default: 'BR') */
  country?: string;
  /** Limitar número de resultados (opcional) */
  limit?: number;
}

/**
 * Input para reverse geocoding (coordenada → endereço)
 */
export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
  /** Nível de detalhe do endereço (opcional) */
  detailLevel?: 'full' | 'suburb' | 'city' | 'state';
}

/**
 * Input para busca por CEP
 */
export interface PostalCodeLookupRequest {
  /** CEP no formato XXXXX-XXX ou XXXXXXXX */
  postalCode: string;
  /** Incluir dados de localização territorial (opcional) */
  includeLocationData?: boolean;
}

/**
 * Input para normalização de endereço
 */
export interface NormalizeAddressRequest {
  /** Endereço bruto a ser normalizado */
  rawAddress: string;
  /** CEP para validação cruzada (opcional) */
  postalCode?: string;
  /** Cidade para validação cruzada (opcional) */
  city?: string;
  /** Estado para validação cruzada (opcional) */
  state?: string;
}

// ============================================================================
// RESULTS
// ============================================================================

/**
 * Resultado de geocoding (endereço → coordenada)
 */
export interface GeocodeResult {
  /** Endereço formatado para exibição */
  formattedAddress: string;
  /** Componentes do endereço */
  addressComponents: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  /** Coordenadas geográficas */
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /** Precisão do geocoding (0-1) */
  confidence: number;
  /** Fonte dos dados (viacep, nominatim, google, etc.) */
  source: string;
  /** ID do local no provider (opcional) */
  providerPlaceId?: string;
  /** Bounding box do resultado (opcional) */
  bounds?: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  };
}

/**
 * Resultado de reverse geocoding (coordenada → endereço)
 */
export interface ReverseGeocodeResult {
  /** Endereço mais próximo das coordenadas */
  address: GeocodeResult;
  /** Distância em metros do ponto exato (opcional) */
  distanceMeters?: number;
  /** Tipo de local (street, suburb, city, etc.) */
  locationType: string;
}

/**
 * Resultado de busca por CEP
 */
export interface PostalCodeLookupResult {
  /** CEP formatado (XXXXX-XXX) */
  postalCode: string;
  /** Logradouro */
  street: string;
  /** Complemento */
  complement: string;
  /** Bairro */
  neighborhood: string;
  /** Cidade */
  city: string;
  /** Estado (UF) */
  state: string;
  /** Código IBGE da cidade */
  ibgeCode: string;
  /** Coordenadas aproximadas do CEP (opcional) */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** Dados de localização territorial (se solicitado) */
  locationData?: {
    locationId: string;
    locationName: string;
    locationType: string;
  };
}

/**
 * Endereço normalizado
 */
export interface NormalizedAddress {
  /** Endereço completo formatado */
  formattedAddress: string;
  /** Componentes normalizados */
  components: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
  };
  /** Coordenadas (se disponíveis) */
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  /** Status de validação */
  validation: {
    isValid: boolean;
    issues: string[];
    confidence: number;
  };
}

// ============================================================================
// PROVIDER CONTRACT
// ============================================================================

/**
 * Contrato para providers de geocoding
 */
export interface GeocodingProvider {
  /** Identificador único do provider */
  id: string;
  /** Nome amigável do provider */
  name: string;
  /** Se o provider está disponível (configurado corretamente) */
  isAvailable: boolean;
  
  /** Geocoding direto (endereço → coordenada) */
  geocode(request: GeocodeRequest): Promise<GeocodeResult[]>;
  
  /** Reverse geocoding (coordenada → endereço) */
  reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null>;
  
  /** Busca por CEP */
  lookupPostalCode(request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null>;
  
  /** Normalização de endereço */
  normalizeAddress?(request: NormalizeAddressRequest): Promise<NormalizedAddress>;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

/**
 * Configuração do serviço de geocoding
 */
export interface GeocodingServiceConfig {
  /** Provider padrão a ser usado */
  defaultProvider: string;
  /** Ordem de fallback de providers */
  fallbackProviders: string[];
  /** Timeout em milissegundos para requisições */
  timeoutMs: number;
  /** Habilitar cache de resultados */
  enableCache: boolean;
  /** TTL do cache em segundos */
  cacheTtlSeconds: number;
}

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Erros específicos do módulo de geocoding
 */
export class GeocodingError extends Error {
  constructor(
    message: string,
    public readonly code: GeocodingErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export type GeocodingErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_INPUT'
  | 'NO_RESULTS'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'VALIDATION_FAILED';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Status de uma operação de geocoding
 */
export interface GeocodingStatus {
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Código de erro, se houver */
  errorCode?: GeocodingErrorCode;
  /** Mensagem de erro, se houver */
  errorMessage?: string;
  /** Tempo de execução em milissegundos */
  executionTimeMs: number;
  /** Provider usado */
  providerUsed: string;
}

/**
 * Métricas de uso do geocoding
 */
export interface GeocodingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
  providerUsage: Record<string, number>;
  errorDistribution: Record<GeocodingErrorCode, number>;
}