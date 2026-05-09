/**
 * GeolocationService - SSOT para geolocalizacao.
 *
 * Estrategia:
 * 1. Cache local (resposta imediata)
 * 2. GPS com tentativas adaptativas (mobile/desktop)
 * 3. Fallback para IP geolocation quando aplicavel
 */
import { logger } from '@/shared/utils/logger';
import { TIMEOUTS } from '@/shared/constants';

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
  source: 'gps' | 'ip' | 'cache';
  isHighAccuracy: boolean;
}

export interface GeolocationOptions {
  useCache?: boolean;
  timeout?: number;
  maxRetries?: number;
  onProgress?: (attempt: number, maxAttempts: number) => void;
  forcePrompt?: boolean;
}

const CACHE_KEY = 'geolocation_cache_v1';
const CACHE_DURATION = 5 * 60 * 1000;

class GeolocationServiceClass {
  private requestInFlight = false;
  private abortController: AbortController | null = null;

  private createGeolocationError(code: string, message: string): Error {
    const error = new Error(message) as Error & { code?: string };
    error.code = code;
    return error;
  }

  private isSecureRuntime(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (window.isSecureContext) {
      return true;
    }

    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  }

  private isInsecureContextError(error: unknown): boolean {
    const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
    return (
      message.includes('secure origin') ||
      message.includes('secure context') ||
      message.includes('only secure')
    );
  }

  private isPermissionDeniedError(error: unknown): boolean {
    const errorLike = error as { code?: unknown; message?: unknown } | null;
    const message = String(errorLike?.message ?? '').toLowerCase();
    return (
      errorLike?.code === 1 ||
      errorLike?.code === 'PERMISSION_DENIED' ||
      message.includes('permission denied') ||
      message.includes('user denied')
    );
  }

  private isMobileDevice(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }

