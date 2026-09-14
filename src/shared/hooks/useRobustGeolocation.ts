import { useState, useCallback, useEffect, useRef } from "react";
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
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

function isPermissionDeniedError(error: unknown): boolean {
  const errorLike = error as { code?: unknown; message?: unknown } | null;
  const message = String(errorLike?.message ?? "").toLowerCase();
  return (
    errorLike?.code === 1 ||
    errorLike?.code === "PERMISSION_DENIED" ||
    message.includes("permission denied") ||
    message.includes("user denied")
  );
}

function hasValidCoordinates(
  coords: Pick<GeolocationCoords, "latitude" | "longitude">,
): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

function toGeolocationCoords(position: GeolocationPosition): GeolocationCoords {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    altitudeAccuracy: position.coords.altitudeAccuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: position.timestamp || Date.now(),
  };
}

function readCache(): GeolocationCoords | null {
  try {
    const raw = localStorage.getItem(GEOLOCATION_RUNTIME.cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GeolocationCoords;
    if (
      !parsed ||
      !hasValidCoordinates(parsed) ||
      !Number.isFinite(parsed.timestamp) ||
      !Number.isFinite(parsed.accuracy)
    ) {
      return null;
    }

    const ageMs = Date.now() - parsed.timestamp;
    if (ageMs < 0 || ageMs > GEOLOCATION_RUNTIME.cacheTtlMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(coords: GeolocationCoords): void {
  if (!hasValidCoordinates(coords)) return;

  try {
    localStorage.setItem(GEOLOCATION_RUNTIME.cacheKey, JSON.stringify(coords));
  } catch {
    // Cache is an optimization only; storage failures must not block GPS usage.
  }
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
            maximumAge: GEOLOCATION_RUNTIME.requestMaximumAgeMs,
          });
        });

        const coords = toGeolocationCoords(position);
        writeCache(coords);
        setState({
          coords,
          loading: false,
          error: null,
          permissionState: "granted",
          source: "gps",
        });
        onSuccessRef.current?.(coords);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Nao foi possivel obter localizacao.";
        const permissionDenied = isPermissionDeniedError(error);

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
    if (!("geolocation" in navigator) || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = toGeolocationCoords(position);
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
        const permissionDenied = isPermissionDeniedError(error);

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
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: GEOLOCATION_RUNTIME.watchMaximumAgeMs,
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
    localStorage.removeItem(GEOLOCATION_RUNTIME.cacheKey);
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
