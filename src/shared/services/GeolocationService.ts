/**
 * GeolocationService — SSOT de infraestrutura para geolocalizacao do device.
 *
 * Responsabilidades:
 * - encapsular Browser Geolocation API;
 * - aplicar politica canonica de cache/timeout/retry;
 * - normalizar erros de permissao e contexto inseguro;
 * - fornecer fallback de IP para consultas one-shot quando aplicavel;
 * - expor watch/clearWatch para consumidores de rastreamento.
 */
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import { logger } from "@/shared/utils/logger";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeolocationResult {
  coords: GeolocationCoords;
  source: "gps" | "ip" | "cache";
  isHighAccuracy: boolean;
}

export interface GeolocationOptions {
  useCache?: boolean;
  timeout?: number;
  maxRetries?: number;
  onProgress?: (attempt: number, maxAttempts: number) => void;
  forcePrompt?: boolean;
  allowIpFallback?: boolean;
  gpsMode?: "adaptive" | "precise";
}

export interface GeolocationWatchOptions {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
}

export type GeolocationErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "NOT_SUPPORTED"
  | "INSECURE_CONTEXT";

export function getGeolocationErrorCode(error: unknown): GeolocationErrorCode | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? (code as GeolocationErrorCode) : undefined;
}

export function isGeolocationPermissionDeniedError(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown } | null;
  const message = String(candidate?.message ?? "").toLowerCase();
  return (
    candidate?.code === 1 ||
    candidate?.code === "PERMISSION_DENIED" ||
    message.includes("permission denied") ||
    message.includes("user denied")
  );
}

function hasValidCoordinates(coords: Pick<GeolocationCoords, "latitude" | "longitude">): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

class GeolocationServiceClass {
  private requestInFlight = false;
  private abortController: AbortController | null = null;

