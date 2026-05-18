/**
 * useGeocoding - hooks de geocoding/reverse geocoding.
 *
 * SSOT:
 * - Consome locationGeocodingService (camada central de reconciliacao territorial).
 */

import { useQuery } from '@tanstack/react-query';
import { locationGeocodingService } from '@/core/location/services/LocationGeocodingService';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  formatted?: string;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  address: Address;
  confidence: number;
  source: 'nominatim' | 'cache' | 'manual';
}

export interface ReverseGeocodingResult {
  address: Address;
  confidence: number;
  source: 'nominatim' | 'cache';
}

export interface UseGeocodingOptions {
  address: string;
  enabled?: boolean;
  useCache?: boolean;
  countryCode?: string;
}

function normalizeSource(source: string): 'nominatim' | 'cache' | 'manual' {
  if (source === 'cache') return 'cache';
  if (source === 'manual') return 'manual';
  return 'nominatim';
}

function normalizeReverseSource(source: string): 'nominatim' | 'cache' {
  if (source === 'cache') return 'cache';
  return 'nominatim';
}

export function useGeocoding(options: UseGeocodingOptions) {
  const { address, enabled = true, useCache = true, countryCode = 'br' } = options;

  return useQuery({
    queryKey: ['geocoding', address, countryCode, useCache],
    queryFn: async (): Promise<GeocodingResult | null> => {
      const results = await locationGeocodingService.geocode({
        query: address,
        country: countryCode.toUpperCase(),
        limit: 1,
      });

      if (!results || results.length === 0) {
        return null;
      }

      const result = results[0];

      return {
        coordinates: result.coordinates,
        address: {
          street: result.providerAddress.street ?? undefined,
          number: result.providerAddress.number ?? undefined,
          complement: result.providerAddress.complement ?? undefined,
          neighborhood: result.systemAddress.neighborhood ?? undefined,
          city: result.systemAddress.city ?? undefined,
          state: result.systemAddress.state ?? undefined,
          country: result.systemAddress.country ?? undefined,
          postal_code: result.systemAddress.postalCode ?? undefined,
          formatted: result.displayAddress,
        },
        confidence: result.confidence,
        source: normalizeSource(result.source),
      };
    },
    enabled: enabled && !!address && address.trim().length >= 3,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}

export interface UseReverseGeocodingOptions {
  coordinates: Coordinates | null;
  enabled?: boolean;
  useCache?: boolean;
  zoom?: number;
}

export function useReverseGeocoding(options: UseReverseGeocodingOptions) {
  const { coordinates, enabled = true, useCache = true, zoom = 18 } = options;

  return useQuery({
    queryKey: [
      'reverse-geocoding',
      coordinates?.latitude,
      coordinates?.longitude,
      zoom,
      useCache,
    ],
    queryFn: async (): Promise<ReverseGeocodingResult | null> => {
      if (!coordinates) return null;

      const result = await locationGeocodingService.reverseGeocode({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (!result) {
        return null;
      }

      return {
        address: {
          street: result.providerAddress.street ?? undefined,
          number: result.providerAddress.number ?? undefined,
          complement: result.providerAddress.complement ?? undefined,
          neighborhood: result.systemAddress.neighborhood ?? undefined,
          city: result.systemAddress.city ?? undefined,
          state: result.systemAddress.state ?? undefined,
          country: result.systemAddress.country ?? undefined,
          postal_code: result.systemAddress.postalCode ?? undefined,
          formatted: result.displayAddress,
        },
        confidence: result.confidence,
        source: normalizeReverseSource(result.source),
      };
    },
    enabled: enabled && !!coordinates,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}