  private getCachedLocation(): GeolocationResult | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }

      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      logger.info('[GeolocationService] Using cache', {
        age: `${Math.round((Date.now() - data.timestamp) / 1000)}s`,
        accuracy: `${data.result.coords.accuracy}m`,
      });

      return data.result;
    } catch {
      return null;
    }
  }

  private setCachedLocation(result: GeolocationResult): void {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          result,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      logger.warn('[GeolocationService] Could not persist cache', error);
    }
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
      timestamp: position.timestamp,
    };
  }

  private async singleGPSAttempt(
    highAccuracy: boolean,
    timeout: number,
    maxAge: number,
  ): Promise<GeolocationCoords> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(this.createGeolocationError('NOT_SUPPORTED', 'Geolocation is not supported'));
        return;
      }

      const safetyTimer = setTimeout(() => {
        reject(new Error(`Safety timeout after ${timeout + 2000}ms`));
      }, timeout + 2000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(safetyTimer);
          resolve(this.positionToCoords(position));
        },
        (error) => {
          clearTimeout(safetyTimer);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: maxAge,
        },
      );
    });
  }

  private async getGPSLocation(options: GeolocationOptions): Promise<GeolocationCoords | null> {
    const { timeout = TIMEOUTS.GPS_LOCATION, maxRetries = 3, onProgress } = options;
    const isMobile = this.isMobileDevice();

    const attempts = isMobile
      ? [
          { highAccuracy: false, timeout: TIMEOUTS.USER_LOCATION - 2000, maxAge: 60000, label: 'mobile-fast' },
          { highAccuracy: true, timeout: TIMEOUTS.GPS_LOCATION, maxAge: 0, label: 'mobile-precise' },
          { highAccuracy: false, timeout: TIMEOUTS.GPS_LOCATION + 5000, maxAge: 0, label: 'mobile-fallback' },
        ]
      : [
          { highAccuracy: true, timeout, maxAge: 0, label: 'desktop-precise' },
          { highAccuracy: false, timeout: timeout + 5000, maxAge: 30000, label: 'desktop-fallback' },
        ];

    for (let i = 0; i < Math.min(attempts.length, maxRetries); i++) {
      const attempt = attempts.at(i);
      if (!attempt) {
        continue;
      }

      try {
        logger.info(
          `[GeolocationService] GPS attempt ${i + 1}/${Math.min(attempts.length, maxRetries)} (${attempt.label})`,
        );
        onProgress?.(i + 1, Math.min(attempts.length, maxRetries));

        const coords = await this.singleGPSAttempt(
          attempt.highAccuracy,
          attempt.timeout,
          attempt.maxAge,
        );

        logger.info('[GeolocationService] GPS success', {
          accuracy: `${Math.round(coords.accuracy)}m`,
        });
        return coords;
      } catch (error: any) {
        const logContext = {
          code: error?.code,
          message: error?.message,
        };

        if (this.isPermissionDeniedError(error)) {
          logger.info(`[GeolocationService] GPS attempt ${i + 1} denied by user`, logContext);
        } else {
          logger.warn(`[GeolocationService] GPS attempt ${i + 1} failed`, logContext);
        }

        if (this.isInsecureContextError(error)) {
          throw this.createGeolocationError(
            'INSECURE_CONTEXT',
            'Automatic location requires HTTPS or localhost.',
          );
        }

        if (this.isPermissionDeniedError(error)) {
          throw this.createGeolocationError(
            'PERMISSION_DENIED',
            'Location permission denied by browser.',
          );
        }

        if (i < Math.min(attempts.length, maxRetries) - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    return null;
  }

  private async getLocationFromIP(signal?: AbortSignal): Promise<GeolocationCoords | null> {
    try {
      logger.info('[GeolocationService] Trying IP geolocation fallback');

      const response = await fetch('https://ipapi.co/json/', { 
        signal,
        // Adicionar timeout para requisição HTTP
        ...(signal ? {} : { signal: AbortSignal.timeout(TIMEOUTS.IP_GEOLOCATION) })
      });
      if (!response.ok) {
        throw new Error('IP geolocation failed');
      }

      const data = await response.json();
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid IP geolocation payload');
      }

      const coords: GeolocationCoords = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 5000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      };

      logger.info('[GeolocationService] IP geolocation success', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: data.city,
      });

      return coords;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.error('[GeolocationService] IP geolocation failed', error);
      }
      return null;
    }
  }

  async checkPermission(): Promise<PermissionState | 'unknown'> {
    if (!('permissions' in navigator)) {
      return 'unknown';
    }

    try {
      const result = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      return result.state;
    } catch {
      return 'unknown';
    }
  }

  async getCurrentLocation(options: GeolocationOptions = {}): Promise<GeolocationResult> {
    const { useCache = true, forcePrompt = false } = options;

    if (this.requestInFlight) {
      throw new Error('Location request already in progress');
    }

    this.requestInFlight = true;
    this.abortController = new AbortController();

    try {
      logger.info('[GeolocationService] Starting location lookup');

      if (!('geolocation' in navigator)) {
        throw this.createGeolocationError(
          'NOT_SUPPORTED',
          'Geolocation is not supported in this browser.',
        );
      }

      if (!this.isSecureRuntime()) {
        throw this.createGeolocationError(
          'INSECURE_CONTEXT',
          'Automatic location requires HTTPS or localhost. Provide address manually.',
        );
      }

      if (useCache && !forcePrompt) {
        const cached = this.getCachedLocation();
        if (cached) {
          logger.info('[GeolocationService] Returning cached location and refreshing in background');
          this.updateLocationInBackground(options);
          return cached;
        }
      }

      if (forcePrompt) {
        logger.info('[GeolocationService] forcePrompt enabled, skipping cache');
      }

      let coords: GeolocationCoords | null = null;
      let source: GeolocationResult['source'] | null = null;
      let permissionDenied = false;

      try {
        coords = await this.getGPSLocation(options);
        if (coords) {
          source = 'gps';
        }
      } catch (error: any) {
        if (error?.code === 'INSECURE_CONTEXT') {
          logger.warn('[GeolocationService] Blocked by insecure context');
          throw error;
        }

        if (this.isPermissionDeniedError(error)) {
          permissionDenied = true;
          logger.info('[GeolocationService] Permission denied by user');
          throw this.createGeolocationError(
            'PERMISSION_DENIED',
            'Location permission denied by browser.',
          );
        }

        logger.warn('[GeolocationService] GPS failed, will try fallback', {
          code: error?.code,
          message: error?.message,
        });
      }

      if (!coords && !permissionDenied) {
        logger.warn('[GeolocationService] Falling back to IP geolocation');
        coords = await this.getLocationFromIP(this.abortController.signal);
        if (coords) {
          source = 'ip';
        }
      }

      if (!coords) {
        if (permissionDenied) {
          throw this.createGeolocationError(
            'PERMISSION_DENIED',
            'Location permission denied. Provide address manually.',
          );
        }

        throw this.createGeolocationError(
          'POSITION_UNAVAILABLE',
          'Could not determine location.',
        );
      }

      const result: GeolocationResult = {
        coords,
        source: source ?? 'gps',
        isHighAccuracy: coords.accuracy < 100,
      };

      this.setCachedLocation(result);

      logger.info('[GeolocationService] Location resolved', {
        source: result.source,
        accuracy: `${Math.round(result.coords.accuracy)}m`,
        isHighAccuracy: result.isHighAccuracy,
      });

      return result;
    } finally {
      this.requestInFlight = false;
      this.abortController = null;
    }
  }

  private async updateLocationInBackground(options: GeolocationOptions): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const coords = await this.getGPSLocation(options);
      if (coords) {
        const result: GeolocationResult = {
          coords,
          source: 'gps',
          isHighAccuracy: coords.accuracy < 100,
        };
        this.setCachedLocation(result);
        logger.info('[GeolocationService] Background cache refresh completed');
      }
    } catch (error) {
      logger.debug('[GeolocationService] Background cache refresh failed', error);
    }
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
    logger.info('[GeolocationService] Cache cleared');
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.requestInFlight = false;
      logger.info('[GeolocationService] Request aborted');
    }
  }
}

export const GeolocationService = new GeolocationServiceClass();
