/**
 * GeocodingService - Serviço SSOT para geocoding unificado
 * 
 * Responsabilidades:
 * - Orquestração de múltiplos providers (ViaCEP, Nominatim, etc.)
 * - Fallback por CAPACIDADE (não genérico cego)
 * - Cache unificado
 * - Normalização de resultados
 * 
 * FALLBACK POR CAPACIDADE:
 * - CEP lookup: ViaCEP (primário) → Nominatim (secundário)
 * - Address geocoding: Nominatim (único provider com essa capacidade)
 * - Reverse geocoding: Nominatim (único provider com essa capacidade)
 * 
 * Padrão: Banco → Service → Hook → Component
 */

import type {
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
  GeocodingStatus,
  GeocodingMetrics
} from '../types';
import { GeocodingError } from '../types';

import { ViaCepProvider } from '../providers/ViaCepProvider';
import { NominatimProvider } from '../providers/NominatimProvider';

/**
 * Capacidades de cada provider
 */
type ProviderCapability = 'postal_code_lookup' | 'address_geocoding' | 'reverse_geocoding';

interface ProviderConfig {
  id: string;
  capabilities: ProviderCapability[];
  priority: number; // Menor = maior prioridade
}

export class GeocodingService {
  private static instance: GeocodingService;
  private providers: Map<string, GeocodingProvider>;
  private providerConfigs: ProviderConfig[];
  private config: GeocodingServiceConfig;
  private metrics: GeocodingMetrics;

  private constructor() {
    this.providers = new Map();
    this.providerConfigs = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTimeMs: 0,
      providerUsage: {},
      errorDistribution: {} as Record<string, number>,
    };

    // Configuração padrão
    this.config = {
      defaultProvider: 'nominatim',
      fallbackProviders: ['viacep'],
      timeoutMs: 15000,
      enableCache: true,
      cacheTtlSeconds: 300,
    };

