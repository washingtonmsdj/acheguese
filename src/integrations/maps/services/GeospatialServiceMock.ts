/**
 * Geospatial Service Mock - In-Memory Implementation
 * 
 * Mock implementation of IGeospatialPort for testing without real maps API.
 */

import type { IGeospatialPort, GeospatialError, GeospatialErrorCode } from '@/core/coverage/index';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';

export class GeospatialServiceMock implements IGeospatialPort {
  constructor(private locationRepository: ILocationRepository) {}

  async isWithinRadius(
    origin_location_id: string,
    target_location_id: string,
    radius_km: number
  ): Promise<boolean> {
    if (radius_km < 1 || radius_km > 100) {
      throw this.createError('INVALID_RADIUS', `Radius must be between 1 and 100 km`);
    }

    const distance = await this.calculateDistance(origin_location_id, target_location_id);
    return distance <= radius_km;
  }

  async calculateDistance(location_id_a: string, location_id_b: string): Promise<number> {
    const locationA = await this.locationRepository.findById(location_id_a);
    const locationB = await this.locationRepository.findById(location_id_b);

    if (!locationA) {
      throw this.createError('LOCATION_NOT_FOUND', `Location ${location_id_a} not found`);
    }

    if (!locationB) {
      throw this.createError('LOCATION_NOT_FOUND', `Location ${location_id_b} not found`);
    }

    // Verificar se coordenadas existem
    if (!locationA.metadata?.canonical_lat || !locationA.metadata?.canonical_lng) {
      throw this.createError('COORDINATES_NOT_FOUND', `Coordinates not found for location ${location_id_a}`);
    }

    if (!locationB.metadata?.canonical_lat || !locationB.metadata?.canonical_lng) {
      throw this.createError('COORDINATES_NOT_FOUND', `Coordinates not found for location ${location_id_b}`);
    }

    // Calcular distância usando fórmula de Haversine
    return this.haversineDistance(
      Number(locationA.metadata.canonical_lat),
      Number(locationA.metadata.canonical_lng),
      Number(locationB.metadata.canonical_lat),
      Number(locationB.metadata.canonical_lng)
    );
  }

  /**
   * Fórmula de Haversine para calcular distância entre dois pontos
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private createError(code: GeospatialErrorCode, message: string): GeospatialError {
    return { code, message };
  }
}