  private getErrorContext(error: unknown): { code?: unknown; message?: string } {
    if (!error || typeof error !== "object") return {};
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: candidate.code,
      message: typeof candidate.message === "string" ? candidate.message : undefined,
    };
  }

  private createGeolocationError(code: GeolocationErrorCode, message: string): Error {
    const error = new Error(message) as Error & { code?: GeolocationErrorCode };
    error.code = code;
    return error;
  }

  private isSecureRuntime(): boolean {
    if (typeof window === "undefined") return false;
    if (window.isSecureContext) return true;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  private isInsecureContextError(error: unknown): boolean {
    const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
    return (
      message.includes("secure origin") ||
      message.includes("secure context") ||
      message.includes("only secure")
    );
  }

  private isMobileDevice(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }

  private positionToCoords(position: GeolocationPosition): GeolocationCoords {
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

  getCachedLocation(): GeolocationResult | null {
    try {
      const cached = localStorage.getItem(GEOLOCATION_RUNTIME.cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached) as {
        result?: GeolocationResult;
        timestamp?: number;
      };
      const result = data.result;
      const timestamp = data.timestamp;

      if (
        !result ||
        !hasValidCoordinates(result.coords) ||
        !Number.isFinite(result.coords.accuracy) ||
        !Number.isFinite(timestamp)
      ) {
        localStorage.removeItem(GEOLOCATION_RUNTIME.cacheKey);
        return null;
      }

      const ageMs = Date.now() - Number(timestamp);
      if (ageMs < 0 || ageMs > GEOLOCATION_RUNTIME.cacheTtlMs) {
        localStorage.removeItem(GEOLOCATION_RUNTIME.cacheKey);
        return null;
      }

      return { ...result, source: "cache" };
    } catch {
      return null;
    }
  }

  private setCachedLocation(result: GeolocationResult): void {
    if (!hasValidCoordinates(result.coords)) return;
    try {
      localStorage.setItem(
        GEOLOCATION_RUNTIME.cacheKey,
        JSON.stringify({ result, timestamp: Date.now() }),
      );
    } catch (error) {
      logger.debug("[GeolocationService] Cache persist skipped", error);
    }
  }

  private async singleGPSAttempt(
    highAccuracy: boolean,
    timeout: number,
    maxAge: number,
  ): Promise<GeolocationCoords> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(this.createGeolocationError("NOT_SUPPORTED", "Geolocation is not supported"));
        return;
      }

      const safetyTimer = window.setTimeout(() => {
        reject(
          this.createGeolocationError(
            "POSITION_UNAVAILABLE",
            `Safety timeout after ${timeout + GEOLOCATION_RUNTIME.safetyTimeoutBufferMs}ms`,
          ),
        );
      }, timeout + GEOLOCATION_RUNTIME.safetyTimeoutBufferMs);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(safetyTimer);
          resolve(this.positionToCoords(position));
        },
        (error) => {
          window.clearTimeout(safetyTimer);
          reject(error);
        },
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: maxAge },
      );
    });
  }

  private async getGPSLocation(options: GeolocationOptions): Promise<GeolocationCoords | null> {
    const {
      timeout = GEOLOCATION_RUNTIME.requestTimeoutMs,
      maxRetries = 3,
      onProgress,
      gpsMode = "adaptive",
    } = options;
    const isMobile = this.isMobileDevice();

    const attempts = gpsMode === "precise"
      ? [{ highAccuracy: true, timeout, maxAge: 0, label: "precise" }]
      : isMobile
        ? [
            {
              highAccuracy: false,
              timeout: GEOLOCATION_RUNTIME.mobileFastTimeoutMs,
              maxAge: GEOLOCATION_RUNTIME.mobileFastMaximumAgeMs,
              label: "mobile-fast",
            },
            { highAccuracy: true, timeout, maxAge: 0, label: "mobile-precise" },
            {
              highAccuracy: false,
              timeout: timeout + GEOLOCATION_RUNTIME.fallbackTimeoutExtensionMs,
              maxAge: 0,
              label: "mobile-fallback",
            },
          ]
        : [
            { highAccuracy: true, timeout, maxAge: 0, label: "desktop-precise" },
            {
              highAccuracy: false,
              timeout: timeout + GEOLOCATION_RUNTIME.fallbackTimeoutExtensionMs,
              maxAge: GEOLOCATION_RUNTIME.desktopFallbackMaximumAgeMs,
              label: "desktop-fallback",
            },
          ];

    const attemptCount = Math.min(attempts.length, Math.max(0, maxRetries));
    for (let index = 0; index < attemptCount; index += 1) {
      const attempt = attempts[index];
      try {
        onProgress?.(index + 1, attemptCount);
        return await this.singleGPSAttempt(
          attempt.highAccuracy,
          attempt.timeout,
          attempt.maxAge,
        );
      } catch (error: unknown) {
        const context = this.getErrorContext(error);
        if (isGeolocationPermissionDeniedError(error)) {
          logger.info(`[GeolocationService] ${attempt.label} denied`, context);
        } else {
          logger.warn(`[GeolocationService] ${attempt.label} failed`, context);
        }

        if (this.isInsecureContextError(error)) {
          throw this.createGeolocationError(
            "INSECURE_CONTEXT",
            "Automatic location requires HTTPS or localhost.",
          );
        }

        if (isGeolocationPermissionDeniedError(error)) {
          throw this.createGeolocationError(
            "PERMISSION_DENIED",
            "Location permission denied by browser.",
          );
        }

        if (index < attemptCount - 1) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, GEOLOCATION_RUNTIME.retryDelayMs),
          );
        }
      }
    }

    return null;
  }

  private async getLocationFromIP(signal?: AbortSignal): Promise<GeolocationCoords | null> {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: signal ?? AbortSignal.timeout(GEOLOCATION_RUNTIME.ipFallbackTimeoutMs),
      });
      if (!response.ok) throw new Error("IP geolocation failed");

      const data = (await response.json()) as { latitude?: unknown; longitude?: unknown };
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);
      if (!hasValidCoordinates({ latitude, longitude })) {
        throw new Error("Invalid IP geolocation payload");
      }

      return {
        latitude,
        longitude,
        accuracy: GEOLOCATION_RUNTIME.ipFallbackAccuracyMeters,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      };
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        logger.warn("[GeolocationService] IP geolocation failed", error);
      }
      return null;
    }
  }

  async checkPermission(): Promise<PermissionState | "unknown"> {
    if (!("permissions" in navigator) || !("geolocation" in navigator)) {
      return "unknown";
    }
    try {
      const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return result.state;
    } catch {
      return "unknown";
    }
  }

  async getCurrentLocation(options: GeolocationOptions = {}): Promise<GeolocationResult> {
    const {
      useCache = true,
      forcePrompt = false,
      allowIpFallback = true,
    } = options;

    if (this.requestInFlight) {
      throw new Error("Location request already in progress");
    }

    this.requestInFlight = true;
    this.abortController = new AbortController();

    try {
      if (!("geolocation" in navigator)) {
        throw this.createGeolocationError(
          "NOT_SUPPORTED",
          "Geolocation is not supported in this browser.",
        );
      }
      if (!this.isSecureRuntime()) {
        throw this.createGeolocationError(
          "INSECURE_CONTEXT",
          "Automatic location requires HTTPS or localhost. Provide address manually.",
        );
      }

      if (useCache && !forcePrompt) {
        const cached = this.getCachedLocation();
        if (cached) {
          void this.updateLocationInBackground(options);
          return cached;
        }
      }

      let coords: GeolocationCoords | null = null;
      let source: GeolocationResult["source"] | null = null;

      try {
        coords = await this.getGPSLocation(options);
        if (coords) source = "gps";
      } catch (error: unknown) {
        const code = getGeolocationErrorCode(error);
        if (code === "INSECURE_CONTEXT" || code === "PERMISSION_DENIED") throw error;
        logger.warn("[GeolocationService] GPS failed", this.getErrorContext(error));
      }

      if (!coords && allowIpFallback) {
        coords = await this.getLocationFromIP(this.abortController.signal);
        if (coords) source = "ip";
      }

      if (!coords) {
        throw this.createGeolocationError("POSITION_UNAVAILABLE", "Could not determine location.");
      }

      const result: GeolocationResult = {
        coords,
        source: source ?? "gps",
        isHighAccuracy:
          coords.accuracy < GEOLOCATION_RUNTIME.highAccuracyThresholdMeters,
      };
      this.setCachedLocation(result);
      return result;
    } finally {
      this.requestInFlight = false;
      this.abortController = null;
    }
  }

  watchLocation(
    onSuccess: (coords: GeolocationCoords) => void,
    onError?: (error: unknown) => void,
    options: GeolocationWatchOptions = {},
  ): number | null {
    if (!("geolocation" in navigator)) {
      onError?.(this.createGeolocationError("NOT_SUPPORTED", "Geolocation is not supported"));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        const coords = this.positionToCoords(position);
        const result: GeolocationResult = {
          coords,
          source: "gps",
          isHighAccuracy:
            coords.accuracy < GEOLOCATION_RUNTIME.highAccuracyThresholdMeters,
        };
        this.setCachedLocation(result);
        onSuccess(coords);
      },
      (error) => onError?.(error),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? GEOLOCATION_RUNTIME.requestTimeoutMs,
        maximumAge: options.maximumAge ?? GEOLOCATION_RUNTIME.watchMaximumAgeMs,
      },
    );
  }

  clearWatch(watchId: number | null): void {
    if (watchId == null || !("geolocation" in navigator)) return;
    navigator.geolocation.clearWatch(watchId);
  }

  private async updateLocationInBackground(options: GeolocationOptions): Promise<void> {
    try {
      await new Promise((resolve) =>
        window.setTimeout(resolve, GEOLOCATION_RUNTIME.backgroundRefreshDelayMs),
      );
      const coords = await this.getGPSLocation(options);
      if (!coords) return;
      this.setCachedLocation({
        coords,
        source: "gps",
        isHighAccuracy:
          coords.accuracy < GEOLOCATION_RUNTIME.highAccuracyThresholdMeters,
      });
    } catch (error) {
      logger.debug("[GeolocationService] Background cache refresh failed", error);
    }
  }

  clearCache(): void {
    localStorage.removeItem(GEOLOCATION_RUNTIME.cacheKey);
  }

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.requestInFlight = false;
  }
}

export const GeolocationService = new GeolocationServiceClass();
