/**
 * IpGeolocationService
 * 
 * Serviço para obter localização aproximada baseada em IP.
 * Usado como fallback quando permissão de GPS é negada.
 * 
 * @module core/maps/services
 */

import { logger } from '@/shared/utils/logger';
import { MAP_DEFAULT_COORDINATES } from '../config/defaultCoordinates';
import type { Coordinates } from "../types/core";
export interface IpGeolocationResult {
  coordinates: Coordinates;
  city?: string;
  region?: string;
  country?: string;
  accuracy: "ip-based"; // Sempre baixa precisão
  source: "ip-geolocation";
}

export interface IpGeolocationError {
  code: "NETWORK_ERROR" | "PARSE_ERROR" | "SERVICE_UNAVAILABLE";
  message: string;
}

/**
 * Serviço de geolocalização por IP
 * 
 * Usa múltiplos provedores com fallback:
 * 1. ipapi.co (gratuito, sem API key)
 * 2. ip-api.com (gratuito, sem API key)
 * 3. Fallback para Salvador, BA
 */
export class IpGeolocationService {
  private static readonly TIMEOUT_MS = 5000;
  private static readonly SALVADOR_FALLBACK: Coordinates = MAP_DEFAULT_COORDINATES;

  /**
   * Obtém localização aproximada baseada em IP
   * 
   * @returns Resultado com coordenadas e informações de localização
   * @throws IpGeolocationError se todos os provedores falharem
   */
  static async getLocationByIp(): Promise<IpGeolocationResult> {
    // Tentar ipapi.co primeiro
    try {
      const result = await this.fetchFromIpApiCo();
      if (result) return result;
    } catch (error) {
      logger.warn("ipapi.co falhou:", error);
    }

    // Tentar ip-api.com como fallback
    try {
      const result = await this.fetchFromIpApi();
      if (result) return result;
    } catch (error) {
      logger.warn("ip-api.com falhou:", error);
    }

    // Fallback final: Salvador, BA
    logger.info("Usando fallback para Salvador, BA");
    return {
      coordinates: this.SALVADOR_FALLBACK,
      city: "Salvador",
      region: "Bahia",
      country: "Brasil",
      accuracy: "ip-based",
      source: "ip-geolocation",
    };
  }

  /**
   * Busca localização via ipapi.co
   */
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

  /**
   * Busca localização via ip-api.com
   */
  private static async fetchFromIpApi(): Promise<IpGeolocationResult | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch("http://ip-api.com/json/", {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "success" || !data.lat || !data.lon) {
        return null;
      }

      return {
        coordinates: {
          latitude: data.lat,
          longitude: data.lon,
        },
        city: data.city,
        region: data.regionName,
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

  /**
   * Verifica se as coordenadas são do fallback de Salvador
   */
  static isSalvadorFallback(coordinates: Coordinates): boolean {
    return (
      Math.abs(coordinates.latitude - this.SALVADOR_FALLBACK.latitude) < 0.001 &&
      Math.abs(coordinates.longitude - this.SALVADOR_FALLBACK.longitude) < 0.001
    );
  }
}
