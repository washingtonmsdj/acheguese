/**
 * GeospatialRepositoryMock
 * 
 * Implementação in-memory para desenvolvimento sem PostGIS.
 * Usa cálculo simples de distância para simular containment e proximidade.
 */

import type { IGeospatialRepository } from './IGeospatialRepository';
import type { PointResolutionResult, ResolvePointInput, BoundaryGeoJSON } from '../types';
import { LocationRepositoryMock } from '@/core/location/repositories/LocationRepositoryMock';

export class GeospatialRepositoryMock implements IGeospatialRepository {
  private boundaries: Map<string, BoundaryGeoJSON> = new Map();
  private locationRepo = new LocationRepositoryMock();

  constructor() {
    this.seedBoundaries();
  }

  private seedBoundaries(): void {
    // Boundary simplificado para Nordeste de Amaralina (exemplo)
    this.boundaries.set('loc-nordeste-de-amaralina', {
      type: 'Polygon',
      coordinates: [[
        [-38.4800, -12.9800],
        [-38.4700, -12.9800],
        [-38.4700, -12.9700],
        [-38.4800, -12.9700],
        [-38.4800, -12.9800],
      ]],
    });
  }

  async resolvePointToLocation(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    const { latitude, longitude, location_type = 'district' } = input;

    // Buscar locations do tipo especificado
    const locations = await this.getAllLocationsOfType(location_type);

    // Verificar containment simples (bounding box)
    for (const location of locations) {
      const boundary = this.boundaries.get(location.id);
      if (!boundary) continue;

      if (this.isPointInPolygon(latitude, longitude, boundary)) {
        return {
          location_id: location.id,
          location_name: location.name,
          location_slug: location.slug,
          location_type: location.type,
          resolution_method: 'boundary_containment',
          confidence: 1.0,
        };
      }
    }

    return null;
  }

  async resolvePointToLocationWithFallback(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    // Tentar resolução por boundary
    const byBoundary = await this.resolvePointToLocation(input);
    if (byBoundary) return byBoundary;

    // Fallback: território mais próximo por canonical_lat/lng
    const { latitude, longitude, location_type = 'district' } = input;
    const locations = await this.getAllLocationsOfType(location_type);

    let closest: PointResolutionResult | null = null;
    let minDistance = Infinity;

    for (const location of locations) {
      const canonicalLat = location.metadata.canonical_lat as number | undefined;
      const canonicalLng = location.metadata.canonical_lng as number | undefined;

      if (canonicalLat === undefined || canonicalLng === undefined) continue;

      const distance = this.calculateDistance(latitude, longitude, canonicalLat, canonicalLng);

      if (distance < minDistance) {
        minDistance = distance;
        closest = {
          location_id: location.id,
          location_name: location.name,
          location_slug: location.slug,
          location_type: location.type,
          resolution_method: 'proximity_fallback',
          confidence: 0.5,
          distance_meters: distance,
        };
      }
    }

    return closest;
  }

  async hasBoundary(locationId: string): Promise<boolean> {
    return this.boundaries.has(locationId);
  }

  async setLocationBoundary(locationId: string, boundary: BoundaryGeoJSON): Promise<void> {
    const location = await this.locationRepo.findById(locationId);
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }
    this.boundaries.set(locationId, boundary);
  }

  async getLocationBoundary(locationId: string): Promise<BoundaryGeoJSON | null> {
    return this.boundaries.get(locationId) ?? null;
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getAllLocationsOfType(type: string) {
    // Simula busca de locations por tipo
    // Em produção, isso viria do LocationRepository
    const allIds = [
      'loc-nordeste-de-amaralina',
      'loc-santa-cruz',
      'loc-barra',
      'loc-rio-vermelho',
      'loc-pituba',
    ];

    const locations = await Promise.all(
      allIds.map(id => this.locationRepo.findById(id))
    );

    return locations
      .filter((l): l is NonNullable<typeof l> => l !== null && l.type === type);
  }

  private isPointInPolygon(lat: number, lng: number, polygon: BoundaryGeoJSON): boolean {
    // Algoritmo ray-casting simplificado
    const coords = polygon.coordinates[0];
    let inside = false;

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][0], yi = coords[i][1];
      const xj = coords[j][0], yj = coords[j][1];

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Fórmula de Haversine (distância em metros)
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
