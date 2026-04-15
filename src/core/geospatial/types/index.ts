/**
 * Geospatial Types - Tipos para operações geoespaciais
 */

// ============================================
// RESOLUTION
// ============================================

export type ResolutionMethod = 
  | 'boundary_containment'   // Ponto dentro de boundary
  | 'proximity_fallback';    // Território mais próximo

export interface PointResolutionResult {
  location_id: string;
  location_name: string;
  location_slug: string;
  location_type: string;
  resolution_method: ResolutionMethod;
  confidence: number;
  distance_meters?: number;
}

export interface ResolvePointInput {
  latitude: number;
  longitude: number;
  location_type?: 'district' | 'city' | 'state' | 'country';
}

// ============================================
// BOUNDARY
// ============================================

export interface BoundaryGeoJSON {
  type: 'Polygon';
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

export interface SetLocationBoundaryInput {
  location_id: string;
  boundary: BoundaryGeoJSON;
}

// ============================================
// POINT
// ============================================

export interface PointGeoJSON {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
