/**
 * UserLocationResolver - SSOT para resolucao de posicao do usuario
 *
 * Fallback progressivo:
 * 1. GPS do dispositivo (se permitido)
 * 2. Cache de GPS recente
 * 3. Territorio ativo no seletor
 * 4. Cidade de lancamento configurada
 */

import { logger } from "@/shared/utils/logger";
import { GeolocationService } from "@/core/maps/services/GeolocationService";
import { MAP_DEFAULT_COORDINATES, MAP_DEFAULT_LOCATION } from "@/shared/config/mapDefaults";
import { locationContextStore } from "../stores/LocationContextStore";
import type { ResolvedEntityLocation } from "../types/entityLocation";

export interface UserLocationResolverOptions {
  tryGps?: boolean;
  gpsTimeout?: number;
  useCache?: boolean;
}

class UserLocationResolverClass {
  private getSystemFallbackCenter(): { lat: number; lng: number } {
    return {
      lat: MAP_DEFAULT_COORDINATES.latitude,
      lng: MAP_DEFAULT_COORDINATES.longitude,
    };
  }

  async resolve(options: UserLocationResolverOptions = {}): Promise<ResolvedEntityLocation> {
    const { tryGps = true, gpsTimeout = 10000, useCache = true } = options;

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
        const normalizedError =
          typeof error === "object" && error !== null
            ? (error as { code?: number; message?: string })
            : {};
        const message = normalizedError.message ?? "";
        const isDenied = normalizedError.code === 1 || message.includes("negada") || message.includes("denied");

        if (isDenied) {
          logger.info("[UserLocationResolver] GPS negado, usando fallback territorial");
        } else {
          logger.warn("[UserLocationResolver] GPS falhou, usando fallback territorial", message);
        }
      }
    }

    return this.resolveFromTerritory();
  }

  resolveFromTerritory(): ResolvedEntityLocation {
    const territory = locationContextStore.getActiveTerritory();

    if (territory?.location) {
      const loc = territory.location;
      const systemFallback = this.getSystemFallbackCenter();

      const metaLat = loc.metadata?.center_latitude as number | undefined;
      const metaLng = loc.metadata?.center_longitude as number | undefined;

      const lat = metaLat ?? systemFallback.lat;
      const lng = metaLng ?? systemFallback.lng;

      return {
        entityType: "user_gps",
        source: "territory_center",
        latitude: lat,
        longitude: lng,
        accuracy: metaLat && metaLng ? 5000 : 10000,
        locationId: loc.id,
        locationName: loc.name,
        confidence: "low",
      };
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
    if (!location.latitude || !location.longitude) return false;
    return location.source === "gps" && (location.accuracy ?? Infinity) < 1000;
  }
}

export const userLocationResolver = new UserLocationResolverClass();
