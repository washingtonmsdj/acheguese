/**
 * useGeolocation
 *
 * Hook para sugerir territÃ³rio a partir do GPS.
 * O reverse geocoding passa pela camada territorial centralizada e sÃ³ devolve
 * bairro/cidade/estado reconciliados com `locations`.
 */

import { useState, useCallback, useRef } from 'react';
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import { locationGeocodingService } from '../services/LocationGeocodingService';

interface GeoSuggestion {
  districtName: string | null;
  cityName: string | null;
  stateName: string | null;
  matchedDistrictId: string | null;
  matchedCityId: string | null;
  matchedDistrictPath: string | null;
  matchedCityPath: string | null;
}

interface UseGeolocationResult {
  detect: () => void;
  suggestion: GeoSuggestion | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
}

const toPublicUrl = (geoPath: string) => {
  const parts = geoPath.split('/').filter(Boolean);
  return '/' + parts.slice(1).join('/');
};

export function useGeolocation(): UseGeolocationResult {
  const [suggestion, setSuggestion] = useState<GeoSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const detect = useCallback(async () => {
    if (!isAvailable) {
      setError('GeolocalizaÃ§Ã£o nÃ£o disponÃ­vel neste navegador');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const geoResult = await GeolocationService.getCurrentLocation({ useCache: true });
      const { latitude, longitude } = geoResult.coords;

      const reverseResult = await locationGeocodingService.reverseGeocode({
        latitude,
        longitude,
        detailLevel: 'suburb',
      });

      if (!reverseResult || controller.signal.aborted) {
        return;
      }

      setSuggestion({
        districtName: reverseResult.territory.district?.name ?? null,
        cityName: reverseResult.territory.city?.name ?? null,
        stateName: reverseResult.territory.state?.name ?? null,
        matchedDistrictId: reverseResult.territory.district?.id ?? null,
        matchedCityId: reverseResult.territory.city?.id ?? null,
        matchedDistrictPath: reverseResult.territory.district
          ? toPublicUrl(reverseResult.territory.district.geographic_path)
          : null,
        matchedCityPath: reverseResult.territory.city
          ? toPublicUrl(reverseResult.territory.city.geographic_path)
          : null,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err?.message ?? 'Erro ao detectar localizaÃ§Ã£o');
      }
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  return { detect, suggestion, loading, error, isAvailable };
}