    // Registra providers disponíveis com suas capacidades
    this.registerProviders();
  }

  /**
   * Singleton pattern
   */
  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Configura o serviço
   */
  configure(config: Partial<GeocodingServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Registra providers com suas capacidades explícitas
   * 
   * IMPORTANTE: Cada provider tem capacidades específicas.
   * O fallback é por capacidade, não genérico.
   */
  private registerProviders(): void {
    // ViaCEP: ESPECIALISTA em CEP lookup
    // Capacidades: postal_code_lookup (PRIMÁRIO)
    const viaCepProvider = new ViaCepProvider();
    if (viaCepProvider.isAvailable) {
      this.providers.set(viaCepProvider.id, viaCepProvider);
      this.providerConfigs.push({
        id: viaCepProvider.id,
        capabilities: ['postal_code_lookup'],
        priority: 1, // Primário para CEP
      });
    }

    // Nominatim: ESPECIALISTA em geocoding e reverse geocoding
    // Capacidades: address_geocoding (PRIMÁRIO), reverse_geocoding (PRIMÁRIO), postal_code_lookup (SECUNDÁRIO)
    const nominatimProvider = new NominatimProvider();
    if (nominatimProvider.isAvailable) {
      this.providers.set(nominatimProvider.id, nominatimProvider);
      this.providerConfigs.push({
        id: nominatimProvider.id,
        capabilities: ['address_geocoding', 'reverse_geocoding', 'postal_code_lookup'],
        priority: 2, // Secundário para CEP, primário para outros
      });
    }

    // Futuros providers:
    // - Google Maps: address_geocoding, reverse_geocoding, postal_code_lookup
    // - Mapbox: address_geocoding, reverse_geocoding
  }

  /**
   * Obtém providers ordenados por prioridade para uma capacidade específica
   */
  private getProvidersForCapability(capability: ProviderCapability): GeocodingProvider[] {
    return this.providerConfigs
      .filter(config => config.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority)
      .map(config => this.providers.get(config.id)!)
      .filter(Boolean);
  }

  /**
   * Geocoding de endereço (address → coordinates)
   * 
   * PROVIDERS COMPATÍVEIS:
   * - Nominatim (único com essa capacidade atualmente)
   * 
   * NÃO USA FALLBACK GENÉRICO - apenas providers com capacidade de address_geocoding
   */
  async geocode(request: GeocodeRequest): Promise<GeocodeResult[]> {
    const startTime = Date.now();
    let providerUsed = '';

    try {
      this.metrics.totalRequests++;

      // Obtém apenas providers com capacidade de address_geocoding
      const providers = this.getProvidersForCapability('address_geocoding');

      if (providers.length === 0) {
        throw new GeocodingError(
          'Nenhum provider disponível para geocoding de endereço',
          'PROVIDER_UNAVAILABLE',
          { capability: 'address_geocoding' }
        );
      }

      // Tenta providers em ordem de prioridade
      for (const provider of providers) {
        try {
          const results = await provider.geocode(request);
          
          if (results.length > 0) {
            providerUsed = provider.id;
            this.recordSuccess(provider.id, Date.now() - startTime);
            
            // Ordena por confiança (maior primeiro)
            return results.sort((a, b) => b.confidence - a.confidence);
          }
        } catch (error) {
          this.recordError(provider.id, error);
          continue; // Tenta próximo provider com mesma capacidade
        }
      }

      // Nenhum provider retornou resultados
      throw new GeocodingError(
        'Nenhum resultado encontrado para o endereço',
        'NO_RESULTS',
        { query: request.query }
      );
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Reverse geocoding (coordinates → address)
   * 
   * PROVIDERS COMPATÍVEIS:
   * - Nominatim (único com essa capacidade atualmente)
   * 
   * NÃO USA FALLBACK GENÉRICO - apenas providers com capacidade de reverse_geocoding
   */
  async reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null> {
    const startTime = Date.now();
    let providerUsed = '';

    try {
      this.metrics.totalRequests++;

      // Validação básica
      if (!this.isValidCoordinate(request.latitude, request.longitude)) {
        throw new GeocodingError(
          'Coordenadas inválidas',
          'INVALID_INPUT',
          { latitude: request.latitude, longitude: request.longitude }
        );
      }

      // Obtém apenas providers com capacidade de reverse_geocoding
      const providers = this.getProvidersForCapability('reverse_geocoding');

      if (providers.length === 0) {
        throw new GeocodingError(
          'Nenhum provider disponível para reverse geocoding',
          'PROVIDER_UNAVAILABLE',
          { capability: 'reverse_geocoding' }
        );
      }

      // Tenta providers em ordem de prioridade
      for (const provider of providers) {
        try {
          const result = await provider.reverseGeocode(request);
          
          if (result) {
            providerUsed = provider.id;
            this.recordSuccess(provider.id, Date.now() - startTime);
            return result;
          }
        } catch (error) {
          this.recordError(provider.id, error);
          continue;
        }
      }

      // Nenhum provider retornou resultado
      return null;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Busca por CEP (postal code lookup)
   * 
   * PROVIDERS COMPATÍVEIS (ordem de prioridade):
   * 1. ViaCEP - ESPECIALISTA em CEP brasileiro (primário)
   * 2. Nominatim - suporte básico a CEP (secundário)
   * 
   * NÃO USA FALLBACK GENÉRICO - apenas providers com capacidade de postal_code_lookup
   */
  async lookupPostalCode(request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null> {
    const startTime = Date.now();
    let providerUsed = '';

    try {
      this.metrics.totalRequests++;

      // Validação básica
      if (!this.isValidPostalCode(request.postalCode)) {
        throw new GeocodingError(
          'CEP inválido. Deve conter 8 dígitos.',
          'INVALID_INPUT',
          { postalCode: request.postalCode }
        );
      }

      // Obtém apenas providers com capacidade de postal_code_lookup
      const providers = this.getProvidersForCapability('postal_code_lookup');

      if (providers.length === 0) {
        throw new GeocodingError(
          'Nenhum provider disponível para busca de CEP',
          'PROVIDER_UNAVAILABLE',
          { capability: 'postal_code_lookup' }
        );
      }

      // Tenta providers em ordem de prioridade (ViaCEP primeiro, Nominatim depois)
      for (const provider of providers) {
        try {
          const result = await provider.lookupPostalCode(request);
          
          if (result) {
            providerUsed = provider.id;
            this.recordSuccess(provider.id, Date.now() - startTime);
            return result;
          }
        } catch (error) {
          this.recordError(provider.id, error);
          continue;
        }
      }

      // Nenhum provider encontrou o CEP
      return null;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Normalização de endereço
   * 
   * Usa geocoding internamente, então segue mesma estratégia de providers.
   */
  async normalizeAddress(request: NormalizeAddressRequest): Promise<NormalizedAddress> {
    const startTime = Date.now();

    try {
      this.metrics.totalRequests++;

      // Tenta geocoding primeiro
      const geocodeResults = await this.geocode({
        query: request.rawAddress,
        city: request.city,
        state: request.state,
        country: 'BR',
        limit: 1,
      });

      if (geocodeResults.length === 0) {
        throw new GeocodingError(
          'Não foi possível normalizar o endereço',
          'NO_RESULTS',
          { rawAddress: request.rawAddress }
        );
      }

      const bestResult = geocodeResults[0];

      // Se tiver CEP, valida consistência
      if (request.postalCode && bestResult.addressComponents.postalCode) {
        const cleanedRequestCep = request.postalCode.replace(/\D/g, '');
        const cleanedResultCep = bestResult.addressComponents.postalCode.replace(/\D/g, '');
        
        if (cleanedRequestCep !== cleanedResultCep) {
          // CEP inconsistente - baixa confiança
          bestResult.confidence *= 0.5;
        }
      }

      const normalized: NormalizedAddress = {
        formattedAddress: bestResult.formattedAddress,
        components: {
          street: bestResult.addressComponents.street || null,
          number: bestResult.addressComponents.number || null,
          complement: bestResult.addressComponents.complement || null,
          neighborhood: bestResult.addressComponents.neighborhood || null,
          city: bestResult.addressComponents.city,
          state: bestResult.addressComponents.state,
          postalCode: bestResult.addressComponents.postalCode || null,
          country: bestResult.addressComponents.country,
        },
        coordinates: {
          latitude: bestResult.coordinates.latitude,
          longitude: bestResult.coordinates.longitude,
        },
        validation: {
          isValid: bestResult.confidence > 0.5,
          issues: bestResult.confidence <= 0.5 ? ['Confiança baixa na normalização'] : [],
          confidence: bestResult.confidence,
        },
      };

      this.recordSuccess('geocoding-service', Date.now() - startTime);
      return normalized;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Obtém status do serviço
   */
  getStatus(): GeocodingStatus {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable)
      .map(p => p.id);

    return {
      success: availableProviders.length > 0,
      executionTimeMs: 0,
      providerUsed: 'status-check',
    };
  }

  /**
   * Obtém métricas do serviço
   */
  getMetrics(): GeocodingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reseta métricas
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTimeMs: 0,
      providerUsage: {},
      errorDistribution: {} as Record<string, number>,
    };
  }

  /**
   * Lista providers disponíveis
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.values())
      .filter(p => p.isAvailable)
      .map(p => p.id);
  }

  /**
   * Lista providers por capacidade
   */
  getProvidersByCapability(capability: ProviderCapability): string[] {
    return this.getProvidersForCapability(capability).map(p => p.id);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  private isValidPostalCode(postalCode: string): boolean {
    const cleaned = postalCode.replace(/\D/g, '');
    return cleaned.length === 8; // CEP brasileiro
  }

  private recordSuccess(providerId: string, responseTimeMs: number): void {
    this.metrics.successfulRequests++;
    this.metrics.providerUsage = this.incrementCounter(this.metrics.providerUsage, providerId);
    
    // Atualiza tempo médio de resposta
    const totalTime = this.metrics.averageResponseTimeMs * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTimeMs = (totalTime + responseTimeMs) / this.metrics.successfulRequests;
  }

  private recordError(providerId: string, error: unknown): void {
    const errorCode = error instanceof GeocodingError ? error.code : 'UNKNOWN_ERROR';
    this.metrics.errorDistribution = this.incrementCounter(this.metrics.errorDistribution, errorCode);
  }

  private recordFailure(): void {
    this.metrics.failedRequests++;
  }

  private incrementCounter(source: Record<string, number>, key: string): Record<string, number> {
    let found = false;
    const updated = Object.entries(source).map(([entryKey, value]) => {
      if (entryKey === key) {
        found = true;
        return [entryKey, value + 1] as const;
      }
      return [entryKey, value] as const;
    });

    if (!found) {
      updated.push([key, 1] as const);
    }

    return Object.fromEntries(updated);
  }

  private updateMetrics(startTime: number, providerUsed: string): void {
    // Métricas já atualizadas nos métodos específicos
  }
}
