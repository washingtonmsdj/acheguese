/**
 * UserLocationResolver - SSOT para resolucao de posicao do usuario
 *
 * Fallback progressivo:
 * 1. GPS do dispositivo (se permitido)
 * 2. Cache de GPS recente
 * 3. Territorio ativo no seletor
 * 4. Cidade de lancamento configurada
 */

import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import { MAP_DEFAULT_COORDINATES, MAP_DEFAULT_LOCATION } from "@/shared/config/mapDefaults";
import {
  GeolocationService,
  isGeolocationPermissionDeniedError,
} from "@/shared/services/GeolocationService";
import { logger } from "@/shared/utils/logger";
import { locationContextStore } from "../stores/LocationContextStore";
import type { Location } from "../types";
import type { ResolvedEntityLocation } from "../types/entityLocation";

export interface UserLocationResolverOptions {
  tryGps?: boolean;
  gpsTimeout?: number;
  useCache?: boolean;
  territoryLocation?: Location | null;
}

class UserLocationResolverClass {
  private getSystemFallbackCenter(): { lat: number; lng: number } {
    return {
      lat: MAP_DEFAULT_COORDINATES.latitude,
      lng: MAP_DEFAULT_COORDINATES.longitude,
    };
  }

  async resolve(options: UserLocationResolverOptions = {}): Promise<ResolvedEntityLocation> {
    const {
      tryGps = true,
      gpsTimeout = GEOLOCATION_RUNTIME.requestTimeoutMs,
      useCache = true,
      territoryLocation,
    } = options;

    if (tryGps) {
      try {
        const result = await GeolocationService.getCurrentLocation({
          useCache,
          timeout: gpsTimeout,
          maxRetries: 2,
        });

        return {
          entityType: "user_gps",
          source: result.source === "ip" ? "ip_geolocation" : "gps",
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          locationId: null,
          locationName: null,
          confidence: result.isHighAccuracy ? "high" : result.source === "ip" ? "low" : "medium",
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (isGeolocationPermissionDeniedError(error)) {
          logger.info("[UserLocationResolver] GPS negado, usando fallback territorial");
        } else {
          logger.warn("[UserLocationResolver] GPS falhou, usando fallback territorial", message);
        }
      }
    }

    return this.resolveFromTerritory(territoryLocation);
  }

  resolveFromTerritory(locationOverride?: Location | null): ResolvedEntityLocation {
    const loc = locationOverride === undefined
      ? locationContextStore.getActiveTerritory()?.location ?? null
      : locationOverride;

    if (loc) {
      const metaLat = Number(loc.metadata?.center_latitude);
      const metaLng = Number(loc.metadata?.center_longitude);
      const hasMetadataCenter =
        Number.isFinite(metaLat) &&
        Number.isFinite(metaLng) &&
        metaLat >= -90 &&
        metaLat <= 90 &&
        metaLng >= -180 &&
        metaLng <= 180 &&
        !(Math.abs(metaLat) < 0.000001 && Math.abs(metaLng) < 0.000001);

      if (hasMetadataCenter) {
        return {
          entityType: "user_gps",
          source: "territory_center",
          latitude: metaLat,
          longitude: metaLng,
          accuracy: 5000,
          locationId: loc.id,
          locationName: loc.name,
          confidence: "low",
        };
      }
    }

    const fallback = this.getSystemFallbackCenter();
    return {
      entityType: "user_gps",
      source: "territory_center",
      latitude: fallback.lat,
      longitude: fallback.lng,
      accuracy: 10000,
      locationId: null,
      locationName: MAP_DEFAULT_LOCATION.city,
      confidence: "low",
    };
  }

  async isGpsAvailable(): Promise<boolean> {
    if (!("geolocation" in navigator)) return false;
    const permission = await GeolocationService.checkPermission();
    return permission === "granted";
  }

  isGoodForProximity(location: ResolvedEntityLocation): boolean {
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return false;
    return location.source === "gps" && (location.accuracy ?? Infinity) < 1000;
  }
}

export const userLocationResolver = new UserLocationResolverClass();
