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
import { logger } from '@/shared/utils/logger';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { geocodingService } from '@/core/maps/services/MapGeocodingAdapter';
import type { GeolocationCoordinates } from '@/modules/mobility/hooks/useGeolocation';

export interface AddressInputResult {
  text: string;
  coords: GeolocationCoordinates;
  locationId: string;
  displayName: string;
}

export interface UseAddressInputReturn {
  // Estado
  text: string;
  coords: GeolocationCoordinates | null;
  locationId: string;
  isValid: boolean;
  isLoading: boolean;
  isGeocodingGPS: boolean;
  
  // Actions
  setText: (text: string) => void;
  clear: () => void;
  captureGPS: () => Promise<void>;
  geocode: () => Promise<AddressInputResult | null>;
  
  // Helpers
  hasGPS: boolean;
  hasLocationId: boolean;
}

interface UseAddressInputOptions {
  /** Callback quando endereço é validado com sucesso */
  onValidated?: (result: AddressInputResult) => void;
  /** Callback quando há erro */
  onError?: (error: string) => void;
  /** Auto-geocode ao perder foco */
  autoGeocodeOnBlur?: boolean;
}

/**
 * Hook para gerenciar input de endereço com geocoding e GPS
 * 
 * @param options - Opções de configuração
 * @returns Estado e actions do input
 * 
 * @example
 * ```tsx
 * const origin = useAddressInput({
 *   onValidated: (result) => {
 *     logger.debug('Origem validada:', result);
 *   },
 *   autoGeocodeOnBlur: true,
 * });
 * 
 * // Capturar GPS
 * await origin.captureGPS();
 * 
 * // Geocode manual
 * const result = await origin.geocode();
 * ```
 */
export function useAddressInput(options: UseAddressInputOptions = {}): UseAddressInputReturn {
  const { onValidated, onError, autoGeocodeOnBlur = true } = options;
  
  const [text, setText] = useState('');
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [locationId, setLocationId] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocodingGPS, setIsGeocodingGPS] = useState(false);
  
  /**
   * Limpar todos os dados
   */
  const clear = useCallback(() => {
    setText('');
    setCoords(null);
    setLocationId('');
    setIsValid(false);
    setIsLoading(false);
    setIsGeocodingGPS(false);
  }, []);
  
  /**
   * Atualizar texto (limpa validação se mudar)
   */
  const handleSetText = useCallback((newText: string) => {
    setText(newText);
    
    // Se usuário editar, limpar validação anterior
    if (newText !== text && isValid) {
      setCoords(null);
      setLocationId('');
      setIsValid(false);
    }
  }, [text, isValid]);
  
  /**
   * Geocode do texto digitado
   */
  const geocode = useCallback(async (): Promise<AddressInputResult | null> => {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      return null;
    }
    
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
      
      // Atualizar estado
      setText(bestMatch.displayName);
      setCoords(newCoords);
      setLocationId(bestMatch.locationId);
      setIsValid(true);
      
      // Callback de sucesso
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
  
  /**
   * Capturar GPS e fazer reverse geocoding
   */
  const captureGPS = useCallback(async (): Promise<void> => {
    setIsGeocodingGPS(true);
    
    try {
      // Capturar coordenadas GPS
      const gpsCoords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
          reject,
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      
      setCoords(gpsCoords);
      
      // Reverse geocoding
      const result = await geocodingService.reverseGeocode(gpsCoords.latitude, gpsCoords.longitude);
      
      if (result) {
        const displayName = geocodingService.formatCompactAddress(result);
        const info = geocodingService.extractLocationInfo(result);
        const locId = info.locationId ?? '';
        
        setText(displayName);
        setLocationId(locId);
        setIsValid(!!locId);
        
        if (locId) {
          const addressResult: AddressInputResult = {
            text: displayName,
            coords: gpsCoords,
            locationId: locId,
            displayName,
          };
          onValidated?.(addressResult);
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
      logger.error('useAddressInput.captureGPS', error as Error);
      // GPS falhou silenciosamente — usuário digita manualmente
      setIsValid(false);
    } finally {
      setIsGeocodingGPS(false);
    }
  }, [onValidated, onError]);
  
  return {
    // Estado
    text,
    coords,
    locationId,
    isValid,
    isLoading,
    isGeocodingGPS,
    
    // Actions
    setText: handleSetText,
    clear,
    captureGPS,
    geocode,
    
    // Helpers
    hasGPS: !!coords,
    hasLocationId: !!locationId,
  };
}
