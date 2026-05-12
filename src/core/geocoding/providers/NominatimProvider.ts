/**
 * NominatimProvider - Provider de geocoding usando OpenStreetMap Nominatim
 * 
 * Responsável por:
 * - Geocoding direto de endereços
 * - Reverse geocoding
 * - Busca de limites (bounds)
 * 
 * Usa proxy Supabase para evitar CORS e rate limiting.
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

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
  geojson?: {
    type: string;
    coordinates: unknown;
  };
}

export class NominatimProvider extends BaseGeocodingProvider {
  readonly id = 'nominatim';
  readonly name = 'OpenStreetMap Nominatim';
  readonly isAvailable = true;

  private proxyUrl: string;
  private apiKey: string | null;

  constructor() {
    super();
    
    // Usa proxy Supabase para evitar CORS
    this.proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nominatim-proxy`;
    this.apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || null;
    
    this.config.cacheTtlSeconds = 3600; // 1 hora para dados OSM
  }

  /**
   * Geocoding direto de endereços
   */
  async geocode(request: GeocodeRequest): Promise<GeocodeResult[]> {
    const cacheKey = this.generateCacheKey('geocode', request);
    const cached = this.getFromCache<GeocodeResult[]>(cacheKey);
    if (cached) {
      this.log('info', 'Cache hit for geocode', { query: request.query });
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: request.query,
        format: 'json',
        addressdetails: '1',
        limit: String(request.limit || 10),
      });

      if (request.city) params.append('city', request.city);
      if (request.state) params.append('state', request.state);
      if (request.country) params.append('country', request.country);

      const url = `${this.proxyUrl}?${params.toString()}`;
      const headers: Record<string, string> = {};
      
      if (this.apiKey) {
        headers['apikey'] = this.apiKey;
      }

      const response = await this.withTimeout(
        fetch(url, { headers })
      );

      if (!response.ok) {
        this.log('warn', 'Nominatim geocode request failed', {
          status: response.status,
          query: request.query,
        });
        return [];
      }

      const results: NominatimResult[] = await response.json();

      if (!results || results.length === 0) {
        return [];
      }

      const geocodeResults = results.map(result => this.nominatimToGeocodeResult(result));
      
      // Cache dos resultados
      this.setToCache(cacheKey, geocodeResults);
      
      this.log('info', 'Geocode successful', {
        query: request.query,
        resultsCount: geocodeResults.length,
      });

      return geocodeResults;
    } catch (error) {
      this.log('error', 'Geocode failed', {
        error: error instanceof Error ? error.message : String(error),
        query: request.query,
      });

      if (error instanceof GeocodingError) {
        throw error;
      }

      throw new GeocodingError(
        'Falha no geocoding. Verifique sua conexão.',
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Reverse geocoding
   */
  async reverseGeocode(request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null> {
    // Validação de coordenadas
    if (!this.validateCoordinates(request.latitude, request.longitude)) {
      throw new GeocodingError(
        'Coordenadas inválidas',
        'INVALID_INPUT',
        { latitude: request.latitude, longitude: request.longitude }
      );
    }

    const cacheKey = this.generateCacheKey('reverseGeocode', request);
    const cached = this.getFromCache<ReverseGeocodeResult>(cacheKey);
    if (cached) {
      this.log('info', 'Cache hit for reverse geocode', {
        lat: request.latitude,
        lng: request.longitude,
      });
      return cached;
    }

    try {
      const headers: Record<string, string> = {};
      
      if (this.apiKey) {
        headers['apikey'] = this.apiKey;
      }

      const requestParams = (includeZoom: boolean) => {
        const params = new URLSearchParams({
          reverse: '1',
          lat: String(request.latitude),
          lon: String(request.longitude),
          format: 'json',
          addressdetails: '1',
        });

        if (includeZoom) {
          params.set('zoom', this.getZoomLevelForDetail(request.detailLevel));
        }

        return params;
      };

      const attemptParams = [requestParams(true), requestParams(false)];

      for (let attempt = 0; attempt < attemptParams.length; attempt++) {
        const params = attemptParams.at(attempt);
        if (!params) {
          continue;
        }
        const url = `${this.proxyUrl}?${params.toString()}`;

        const response = await this.withTimeout(fetch(url, { headers }));

        if (!response.ok) {
          const responseBody = await response.text().catch(() => '');
          this.log('warn', 'Nominatim reverse geocode request failed', {
            status: response.status,
            lat: request.latitude,
            lng: request.longitude,
            attempt: attempt + 1,
            withZoom: attempt === 0,
            responseBody: responseBody.slice(0, 180),
          });
          continue;
        }

        const result: NominatimResult = await response.json();

        if (!result) {
          continue;
        }

        const geocodeResult = this.nominatimToGeocodeResult(result);
        const reverseResult: ReverseGeocodeResult = {
          address: geocodeResult,
          distanceMeters: 0, // Nominatim retorna o ponto exato
          locationType: this.getLocationTypeFromNominatim(result),
        };

        // Cache do resultado
        this.setToCache(cacheKey, reverseResult);

        this.log('info', 'Reverse geocode successful', {
          lat: request.latitude,
          lng: request.longitude,
          address: geocodeResult.formattedAddress,
          attempt: attempt + 1,
          withZoom: attempt === 0,
        });

        return reverseResult;
      }
      return null;
    } catch (error) {
      this.log('error', 'Reverse geocode failed', {
        error: error instanceof Error ? error.message : String(error),
        lat: request.latitude,
        lng: request.longitude,
      });

      if (error instanceof GeocodingError) {
        throw error;
      }

      throw new GeocodingError(
        'Falha no reverse geocoding. Verifique sua conexão.',
        'NETWORK_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Busca por CEP (limitado - Nominatim tem suporte básico)
   */
  async lookupPostalCode(request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null> {
    // Nominatim tem suporte limitado a CEP
    // Podemos tentar geocoding com o CEP como query
    const geocodeResults = await this.geocode({
      query: request.postalCode,
      country: 'BR',
      limit: 1,
    });

    if (geocodeResults.length === 0) {
      return null;
    }

    const result = geocodeResults[0];
    const address = result.addressComponents;

    return {
      postalCode: address.postalCode || request.postalCode,
      street: address.street || '',
      complement: '',
      neighborhood: address.neighborhood || '',
      city: address.city,
      state: address.state,
      ibgeCode: '', // Nominatim não fornece IBGE
      coordinates: {
        latitude: result.coordinates.latitude,
        longitude: result.coordinates.longitude,
      },
    };
  }

  /**
   * Converte resultado Nominatim para GeocodeResult
   */
  private nominatimToGeocodeResult(nominatim: NominatimResult): GeocodeResult {
    const address = nominatim.address || {};
    
    // Determina cidade (pode ser city, town ou municipality)
    const city = address.city || address.town || address.municipality || '';
    
    // Determina bairro (pode ser suburb, neighbourhood ou quarter)
    const neighborhood = address.suburb || address.neighbourhood || address.quarter || '';
    
    // Determina rua e número
    const street = address.road || '';
    const number = address.house_number || '';
    
    // Monta endereço formatado
    const formattedAddress = nominatim.display_name;
    
    // Se tiver bounding box, calcula bounds
    let bounds = undefined;
    if (nominatim.boundingbox) {
      const [south, north, west, east] = nominatim.boundingbox.map(parseFloat);
      bounds = {
        northeast: { latitude: north, longitude: east },
        southwest: { latitude: south, longitude: west },
      };
    }

    // Calcula confiança baseada no tipo de resultado
    const confidence = this.calculateConfidence(nominatim);

    return {
      formattedAddress,
      addressComponents: {
        street: street || undefined,
        number: number || undefined,
        neighborhood: neighborhood || undefined,
        city,
        state: address.state || '',
        postalCode: address.postcode || undefined,
        country: address.country || 'BR',
      },
      coordinates: {
        latitude: parseFloat(nominatim.lat),
        longitude: parseFloat(nominatim.lon),
      },
      confidence,
      source: this.id,
      providerPlaceId: String(nominatim.place_id),
      bounds,
    };
  }

  /**
   * Calcula confiança baseada no tipo de resultado OSM
   */
  private calculateConfidence(nominatim: NominatimResult): number {
    const address = nominatim.address || {};
    
    // Alta confiança para resultados com house_number
    if (address.house_number) return 0.9;
    
    // Média confiança para resultados com road
    if (address.road) return 0.7;
    
    // Baixa confiança para resultados apenas de cidade/bairro
    if (address.city || address.town || address.suburb) return 0.5;
    
    // Muito baixa confiança para outros
    return 0.3;
  }

  /**
   * Obtém zoom level baseado no nível de detalhe
   */
  private getZoomLevelForDetail(detailLevel?: string): string {
    switch (detailLevel) {
      case 'full': return '18'; // House number level
      case 'suburb': return '16'; // Street level
      case 'city': return '14'; // City level
      case 'state': return '10'; // State level
      default: return '16'; // Default street level
    }
  }

  /**
   * Obtém tipo de local do resultado Nominatim
   */
  private getLocationTypeFromNominatim(nominatim: NominatimResult): string {
    const osmType = nominatim.osm_type;
    
    switch (osmType) {
      case 'node':
        return 'point';
      case 'way':
        return 'way';
      case 'relation':
        return 'relation';
      default:
        return 'unknown';
    }
  }
}
