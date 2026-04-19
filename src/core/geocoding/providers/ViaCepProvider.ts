/**
 * ViaCepProvider - Provider de geocoding usando ViaCEP API
 * 
 * Responsável por:
 * - Busca por CEP (postal code lookup)
 * - Geocoding básico via CEP (aproximação)
 * 
 * Limitações:
 * - Não faz geocoding direto de endereços
 * - Não faz reverse geocoding
 * - Apenas para Brasil
 */

import { BaseGeocodingProvider } from './BaseGeocodingProvider';
import type {
  GeocodeRequest,
  GeocodeResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  PostalCodeLookupRequest,
  PostalCodeLookupResult,
  GeocodingError
} from '../types';

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

export class ViaCepProvider extends BaseGeocodingProvider {
  readonly id = 'viacep';
  readonly name = 'ViaCEP';
  readonly isAvailable = true;

  /**
   * Geocoding via CEP (aproximação)
   * Converte endereço em CEP primeiro, depois busca CEP
   */
  async geocode(request: GeocodeRequest): Promise<GeocodeResult[]> {
    // ViaCEP não suporta geocoding direto de endereços
    // Podemos tentar extrair CEP da query ou retornar vazio
    const cepMatch = request.query.match(/\d{5}-?\d{3}/);
    
    if (!cepMatch) {
      return []; // ViaCEP não pode geocodificar sem CEP
    }

    const cep = cepMatch[0];
    const lookupResult = await this.lookupPostalCode({ postalCode: cep });
    
    if (!lookupResult) {
      return [];
    }

    // Cria resultado aproximado baseado no CEP
    return [{
      formattedAddress: `${lookupResult.street}, ${lookupResult.neighborhood}, ${lookupResult.city} - ${lookupResult.state}`,
      addressComponents: {
        street: lookupResult.street,
        neighborhood: lookupResult.neighborhood,
        city: lookupResult.city,
        state: lookupResult.state,
        postalCode: lookupResult.postalCode,
        country: 'BR',
      },
      coordinates: lookupResult.coordinates || {
        latitude: 0, // ViaCEP não fornece coordenadas
        longitude: 0,
      },
      confidence: 0.3, // Baixa confiança (apenas aproximação por CEP)
      source: this.id,
      providerPlaceId: undefined,
    }];
  }

  /**
   * Reverse geocoding não suportado por ViaCEP
   */
  async reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null> {
    // ViaCEP não suporta reverse geocoding
    return null;
  }

  /**
   * Busca por CEP (funcionalidade principal)
   */
  async lookupPostalCode(request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null> {
    // Validação
    if (!this.validatePostalCode(request.postalCode)) {
      throw new GeocodingError(
        'CEP inválido. Deve conter 8 dígitos.',
        'INVALID_INPUT',
        { postalCode: request.postalCode }
      );
    }

    const cacheKey = this.generateCacheKey('lookupPostalCode', request);
    const cached = this.getFromCache<PostalCodeLookupResult>(cacheKey);
    if (cached) {
      this.log('info', 'Cache hit for postal code lookup', { postalCode: request.postalCode });
      return cached;
    }

    const cleanedCep = this.cleanPostalCode(request.postalCode);
    
    try {
      const response = await this.withTimeout(
        fetch(`${VIACEP_BASE_URL}/${cleanedCep}/json/`)
      );

      if (!response.ok) {
        this.log('warn', 'ViaCEP request failed', {
          status: response.status,
          postalCode: cleanedCep,
        });
        return null;
      }

      const data = await response.json();

      if (data.erro) {
        this.log('info', 'CEP not found', { postalCode: cleanedCep });
        return null;
      }

      const result: PostalCodeLookupResult = {
        postalCode: this.formatPostalCode(data.cep),
        street: data.logradouro || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        ibgeCode: data.ibge || '',
        // ViaCEP não fornece coordenadas
        coordinates: undefined,
      };

      // Cache do resultado
      this.setToCache(cacheKey, result);
      
      this.log('info', 'Postal code lookup successful', {
        postalCode: request.postalCode,
        city: result.city,
        state: result.state,
      });

      return result;
    } catch (error) {
      this.log('error', 'Postal code lookup failed', {
        error: error instanceof Error ? error.message : String(error),
        postalCode: request.postalCode,
      });

      if (error instanceof GeocodingError) {
        throw error;
      }

      throw new GeocodingError(
        'Falha ao consultar CEP. Verifique sua conexão.',
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Override: ViaCEP é específico para Brasil
   */
  protected validatePostalCode(postalCode: string): boolean {
    const cleaned = postalCode.replace(/\D/g, '');
    return cleaned.length === 8; // CEP brasileiro tem 8 dígitos
  }
}