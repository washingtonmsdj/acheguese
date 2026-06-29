/**
 * OSRMProvider - Provider de roteamento usando OSRM
 * 
 * Implementação real de RoutingProvider usando Open Source Routing Machine.
 * 
 * OSRM: https://project-osrm.org/
 * API Docs: http://project-osrm.org/docs/v5.24.0/api/
 * 
 * FASE 1: Usa servidor público demo.project-osrm.org (limite: 1 req/s)
 * FASE 2: Self-hosted em produção
 * 
 * @module integrations/maps/providers
 */
import { logger } from '@/shared/utils/logger';
import type {
  RoutingProvider,
  RouteRequest,
  RouteResponse,
  ETARequest,
  ETAResponse,
  DistanceMatrixRequest,
  DistanceMatrixResponse,
  DistanceMatrixElement,
  Route,
  RouteLeg,
  RouteStep,
  TransportProfile,
} from '@/core/routing/types';
import type { Coordinates } from '@/core/maps/types';

// ============================================
// CONFIGURAÇÃO
// ============================================

interface OSRMConfig {
  /** URL base do servidor OSRM */
  baseUrl: string;
  /** Timeout em ms */
  timeout?: number;
  /** Retry automático */
  retries?: number;
}

interface OSRMStep {
  distance: number;
  duration: number;
  name?: string | null;
  maneuver?: {
    type?: string | null;
  } | null;
  geometry: {
    coordinates: [number, number][];
  };
}

interface OSRMLeg {
  distance: number;
  duration: number;
  steps: OSRMStep[];
}

interface OSRMRouteData {
  distance: number;
  duration: number;
  confidence?: number | null;
  weight?: number | null;
  geometry: {
    coordinates: [number, number][];
  };
  legs: OSRMLeg[];
}

interface OSRMRouteResponse {
  code: string;
  message?: string;
  routes: OSRMRouteData[];
}

interface OSRMTableResponse {
  code: string;
  durations: Array<Array<number | null>>;
  distances?: Array<Array<number | null>>;
}

const DEFAULT_CONFIG: OSRMConfig = {
  // FASE 1: Servidor público (desenvolvimento)
  baseUrl: 'https://router.project-osrm.org',
  // FASE 2: Self-hosted (produção)
  // baseUrl: process.env.OSRM_URL || 'https://osrm.seudominio.com',
  timeout: 5000,
  retries: 2,
};

// ============================================
// MAPEAMENTO DE PERFIS
// ============================================

/**
 * Mapeia perfis internos para perfis OSRM
 */
const PROFILE_MAP: Record<TransportProfile, string> = {
  car: 'car',
  motorcycle: 'car', // OSRM não tem perfil específico para moto
  foot: 'foot',
  bicycle: 'bicycle',
};

// ============================================
// OSRM PROVIDER
// ============================================

export class OSRMProvider implements RoutingProvider {
  private config: OSRMConfig;

  constructor(config?: Partial<OSRMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calcular rota entre pontos
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const startTime = Date.now();

    try {
      const profile = PROFILE_MAP[request.options.profile];
      const coordinates = this.buildCoordinatesString([
        request.origin,
        ...(request.waypoints || []),
        request.destination,
      ]);

      // Parâmetros OSRM
      const params = new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'true',
        annotations: 'true',
        alternatives: request.options.alternatives ? 'true' : 'false',
      });

