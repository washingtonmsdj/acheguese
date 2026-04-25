/**
 * MockRoutingProvider - Provider mock de roteamento
 * 
 * Implementação mock de RoutingProvider para desenvolvimento.
 * Será substituído por provider real (OSRM, Valhalla, etc) no futuro.
 * 
 * @module integrations/maps/providers
 */

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
  TransportProfile,
} from '@/core/routing/types';
import type { Coordinates } from '@/core/maps/types';

/**
 * Provider mock de roteamento
 * 
 * NOTA: Este é um mock temporário. Implementação real virá com:
 * - OSRM (Open Source Routing Machine)
 * - Valhalla
 * - GraphHopper
 * - Ou outro provider de routing
 */
export class MockRoutingProvider implements RoutingProvider {
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, waypoints = [] } = request;

    // Calcular distância em linha reta (Haversine)
    const distance = this.calculateDistance(origin, destination);
    
    // Estimar duração baseada no perfil
    const speed = this.getSpeedForProfile(request.options.profile);
    const duration = (distance / speed) * 3600; // segundos

    // Criar geometria simplificada (linha reta)
    const coordinates = [origin];
    if (waypoints.length > 0) {
      coordinates.push(...waypoints);
    }
    coordinates.push(destination);

    // Criar leg única
    const leg: RouteLeg = {
      distanceMeters: distance,
      durationSeconds: duration,
      coordinates,
      origin,
      destination,
    };

    // Criar rota
    const route: Route = {
      id: `mock-route-${Date.now()}`,
      distanceMeters: distance,
      durationSeconds: duration,
      geometry: coordinates,
      legs: [leg],
      bounds: this.calculateBounds(coordinates),
      summary: `${(distance / 1000).toFixed(1)} km via rota direta`,
      metadata: {
        provider: 'mock',
        warning: 'Esta é uma rota mock. Implementação real em desenvolvimento.',
      },
    };

    return {
      routes: [route],
      primaryRoute: route,
      processingTimeMs: 10,
    };
  }

  async calculateETA(request: ETARequest): Promise<ETAResponse> {
    const { origin, destination, profile } = request;

    const distance = this.calculateDistance(origin, destination);
    const speed = this.getSpeedForProfile(profile);
    const duration = (distance / speed) * 3600;

    return {
      distanceMeters: distance,
      durationSeconds: duration,
      durationInTrafficSeconds: duration * 1.2, // Mock: +20% com tráfego
    };
  }

  async calculateDistanceMatrix(
    request: DistanceMatrixRequest
  ): Promise<DistanceMatrixResponse> {
    const { origins, destinations, profile } = request;
    
    const matrix: DistanceMatrixElement[][] = [];
    
    for (let i = 0; i < origins.length; i++) {
      const row: DistanceMatrixElement[] = [];
      
      for (let j = 0; j < destinations.length; j++) {
        const origin = origins.at(i);
        const destination = destinations.at(j);
        if (!origin || !destination) continue;
        const distance = this.calculateDistance(origin, destination);
        const speed = this.getSpeedForProfile(profile);
        const duration = (distance / speed) * 3600;
        
        row.push({
          distanceMeters: distance,
          durationSeconds: duration,
          status: 'ok',
        });
      }
      
      matrix.push(row);
    }
    
    return {
      matrix,
      origins,
      destinations,
    };
  }

  async validate(): Promise<boolean> {
    // Mock sempre válido
    return true;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const lat1 = (coord1.latitude * Math.PI) / 180;
    const lat2 = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getSpeedForProfile(profile: TransportProfile): number {
    switch (profile) {
      case 'car':
        return 13.9; // ~50 km/h
      case 'motorcycle':
        return 16.7; // ~60 km/h
      case 'foot':
        return 1.4; // ~5 km/h
      case 'bicycle':
        return 4.2; // ~15 km/h
      default:
        return 13.9;
    }
  }

  private calculateBounds(
    coordinates: { latitude: number; longitude: number }[]
  ): [number, number, number, number] {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    return [minLng, minLat, maxLng, maxLat];
  }
}

/**
 * Instância singleton
 */
export const mockRoutingProvider = new MockRoutingProvider();
