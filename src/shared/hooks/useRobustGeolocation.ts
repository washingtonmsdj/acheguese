import { useState, useCallback, useEffect, useRef } from "react";
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import {
  GeolocationService,
  isGeolocationPermissionDeniedError,
  type GeolocationCoords as SharedGeolocationCoords,
} from "@/shared/services/GeolocationService";
import { logger } from "@/shared/utils/logger";

export type GeolocationCoords = SharedGeolocationCoords;

export interface GeolocationState {
  coords: GeolocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionState: "prompt" | "granted" | "denied" | "unknown";
  source: "gps" | "ip" | "cache" | null;
}

interface UseRobustGeolocationOptions {
  watch?: boolean;
  timeout?: number;
  useCache?: boolean;
  onSuccess?: (coords: GeolocationCoords) => void;
  onError?: (error: string) => void;
}

interface RequestLocationOptions {
  useCache?: boolean;
}

export function useRobustGeolocation(options: UseRobustGeolocationOptions = {}) {
  const {
    watch = false,
    timeout = GEOLOCATION_RUNTIME.requestTimeoutMs,
    useCache = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    permissionState: "unknown",
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
      if (requestInFlight.current) return;
      requestInFlight.current = true;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await GeolocationService.getCurrentLocation({
          useCache: requestOptions.useCache ?? useCache,
          timeout,
          gpsMode: "precise",
          allowIpFallback: false,
        });

        setState((prev) => ({
          ...prev,
          coords: result.coords,
          loading: false,
          error: null,
          permissionState: result.source === "gps" ? "granted" : prev.permissionState,
          source: result.source,
        }));
        onSuccessRef.current?.(result.coords);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Nao foi possivel obter localizacao.";
        const permissionDenied = isGeolocationPermissionDeniedError(error);

        if (permissionDenied) {
          logger.info("[useRobustGeolocation] requestLocation denied by user", { msg });
        } else {
          logger.warn("[useRobustGeolocation] requestLocation failed", { msg });
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: msg,
          permissionState: permissionDenied ? "denied" : prev.permissionState,
        }));
        onErrorRef.current?.(msg);
      } finally {
        requestInFlight.current = false;
      }
    },
    [timeout, useCache],
  );

  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) return;

    watchIdRef.current = GeolocationService.watchLocation(
      (coords) => {
        setState((prev) => ({
          ...prev,
          coords,
          error: null,
          permissionState: "granted",
          source: "gps",
        }));
        onSuccessRef.current?.(coords);
      },
      (error) => {
        const msg = error instanceof Error ? error.message : "Falha ao acompanhar localizacao.";
        const permissionDenied = isGeolocationPermissionDeniedError(error);

        if (permissionDenied) {
          logger.info("[useRobustGeolocation] watch denied by user", { msg });
        } else {
          logger.warn("[useRobustGeolocation] watch failed", { msg });
        }

        setState((prev) => ({
          ...prev,
          error: msg,
          permissionState: permissionDenied ? "denied" : prev.permissionState,
        }));
        onErrorRef.current?.(msg);
      },
      { timeout },
    );
  }, [timeout]);

  const stopWatching = useCallback(() => {
    GeolocationService.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  const checkPermission = useCallback(async () => {
    const value = await GeolocationService.checkPermission();
    setState((prev) => ({ ...prev, permissionState: value }));
    return value;
  }, []);

  const clearCache = useCallback(() => {
    GeolocationService.clearCache();
  }, []);

  useEffect(() => {
    if (watch) startWatching();
    return () => stopWatching();
  }, [watch, startWatching, stopWatching]);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    checkPermission,
    clearCache,
    isHighAccuracy: state.coords
      ? state.coords.accuracy < GEOLOCATION_RUNTIME.highAccuracyThresholdMeters
      : false,
  };
}