      const url = `${this.config.baseUrl}/route/v1/${profile}/${coordinates}?${params}`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OSRMRouteResponse;

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code} - ${data.message || 'Unknown error'}`);
      }

      // Converter resposta OSRM para formato interno
      const routes = data.routes.map((osrmRoute, index) =>
        this.convertOSRMRoute(osrmRoute, index, request)
      );

      const processingTime = Date.now() - startTime;

      logger.info('[OSRMProvider] Rota calculada', {
        distance: routes[0].distanceMeters,
        duration: routes[0].durationSeconds,
        processingTime,
      });

      return {
        routes,
        primaryRoute: routes[0],
        processingTimeMs: processingTime,
      };
    } catch (error) {
      logger.error('[OSRMProvider] Erro ao calcular rota', error as Error);
      throw new Error(`Falha ao calcular rota: ${(error as Error).message}`);
    }
  }

  /**
   * Calcular ETA (Estimated Time of Arrival)
   */
  async calculateETA(request: ETARequest): Promise<ETAResponse> {
    try {
      const profile = PROFILE_MAP[request.profile];
      const coordinates = this.buildCoordinatesString([
        request.origin,
        request.destination,
      ]);

      // Usar endpoint /route com overview=false para performance
      const params = new URLSearchParams({
        overview: 'false',
        geometries: 'geojson',
        steps: 'false',
      });

      const url = `${this.config.baseUrl}/route/v1/${profile}/${coordinates}?${params}`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OSRMRouteResponse;

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code}`);
      }

      const route = data.routes[0];

      return {
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        // OSRM não fornece duração com tráfego nativamente
        durationInTrafficSeconds: undefined,
      };
    } catch (error) {
      logger.error('[OSRMProvider] Erro ao calcular ETA', error as Error);
      throw new Error(`Falha ao calcular ETA: ${(error as Error).message}`);
    }
  }

  /**
   * Calcular matriz de distâncias
   */
  async calculateDistanceMatrix(
    request: DistanceMatrixRequest
  ): Promise<DistanceMatrixResponse> {
    try {
      const profile = PROFILE_MAP[request.profile];
      
      // OSRM Table API
      const sources = request.origins.map((_, i) => i).join(';');
      const destinations = request.destinations
        .map((_, i) => i + request.origins.length)
        .join(';');
      
      const allCoords = [...request.origins, ...request.destinations];
      const coordinates = this.buildCoordinatesString(allCoords);

      const params = new URLSearchParams({
        sources,
        destinations,
      });

      const url = `${this.config.baseUrl}/table/v1/${profile}/${coordinates}?${params}`;

      const response = await this.fetchWithTimeout(url);
      const data = (await response.json()) as OSRMTableResponse;

      if (data.code !== 'Ok') {
        throw new Error(`OSRM error: ${data.code}`);
      }

      // Converter matriz OSRM para formato interno
      const matrix = data.durations.map((row, i) =>
        row.map((duration, j) => {
          const status: DistanceMatrixElement["status"] = duration === null ? 'not_found' : 'ok';
          return {
          distanceMeters: Math.round(data.distances?.at(i)?.at(j) ?? 0),
          durationSeconds: Math.round(duration ?? 0),
          status,
        };
        })
      );

      return {
        matrix,
        origins: request.origins,
        destinations: request.destinations,
      };
    } catch (error) {
      logger.error('[OSRMProvider] Erro ao calcular matriz', error as Error);
      throw new Error(`Falha ao calcular matriz: ${(error as Error).message}`);
    }
  }

  /**
   * Validar se provider está disponível
   */
  async validate(): Promise<boolean> {
    try {
      // Testar com rota simples
      const testCoords = '-38.5,-12.9;-38.4,-12.8';
      const url = `${this.config.baseUrl}/route/v1/car/${testCoords}?overview=false`;
      
      const response = await this.fetchWithTimeout(url, 3000);
      const data = (await response.json()) as OSRMRouteResponse;
      
      return data.code === 'Ok';
    } catch {
      return false;
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Converter rota OSRM para formato interno
   */
  private convertOSRMRoute(
    osrmRoute: OSRMRouteData,
    index: number,
    request: RouteRequest
  ): Route {
    // Extrair geometria
    const geometry: Coordinates[] = osrmRoute.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    // Converter legs
    const legs: RouteLeg[] = osrmRoute.legs.map((osrmLeg, legIndex) => {
      const legCoords: Coordinates[] = [];
      let coordIndex = 0;

      // Extrair coordenadas da leg
      osrmLeg.steps.forEach((step) => {
        const stepCoords = geometry.slice(coordIndex, coordIndex + step.geometry.coordinates.length);
        legCoords.push(...stepCoords);
        coordIndex += step.geometry.coordinates.length - 1;
      });

      // Converter steps
      const steps: RouteStep[] = osrmLeg.steps.map((osrmStep) => ({
        distanceMeters: Math.round(osrmStep.distance),
        durationSeconds: Math.round(osrmStep.duration),
        instruction: osrmStep.name || 'Continue',
        maneuver: osrmStep.maneuver?.type,
        coordinates: osrmStep.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        })),
      }));

      return {
        distanceMeters: Math.round(osrmLeg.distance),
        durationSeconds: Math.round(osrmLeg.duration),
        coordinates: legCoords,
        steps,
        origin:
          legIndex === 0
            ? request.origin
            : request.waypoints?.at(legIndex - 1) ?? request.origin,
        destination:
          legIndex === osrmRoute.legs.length - 1
            ? request.destination
            : request.waypoints?.at(legIndex) ?? request.destination,
      };
    });

    // Calcular bounds
    const lats = geometry.map((c) => c.latitude);
    const lngs = geometry.map((c) => c.longitude);
    const bounds: [number, number, number, number] = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];

    return {
      id: `osrm-route-${index}-${Date.now()}`,
      distanceMeters: Math.round(osrmRoute.distance),
      durationSeconds: Math.round(osrmRoute.duration),
      geometry,
      legs,
      bounds,
      summary: `${(osrmRoute.distance / 1000).toFixed(1)} km via ${legs[0].steps?.[0]?.instruction || 'rota'}`,
      metadata: {
        provider: 'osrm',
        confidence: osrmRoute.confidence,
        weight: osrmRoute.weight,
      },
    };
  }

  /**
   * Construir string de coordenadas para OSRM
   * Formato: "lng1,lat1;lng2,lat2;..."
   */
  private buildCoordinatesString(coords: Coordinates[]): string {
    return coords.map((c) => `${c.longitude},${c.latitude}`).join(';');
  }

  /**
   * Fetch com timeout
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number = this.config.timeout!
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VizinhancaApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Instância singleton com configuração padrão
 */
export const osrmProvider = new OSRMProvider();

/**
 * Factory para criar instância com configuração customizada
 */
export function createOSRMProvider(config: Partial<OSRMConfig>): OSRMProvider {
  return new OSRMProvider(config);
}
