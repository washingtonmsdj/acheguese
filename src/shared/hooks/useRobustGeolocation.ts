import { useState, useCallback, useEffect, useRef } from "react";
import { logger } from "@/shared/utils/logger";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GeolocationState {
  coords: GeolocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionState: "prompt" | "granted" | "denied" | "unknown";
  source: "gps" | "cache" | null;
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

const CACHE_KEY = "robust_geolocation_cache_v1";

function readCache(): GeolocationCoords | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeolocationCoords;
    if (!parsed?.latitude || !parsed?.longitude) return null;
    const ageMs = Date.now() - parsed.timestamp;
    if (ageMs > 15 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(coords: GeolocationCoords): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(coords));
  } catch {
    // ignore cache failures
  }
}

export function useRobustGeolocation(options: UseRobustGeolocationOptions = {}) {
  const {
    watch = false,
    timeout = 15000,
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
        const shouldUseCache = requestOptions.useCache ?? useCache;
        if (shouldUseCache) {
          const cached = readCache();
          if (cached) {
            setState({
              coords: cached,
              loading: false,
              error: null,
              permissionState: "granted",
              source: "cache",
            });
            onSuccessRef.current?.(cached);
            return;
          }
        }

        if (!("geolocation" in navigator)) {
          throw new Error("Geolocalizacao nao suportada neste navegador.");
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout,
            maximumAge: 10000,
          });
        });

        const coords: GeolocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp || Date.now(),
        };

        writeCache(coords);
        setState({
          coords,
          loading: false,
          error: null,
          permissionState: "granted",
          source: "gps",
        });
        onSuccessRef.current?.(coords);
      } catch (error: any) {
        const msg = error?.message ?? "Nao foi possivel obter localizacao.";
        logger.warn("[useRobustGeolocation] requestLocation failed", { msg });
        setState((prev) => ({
          ...prev,
          loading: false,
          error: msg,
          permissionState: "denied",
        }));
        onErrorRef.current?.(msg);
      } finally {
        requestInFlight.current = false;
      }
    },
    [timeout, useCache],
  );

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator) || watchIdRef.current !== null) return;
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
          timestamp: position.timestamp || Date.now(),
        };
        writeCache(coords);
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
        const msg = error?.message ?? "Falha ao acompanhar localizacao.";
        logger.warn("[useRobustGeolocation] watch failed", { msg });
        setState((prev) => ({ ...prev, error: msg, permissionState: "denied" }));
        onErrorRef.current?.(msg);
      },
      { enableHighAccuracy: true, timeout, maximumAge: 5000 },
    );
  }, [timeout]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const checkPermission = useCallback(async () => {
    if (!("permissions" in navigator) || !("geolocation" in navigator)) {
      return "unknown" as const;
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      const value = permission.state as "prompt" | "granted" | "denied";
      setState((prev) => ({ ...prev, permissionState: value }));
      return value;
    } catch {
      return "unknown" as const;
    }
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
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
    isHighAccuracy: state.coords ? state.coords.accuracy < 100 : false,
  };
}
