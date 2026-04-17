/**
 * NominatimGeocodingProvider - Provider de geocoding Nominatim (OSM)
 * 
 * Implementação de GeocodingProvider usando Nominatim via proxy Supabase.
 * 
 * @module integrations/maps/providers
 */

import type {
  GeocodingProvider,
  GeocodingOptions,
  GeocodeResult,
  PlaceSuggestion,
  Coordinates,
} from '@/core/maps/types';
import { supabase } from '@/integrations/supabase';

/**
 * Resposta do Nominatim
 */
interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
}

/**
 * Provider de geocoding Nominatim
 */
export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nominatim-proxy`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token ?? null;
    return accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
  }

  async geocode(address: string, options?: GeocodingOptions): Promise<GeocodeResult[]> {
    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: String(options?.limit || 5),
      });

      if (options?.country) {
        params.set('countrycodes', options.country);
      }

      if (options?.bounds) {
        const [west, south, east, north] = options.bounds;
        params.set('viewbox', `${west},${south},${east},${north}`);
        params.set('bounded', '1');
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.statusText}`);
      }

      const results: NominatimResult[] = await response.json();
      return results.map((r) => this.mapToGeocodeResult(r));
    } catch (error) {
      console.error('[NominatimGeocoding] Geocode error:', error);
      return [];
    }
  }

  async reverseGeocode(
    coordinates: Coordinates,
    options?: GeocodingOptions
  ): Promise<GeocodeResult[]> {
    try {
      const params = new URLSearchParams({
        lat: String(coordinates.latitude),
        lon: String(coordinates.longitude),
        format: 'json',
        addressdetails: '1',
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.statusText}`);
      }

      const result: NominatimResult = await response.json();
      return [this.mapToGeocodeResult(result)];
    } catch (error) {
      console.error('[NominatimGeocoding] Reverse geocode error:', error);
      return [];
    }
  }

  async searchPlaces(query: string, options?: GeocodingOptions): Promise<PlaceSuggestion[]> {
    try {
      const results = await this.geocode(query, { ...options, limit: 10 });
      return results.map((r) => ({
        id: r.id,
        text: r.name,
        description: r.displayName,
        type: this.mapTypeToSuggestion(r.type),
        coordinates: r.coordinates,
        context: { geocodeResult: r },
      }));
    } catch (error) {
      console.error('[NominatimGeocoding] Search places error:', error);
      return [];
    }
  }

  private mapTypeToSuggestion(type: string): 'address' | 'poi' | 'location' {
    if (type === 'address') return 'address';
    if (type === 'poi') return 'poi';
    return 'location';
  }

  async getPlaceDetails(placeId: string): Promise<GeocodeResult> {
    // Nominatim não tem endpoint de detalhes separado
    // Retornar do cache ou fazer nova busca
    throw new Error('getPlaceDetails not implemented for Nominatim');
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapToGeocodeResult(result: NominatimResult): GeocodeResult {
    const coordinates: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    let bounds: [number, number, number, number] | undefined;
    if (result.boundingbox) {
      const [south, north, west, east] = result.boundingbox.map(parseFloat);
      bounds = [west, south, east, north];
    }

    return {
      id: String(result.place_id),
      name: this.extractName(result.display_name),
      displayName: result.display_name,
      coordinates,
      bounds,
      type: this.mapType(result.type),
      confidence: result.importance || 0.5,
      metadata: {
        class: result.class,
        type: result.type,
        placeId: result.place_id,
      },
    };
  }

  private extractName(displayName: string): string {
    // Pegar primeira parte do display_name
    return displayName.split(',')[0].trim();
  }

  private mapType(
    type: string
  ): 'address' | 'poi' | 'city' | 'district' | 'state' | 'country' {
    const typeMap: Record<string, 'address' | 'poi' | 'city' | 'district' | 'state' | 'country'> =
      {
        house: 'address',
        building: 'address',
        residential: 'address',
        amenity: 'poi',
        shop: 'poi',
        tourism: 'poi',
        city: 'city',
        town: 'city',
        village: 'city',
        suburb: 'district',
        neighbourhood: 'district',
        state: 'state',
        country: 'country',
      };

    return typeMap[type] || 'poi';
  }
}

/**
 * Instância singleton
 */
export const nominatimGeocodingProvider = new NominatimGeocodingProvider();
