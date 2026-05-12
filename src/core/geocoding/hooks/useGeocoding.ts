/**
 * useGeocoding - Hook React para geocoding unificado
 * 
 * Padrão: Component → Hook → Service
 * 
 * Fornece:
 * - Geocoding direto de endereços
 * - Reverse geocoding
 * - Busca por CEP
 * - Normalização de endereço
 * - Estado de loading e erro
 */

import { useState, useCallback, useRef } from 'react';
import { geocodingService } from '../instance';
import type {
  GeocodeRequest,
  GeocodeResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  PostalCodeLookupRequest,
  PostalCodeLookupResult,
  NormalizeAddressRequest,
  NormalizedAddress,
  GeocodingError
} from '../types';

interface UseGeocodingOptions {
  /** Habilitar cache local do hook (além do cache do service) */
  enableLocalCache?: boolean;
  /** TTL do cache local em milissegundos */
  localCacheTtlMs?: number;
  /** Callback para erros */
  onError?: (error: GeocodingError) => void;
}

interface GeocodingState<T> {
  data: T | null;
  isLoading: boolean;
  error: GeocodingError | null;
}

export function useGeocoding(options: UseGeocodingOptions = {}) {
  const {
    enableLocalCache = true,
    localCacheTtlMs = 300000, // 5 minutos
    onError,
  } = options;

  // Cache local do hook
  const cacheRef = useRef(new Map<string, { data: unknown; timestamp: number }>());
  
  // Estado para geocoding
  const [geocodeState, setGeocodeState] = useState<GeocodingState<GeocodeResult[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Estado para reverse geocoding
  const [reverseGeocodeState, setReverseGeocodeState] = useState<GeocodingState<ReverseGeocodeResult>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Estado para busca por CEP
  const [postalCodeState, setPostalCodeState] = useState<GeocodingState<PostalCodeLookupResult>>({
    data: null,
    isLoading: false,
    error: null,
  });

  // Estado para normalização
  const [normalizeState, setNormalizeState] = useState<GeocodingState<NormalizedAddress>>({
    data: null,
    isLoading: false,
    error: null,
  });

  /**
   * Helper para gerenciar cache local
   */
  const getFromLocalCache = useCallback(<T,>(key: string): T | null => {
    if (!enableLocalCache) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > localCacheTtlMs) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data as T;
  }, [enableLocalCache, localCacheTtlMs]);

  const setToLocalCache = useCallback((key: string, data: unknown): void => {
    if (!enableLocalCache) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, [enableLocalCache]);

  const generateCacheKey = useCallback((operation: string, params: unknown): string => {
    return `${operation}:${JSON.stringify(params)}`;
  }, []);

  /**
   * Geocoding direto de endereços
   */
  const geocode = useCallback(async (request: GeocodeRequest): Promise<GeocodeResult[]> => {
    const cacheKey = generateCacheKey('geocode', request);
    const cached = getFromLocalCache<GeocodeResult[]>(cacheKey);
    
    if (cached) {
      setGeocodeState({
        data: cached,
        isLoading: false,
        error: null,
      });
      return cached;
    }

    setGeocodeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await geocodingService.geocode(request);
      
      setGeocodeState({
        data: results,
        isLoading: false,
        error: null,
      });
      
      setToLocalCache(cacheKey, results);
      return results;
    } catch (error) {
      const geocodingError = error as GeocodingError;
      
      setGeocodeState({
        data: null,
        isLoading: false,
        error: geocodingError,
      });
      
      if (onError) {
        onError(geocodingError);
      }
      
      throw geocodingError;
    }
  }, [generateCacheKey, getFromLocalCache, setToLocalCache, onError]);

  /**
   * Reverse geocoding
   */
  const reverseGeocode = useCallback(async (request: ReverseGeocodeRequest): Promise<ReverseGeocodeResult | null> => {
    const cacheKey = generateCacheKey('reverseGeocode', request);
    const cached = getFromLocalCache<ReverseGeocodeResult>(cacheKey);
    
    if (cached) {
      setReverseGeocodeState({
        data: cached,
        isLoading: false,
        error: null,
      });
      return cached;
    }

    setReverseGeocodeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await geocodingService.reverseGeocode(request);
      
      setReverseGeocodeState({
        data: result,
        isLoading: false,
        error: null,
      });
      
      if (result) {
        setToLocalCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      const geocodingError = error as GeocodingError;
      
      setReverseGeocodeState({
        data: null,
        isLoading: false,
        error: geocodingError,
      });
      
      if (onError) {
        onError(geocodingError);
      }
      
      throw geocodingError;
    }
  }, [generateCacheKey, getFromLocalCache, setToLocalCache, onError]);

  /**
   * Busca por CEP
   */
  const lookupPostalCode = useCallback(async (request: PostalCodeLookupRequest): Promise<PostalCodeLookupResult | null> => {
    const cacheKey = generateCacheKey('lookupPostalCode', request);
    const cached = getFromLocalCache<PostalCodeLookupResult>(cacheKey);
    
    if (cached) {
      setPostalCodeState({
        data: cached,
        isLoading: false,
        error: null,
      });
      return cached;
    }

    setPostalCodeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await geocodingService.lookupPostalCode(request);
      
      setPostalCodeState({
        data: result,
        isLoading: false,
        error: null,
      });
      
      if (result) {
        setToLocalCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      const geocodingError = error as GeocodingError;
      
      setPostalCodeState({
        data: null,
        isLoading: false,
        error: geocodingError,
      });
      
      if (onError) {
        onError(geocodingError);
      }
      
      throw geocodingError;
    }
  }, [generateCacheKey, getFromLocalCache, setToLocalCache, onError]);

  /**
   * Normalização de endereço
   */
  const normalizeAddress = useCallback(async (request: NormalizeAddressRequest): Promise<NormalizedAddress> => {
    const cacheKey = generateCacheKey('normalizeAddress', request);
    const cached = getFromLocalCache<NormalizedAddress>(cacheKey);
    
    if (cached) {
      setNormalizeState({
        data: cached,
        isLoading: false,
        error: null,
      });
      return cached;
    }

    setNormalizeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await geocodingService.normalizeAddress(request);
      
      setNormalizeState({
        data: result,
        isLoading: false,
        error: null,
      });
      
      setToLocalCache(cacheKey, result);
      return result;
    } catch (error) {
      const geocodingError = error as GeocodingError;
      
      setNormalizeState({
        data: null,
        isLoading: false,
        error: geocodingError,
      });
      
      if (onError) {
        onError(geocodingError);
      }
      
      throw geocodingError;
    }
  }, [generateCacheKey, getFromLocalCache, setToLocalCache, onError]);

  /**
   * Limpa cache local
   */
  const clearLocalCache = useCallback((): void => {
    cacheRef.current.clear();
    
    // Reseta estados
    setGeocodeState({ data: null, isLoading: false, error: null });
    setReverseGeocodeState({ data: null, isLoading: false, error: null });
    setPostalCodeState({ data: null, isLoading: false, error: null });
    setNormalizeState({ data: null, isLoading: false, error: null });
  }, []);

  /**
   * Reseta um estado específico
   */
  const resetState = useCallback((state: 'geocode' | 'reverseGeocode' | 'postalCode' | 'normalize'): void => {
    switch (state) {
      case 'geocode':
        setGeocodeState({ data: null, isLoading: false, error: null });
        break;
      case 'reverseGeocode':
        setReverseGeocodeState({ data: null, isLoading: false, error: null });
        break;
      case 'postalCode':
        setPostalCodeState({ data: null, isLoading: false, error: null });
        break;
      case 'normalize':
        setNormalizeState({ data: null, isLoading: false, error: null });
        break;
    }
  }, []);

  return {
    // Estados
    geocodeState,
    reverseGeocodeState,
    postalCodeState,
    normalizeState,
    
    // Métodos
    geocode,
    reverseGeocode,
    lookupPostalCode,
    normalizeAddress,
    
    // Utilitários
    clearLocalCache,
    resetState,
    
    // Status do serviço
    isAvailable: geocodingService.getStatus().success,
    availableProviders: geocodingService.getAvailableProviders(),
  };
}

/**
 * Hook especializado para busca por CEP
 */
export function usePostalCodeLookup(options?: UseGeocodingOptions) {
  const { lookupPostalCode, postalCodeState, resetState, clearLocalCache } = useGeocoding(options);
  
  return {
    lookupPostalCode,
    ...postalCodeState,
    reset: () => resetState('postalCode'),
    clearCache: clearLocalCache,
  };
}

/**
 * Hook especializado para geocoding
 */
export function useAddressGeocoding(options?: UseGeocodingOptions) {
  const { geocode, geocodeState, resetState, clearLocalCache } = useGeocoding(options);
  
  return {
    geocode,
    ...geocodeState,
    reset: () => resetState('geocode'),
    clearCache: clearLocalCache,
  };
}

/**
 * Hook especializado para reverse geocoding
 */
export function useReverseGeocoding(options?: UseGeocodingOptions) {
  const { reverseGeocode, reverseGeocodeState, resetState, clearLocalCache } = useGeocoding(options);
  
  return {
    reverseGeocode,
    ...reverseGeocodeState,
    reset: () => resetState('reverseGeocode'),
    clearCache: clearLocalCache,
  };
}
