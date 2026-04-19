/**
 * useRobustGeolocation
 *
 * Hook robusto para geolocalizacao.
 * Usa GeolocationService como SSOT e expoe API estavel para consumidores.
 */
import { logger } from '@/shared/utils/logger';
import { useState, useCallback, useEffect, useRef } from 'react';
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import type {
  GeolocationCoords,
  GeolocationResult,
} from '@/core/maps/services/GeolocationService';

export type { GeolocationCoords } from '@/core/maps/services/GeolocationService';

export interface GeolocationState {
  coords: GeolocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  source: 'gps' | 'ip' | 'cache' | null;
}

interface UseRobustGeolocationOptions {
  watch?: boolean;
  timeout?: number;
  maxRetries?: number;
  useCache?: boolean;
  onSuccess?: (coords: GeolocationCoords) => void;
  onError?: (error: string) => void;
}

interface RequestLocationOptions {
  useCache?: boolean;
  forcePrompt?: boolean;
}

export function useRobustGeolocation(options: UseRobustGeolocationOptions = {}) {
  const {
    watch = false,
    timeout = 15000,
    maxRetries = 3,
    useCache = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    permissionState: 'unknown',
    source: null,
  });

  const requestInFlight = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const requestLocation = useCallback(
    async (requestOptions: RequestLocationOptions = {}) => {
      if (requestInFlight.current) {
        logger.warn('[useRobustGeolocation] Request already in flight');
        return;
      }

      requestInFlight.current = true;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        logger.info('[useRobustGeolocation] Starting location lookup');
        const shouldUseCache = requestOptions.useCache ?? useCache;
        const forcePrompt = requestOptions.forcePrompt ?? false;

        const result: GeolocationResult = await GeolocationService.getCurrentLocation({
          useCache: shouldUseCache,
          forcePrompt,
          timeout,
          maxRetries,
          onProgress: (attempt, max) => {
            logger.debug(`[useRobustGeolocation] Attempt ${attempt}/${max}`);
          },
        });

        logger.info('[useRobustGeolocation] Location resolved', {
          source: result.source,
          accuracy: `${Math.round(result.coords.accuracy)}m`,
          coords: result.coords,
        });

        setState({
          coords: result.coords,
          loading: false,
          error: null,
          permissionState: 'granted',
          source: result.source,
        });

        onSuccessRef.current?.(result.coords);
      } catch (error: any) {
        const errorCode =
          typeof error?.code === 'string' || typeof error?.code === 'number'
            ? String(error.code)
            : '';
        const rawMessage =
          typeof error?.message === 'string'
            ? error.message
            : 'Could not resolve location';
        const lowerMessage = rawMessage.toLowerCase();
        const isInsecureContext =
          errorCode === 'INSECURE_CONTEXT' ||
          lowerMessage.includes('secure origin') ||
          lowerMessage.includes('secure context') ||
          lowerMessage.includes('only secure') ||
          lowerMessage.includes('https');
        const isPermissionDenied =
          isInsecureContext ||
          errorCode === 'PERMISSION_DENIED' ||
          errorCode === '1' ||
          lowerMessage.includes('negada') ||
          lowerMessage.includes('denied');
        const errorMsg = isInsecureContext
          ? 'Automatic location is unavailable in this environment. Use HTTPS/localhost or provide address manually.'
          : rawMessage;

        if (isPermissionDenied) {
          logger.warn('[useRobustGeolocation] Location unavailable due to permission/context');
        } else {
          logger.error('[useRobustGeolocation] Failed to resolve location', error);
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
          permissionState: isPermissionDenied ? 'denied' : prev.permissionState,
        }));

        onErrorRef.current?.(errorMsg);
      } finally {
        requestInFlight.current = false;
      }
    },
    [useCache, timeout, maxRetries],
  );

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator) || watchIdRef.current !== null) {
      return;
    }

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords: GeolocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        setState((prev) => ({
          ...prev,
          coords,
          error: null,
          permissionState: 'granted',
          source: 'gps',
        }));
        onSuccessRef.current?.(coords);
      },
      (error) => {
        const isPermissionDenied = error?.code === 1;
        const message =
          typeof error?.message === 'string'
            ? error.message
            : 'Could not watch location';

        if (isPermissionDenied) {
          logger.warn('[useRobustGeolocation] Watch position denied');
        } else {
          logger.error('[useRobustGeolocation] Watch position error', error);
        }

        setState((prev) => ({
          ...prev,
          error: message,
          permissionState: isPermissionDenied ? 'denied' : prev.permissionState,
        }));
        onErrorRef.current?.(message);
      },
      {
        enableHighAccuracy: !isMobile,
        timeout: isMobile ? 20000 : timeout,
        maximumAge: isMobile ? 10000 : 5000,
      },
    );
  }, [timeout]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const checkPermission = useCallback(async () => {
    const permission = await GeolocationService.checkPermission();
    setState((prev) => ({ ...prev, permissionState: permission as any }));
    return permission;
  }, []);

  useEffect(() => {
    if (watch) {
      startWatching();
    }
    return () => {
      stopWatching();
      GeolocationService.abort();
    };
  }, [watch, startWatching, stopWatching]);

  const clearCache = useCallback(() => {
    GeolocationService.clearCache();
  }, []);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    checkPermission,
    clearCache,
    isHighAccuracy: state.coords ? state.coords.accuracy < 100 : false,
  };
}
