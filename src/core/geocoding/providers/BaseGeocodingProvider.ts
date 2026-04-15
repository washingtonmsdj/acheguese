/**
 * BaseGeocodingProvider - Classe base para providers de geocoding
 * 
 * Implementa lógica comum como fallback, cache, logging e validação.
 */

import type {
  GeocodingProvider,
  GeocodeRequest,
  GeocodeResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  PostalCodeLookupRequest,
  PostalCodeLookupResult,
  NormalizeAddressRequest,
  NormalizedAddress,
  GeocodingErrorCode
} from '../types';
import { GeocodingError } from '../types';

export abstract class BaseGeocodingProvider implements GeocodingProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly isAvailable: boolean;

  // Cache simples em memória
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  /**
   * Configuração do provider
   */
  protected config = {
    cacheTtlSeconds: 300, // 5 minutos
    timeoutMs: 10000, // 10 segundos
    maxRetries: 2,
  };

  /**
   * Implementação concreta deve ser fornecida pelas subclasses
   */
  abstract geocode(request: GeocodeRequest): Promise<GeocodeResult[]>;
  abstract reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null>;
  abstract lookupPostalCode(request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null>;

  /**
   * Normalização de endereço (implementação padrão opcional)
   */
  async normalizeAddress(request: NormalizeAddressRequest): Promise<NormalizedAddress> {
    // Implementação padrão: tenta geocoding primeiro, depois normaliza
    const geocodeResults = await this.geocode({
      query: request.rawAddress,
      city: request.city,
      state: request.state,
      country: 'BR',
      limit: 1
    });

    if (geocodeResults.length === 0) {
      throw new GeocodingError(
        'Não foi possível normalizar o endereço',
        'NO_RESULTS',
        { rawAddress: request.rawAddress }
      );
    }

    const bestResult = geocodeResults[0];
    
    return {
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
        isValid: true,
        issues: [],
        confidence: bestResult.confidence,
      },
    };
  }

  /**
   * Valida coordenadas
   */
  protected validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Valida CEP
   */
  protected validatePostalCode(postalCode: string): boolean {
    const cleaned = postalCode.replace(/\D/g, '');
    return cleaned.length === 8;
  }

  /**
   * Limpa CEP para apenas dígitos
   */
  protected cleanPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, '');
  }

  /**
   * Formata CEP para padrão XXXXX-XXX
   */
  protected formatPostalCode(postalCode: string): string {
    const cleaned = this.cleanPostalCode(postalCode);
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return postalCode;
  }

  /**
   * Cache helper
   */
  protected getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTtlSeconds * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Cache helper
   */
  protected setToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Gera chave de cache para uma requisição
   */
  protected generateCacheKey(operation: string, params: Record<string, any>): string {
    return `${this.id}:${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Executa com timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.config.timeoutMs
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GeocodingError('Timeout excedido', 'TIMEOUT'));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Executa com retry
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Não retry para erros de validação
        if (
          error instanceof GeocodingError &&
          (error.code === 'INVALID_INPUT' || error.code === 'VALIDATION_FAILED')
        ) {
          throw error;
        }
        
        // Aguarda antes de retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Log helper
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      provider: this.id,
      level,
      message,
      ...data,
    };
    
    // Em produção, usar logger centralizado
    if (level === 'error') {
      console.error('[GeocodingProvider]', logEntry);
    } else if (level === 'warn') {
      console.warn('[GeocodingProvider]', logEntry);
    } else {
      console.log('[GeocodingProvider]', logEntry);
    }
  }
}