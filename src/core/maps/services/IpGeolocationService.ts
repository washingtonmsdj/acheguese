import { MAP_DEFAULT_COORDINATES, MAP_DEFAULT_LOCATION } from "../config/defaultCoordinates";
import type { Coordinates } from "../types/core";
import { logger } from "@/shared/utils/logger";

export interface IpGeolocationResult {
  coordinates: Coordinates;
  city?: string;
  region?: string;
  country?: string;
  accuracy: "ip-based";
  source: "ip-geolocation";
}

export interface IpGeolocationError {
  code: "NETWORK_ERROR" | "PARSE_ERROR" | "SERVICE_UNAVAILABLE";
  message: string;
}

export class IpGeolocationService {
  private static readonly TIMEOUT_MS = 5000;
  private static readonly DEFAULT_FALLBACK: Coordinates = MAP_DEFAULT_COORDINATES;

  static async getLocationByIp(): Promise<IpGeolocationResult> {
    try {
      const result = await this.fetchFromIpApiCo();
      if (result) return result;
    } catch (error) {
      logger.warn("ipapi.co falhou:", error);
    }

    try {
      const result = await this.fetchFromIpWhoIs();
      if (result) return result;
    } catch (error) {
      logger.warn("ipwho.is falhou:", error);
    }

    logger.info("Usando fallback configurado de mapa", MAP_DEFAULT_LOCATION);
    return {
      coordinates: this.DEFAULT_FALLBACK,
      city: MAP_DEFAULT_LOCATION.city,
      region: MAP_DEFAULT_LOCATION.region,
      country: MAP_DEFAULT_LOCATION.country,
      accuracy: "ip-based",
      source: "ip-geolocation",
    };
  }

  private static async fetchFromIpApiCo(): Promise<IpGeolocationResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.latitude || !data.longitude) {
        return null;
      }

      return {
        coordinates: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        city: data.city,
        region: data.region,
        country: data.country_name,
        accuracy: "ip-based",
        source: "ip-geolocation",
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout ao buscar localização por IP");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static async fetchFromIpWhoIs(): Promise<IpGeolocationResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch("https://ipwho.is/", {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.latitude || !data.longitude) {
        return null;
      }

      return {
        coordinates: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        city: data.city,
        region: data.region,
        country: data.country,
        accuracy: "ip-based",
        source: "ip-geolocation",
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout ao buscar localização por IP");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static isDefaultFallback(coordinates: Coordinates): boolean {
    return (
      Math.abs(coordinates.latitude - this.DEFAULT_FALLBACK.latitude) < 0.001 &&
      Math.abs(coordinates.longitude - this.DEFAULT_FALLBACK.longitude) < 0.001
    );
  }
}
