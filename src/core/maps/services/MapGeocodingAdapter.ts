/**
 * GeocodingService
 *
 * Camada de compatibilidade para consumidores legados de mapas.
 * O SSOT real agora vive em `@/core/location/services/LocationGeocodingService`.
 */

import {
  locationGeocodingService,
  type LocationGeocodingResult,
} from '@/core/location/services/LocationGeocodingService';
import { logger } from '@/shared/utils/logger';

export interface ReverseGeocodeResult {
  displayName: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  locationId?: string | null;
  locationType?: string | null;
  territoryStatus?: 'matched' | 'partial' | 'unmatched';
}

export interface ForwardGeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  locationId?: string | null;
  locationType?: string | null;
  territoryStatus?: 'matched' | 'partial' | 'unmatched';
}

function mapLocationInfo(result: LocationGeocodingResult) {
  return locationGeocodingService.extractLocationInfo(result);
}

function mapForwardResult(result: LocationGeocodingResult): ForwardGeocodeResult {
  const locationInfo = mapLocationInfo(result);

  return {
    latitude: result.coordinates.latitude,
    longitude: result.coordinates.longitude,
    displayName: result.displayAddress,
    street: result.providerAddress.street ?? undefined,
    number: result.providerAddress.number ?? undefined,
    neighborhood: locationInfo.neighborhood ?? undefined,
    city: locationInfo.city ?? undefined,
    state: locationInfo.state ?? undefined,
    postalCode: result.systemAddress.postalCode ?? undefined,
    locationId: locationInfo.locationId,
    locationType: locationInfo.locationType,
    territoryStatus: locationInfo.territoryStatus,
  };
}

function mapReverseResult(result: LocationGeocodingResult): ReverseGeocodeResult {
  const locationInfo = mapLocationInfo(result);

  return {
    displayName: result.displayAddress,
    street: result.providerAddress.street ?? undefined,
    number: result.providerAddress.number ?? undefined,
    neighborhood: locationInfo.neighborhood ?? undefined,
    city: locationInfo.city ?? undefined,
    state: locationInfo.state ?? undefined,
    country: result.systemAddress.country ?? undefined,
    postalCode: result.systemAddress.postalCode ?? undefined,
    locationId: locationInfo.locationId,
    locationType: locationInfo.locationType,
    territoryStatus: locationInfo.territoryStatus,
  };
}

export class GeocodingService {
  async geocode(address: string): Promise<ForwardGeocodeResult[]> {
    try {
      const results = await locationGeocodingService.geocode({
        query: address,
        country: 'BR',
        limit: 5,
      });

      return results.map(mapForwardResult);
    } catch (error) {
      logger.error('GeocodingService.geocode', error, { address });
      return [];
    }
  }

  async forwardGeocode(address: string): Promise<ForwardGeocodeResult | null> {
    const results = await this.geocode(address);
    return results[0] ?? null;
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult | null> {
    try {
      const result = await locationGeocodingService.reverseGeocode({
        latitude,
        longitude,
        detailLevel: 'suburb',
      });

      return result ? mapReverseResult(result) : null;
    } catch (error) {
      logger.error('GeocodingService.reverseGeocode', error, {
        latitude,
        longitude,
      });
      return null;
    }
  }

  formatCompactAddress(result: ReverseGeocodeResult): string {
    const primary =
      result.street && result.number
        ? `${result.street}, ${result.number}`
        : result.street ?? result.displayName;

    return [primary, result.neighborhood, result.city].filter(Boolean).join(' - ');
  }

  extractLocationInfo(result: ReverseGeocodeResult | ForwardGeocodeResult): {
    city?: string;
    neighborhood?: string;
    state?: string;
    locationId?: string | null;
    locationType?: string | null;
    territoryStatus?: 'matched' | 'partial' | 'unmatched';
  } {
    return {
      city: result.city,
      neighborhood: result.neighborhood,
      state: result.state,
      locationId: result.locationId,
      locationType: result.locationType,
      territoryStatus: result.territoryStatus,
    };
  }
}

export const geocodingService = new GeocodingService();
