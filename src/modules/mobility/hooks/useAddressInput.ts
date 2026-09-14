/**
 * useAddressInput Hook
 *
 * Hook reutilizável para gerenciar inputs de endereço com:
 * - Geocoding automático
 * - Captura de GPS
 * - Validação de território
 * - Feedback visual
 *
 * @module mobility/hooks/useAddressInput
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { geocodingService } from '@/core/maps/services/MapGeocodingAdapter';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';
import { GEOLOCATION_RUNTIME } from '@/shared/config/geolocation';
import { GeolocationService } from '@/shared/services/GeolocationService';
import { logger } from '@/shared/utils/logger';

export interface AddressInputResult {
  text: string;
  coords: GeolocationCoordinates;
  locationId: string;
  displayName: string;
}

export interface UseAddressInputReturn {
  text: string;
  coords: GeolocationCoordinates | null;
  locationId: string;
  isValid: boolean;
  isLoading: boolean;
  isGeocodingGPS: boolean;
  setText: (text: string) => void;
  clear: () => void;
  captureGPS: () => Promise<void>;
  geocode: () => Promise<AddressInputResult | null>;
  hasGPS: boolean;
  hasLocationId: boolean;
}

interface UseAddressInputOptions {
  onValidated?: (result: AddressInputResult) => void;
  onError?: (error: string) => void;
  autoGeocodeOnBlur?: boolean;
}

export function useAddressInput(options: UseAddressInputOptions = {}): UseAddressInputReturn {
  const { onValidated, onError } = options;

  const [text, setText] = useState('');
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [locationId, setLocationId] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocodingGPS, setIsGeocodingGPS] = useState(false);

  const clear = useCallback(() => {
    setText('');
    setCoords(null);
    setLocationId('');
    setIsValid(false);
    setIsLoading(false);
    setIsGeocodingGPS(false);
  }, []);

  const handleSetText = useCallback((newText: string) => {
    setText(newText);
    if (newText !== text && isValid) {
      setCoords(null);
      setLocationId('');
      setIsValid(false);
    }
  }, [text, isValid]);

  const geocode = useCallback(async (): Promise<AddressInputResult | null> => {
    const trimmedText = text.trim();
    if (!trimmedText) return null;

    setIsLoading(true);

    try {
      const results = await geocodingService.geocode(trimmedText);
      const bestMatch = results.find((result) => result.locationId) ?? results[0];

      if (!bestMatch) {
        const errorMsg = 'Endereço não encontrado. Tente ser mais específico.';
        toast.error(errorMsg);
        onError?.(errorMsg);
        setIsValid(false);
        return null;
      }

      if (!bestMatch.locationId) {
        const errorMsg = 'Esse endereço ainda não foi reconciliado com um território atendido.';
        toast.error(errorMsg);
        onError?.(errorMsg);
        setIsValid(false);
        return null;
      }

      const newCoords: GeolocationCoordinates = {
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        accuracy: 0,
      };

      const result: AddressInputResult = {
        text: bestMatch.displayName,
        coords: newCoords,
        locationId: bestMatch.locationId,
        displayName: bestMatch.displayName,
      };

      setText(bestMatch.displayName);
      setCoords(newCoords);
      setLocationId(bestMatch.locationId);
      setIsValid(true);
      onValidated?.(result);
      return result;
    } catch (error) {
      logger.error('useAddressInput.geocode', error as Error, { text: trimmedText });
      const errorMsg = 'Não foi possível validar o endereço informado.';
      toast.error(errorMsg);
      onError?.(errorMsg);
      setIsValid(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [text, onValidated, onError]);

  const captureGPS = useCallback(async (): Promise<void> => {
    setIsGeocodingGPS(true);

    try {
      const location = await GeolocationService.getCurrentLocation({
        useCache: false,
        timeout: GEOLOCATION_RUNTIME.interactivePreciseTimeoutMs,
        gpsMode: 'precise',
        allowIpFallback: false,
      });
      const gpsCoords: GeolocationCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setCoords(gpsCoords);

      const result = await geocodingService.reverseGeocode(gpsCoords.latitude, gpsCoords.longitude);

      if (result) {
        const displayName = geocodingService.formatCompactAddress(result);
        const info = geocodingService.extractLocationInfo(result);
        const locId = info.locationId ?? '';

        setText(displayName);
        setLocationId(locId);
        setIsValid(Boolean(locId));

        if (locId) {
          onValidated?.({
            text: displayName,
            coords: gpsCoords,
            locationId: locId,
            displayName,
          });
        } else {
          const errorMsg = 'Localização GPS fora do território atendido.';
          toast.warning(errorMsg);
          onError?.(errorMsg);
        }
      } else {
        const errorMsg = 'Não foi possível obter endereço da localização GPS.';
        toast.warning(errorMsg);
        onError?.(errorMsg);
        setIsValid(false);
      }
    } catch (error) {
      logger.info('useAddressInput.captureGPS unavailable', {
        message: error instanceof Error ? error.message : String(error),
      });
      setIsValid(false);
    } finally {
      setIsGeocodingGPS(false);
    }
  }, [onValidated, onError]);

  return {
    text,
    coords,
    locationId,
    isValid,
    isLoading,
    isGeocodingGPS,
    setText: handleSetText,
    clear,
    captureGPS,
    geocode,
    hasGPS: Boolean(coords),
    hasLocationId: Boolean(locationId),
  };
}
