/**
 * Routing Types - Tipos para roteamento e navegação
 * 
 * Preparado para mobilidade futura (corridas, rotas, ETA)
 * mas sem acoplamento prematuro.
 * 
 * @module core/maps/types/routing
 */

import type { Coordinates, BoundingBox } from './core';

// ============================================
// ROUTE REQUEST
// ============================================

/**
 * Perfil de roteamento
 */
export type RoutingProfile = 'driving' | 'walking' | 'cycling' | 'transit';

/**
 * Opções de roteamento
 */
export interface RoutingOptions {
  profile: RoutingProfile;
  /** Evitar pedágios */
  avoidTolls?: boolean;
  /** Evitar rodovias */
  avoidHighways?: boolean;
  /** Evitar balsas */
  avoidFerries?: boolean;
  /** Incluir rotas alternativas */
  alternatives?: boolean;
  /** Número máximo de alternativas */
  maxAlternatives?: number;
}

/**
 * Requisição de rota
 */
export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  options: RoutingOptions;
}

// ============================================
// ROUTE RESPONSE
// ============================================

/**
 * Perna de uma rota (entre dois waypoints)
 */
export interface RouteLeg {
  /** Distância em metros */
  distanceMeters: number;
  /** Duração em segundos */
  durationSeconds: number;
  /** Coordenadas da perna */
  coordinates: Coordinates[];
  /** Instruções de navegação */
  steps?: RouteStep[];
  /** Origem da perna */
  origin: Coordinates;
  /** Destino da perna */
  destination: Coordinates;
}

/**
 * Passo de navegação
 */
export interface RouteStep {
  /** Distância em metros */
  distanceMeters: number;
  /** Duração em segundos */
  durationSeconds: number;
  /** Instrução textual */
  instruction: string;
  /** Tipo de manobra */
  maneuver?: string;
  /** Coordenadas do passo */
  coordinates: Coordinates[];
}

/**
 * Rota completa
 */
export interface Route {
  id: string;
  /** Distância total em metros */
  distanceMeters: number;
  /** Duração total em segundos */
  durationSeconds: number;
  /** Geometria completa da rota */
  geometry: Coordinates[];
  /** Pernas da rota */
  legs: RouteLeg[];
  /** Bounding box da rota */
  bounds: BoundingBox;
  /** Resumo textual */
  summary?: string;
  /** Dados adicionais do provider */
  metadata?: Record<string, unknown>;
}

/**
 * Resposta de roteamento
 */
export interface RouteResponse {
  routes: Route[];
  /** Rota principal (primeira) */
  primaryRoute: Route;
  /** Tempo de processamento */
  processingTimeMs?: number;
}

// ============================================
// ETA (Estimated Time of Arrival)
// ============================================

/**
 * Requisição de ETA
 */
export interface ETARequest {
  origin: Coordinates;
  destination: Coordinates;
  profile: RoutingProfile;
  /** Horário de partida (ISO 8601) */
  departureTime?: string;
}

/**
 * Resposta de ETA
 */
export interface ETAResponse {
  /** Distância em metros */
  distanceMeters: number;
  /** Duração em segundos */
  durationSeconds: number;
  /** Duração com tráfego em segundos */
  durationInTrafficSeconds?: number;
  /** Horário estimado de chegada (ISO 8601) */
  arrivalTime?: string;
}

// ============================================
// DISTANCE MATRIX
// ============================================

/**
 * Requisição de matriz de distâncias
 */
export interface DistanceMatrixRequest {
  origins: Coordinates[];
  destinations: Coordinates[];
  profile: RoutingProfile;
}

/**
 * Elemento da matriz de distâncias
 */
export interface DistanceMatrixElement {
  /** Distância em metros */
  distanceMeters: number;
  /** Duração em segundos */
  durationSeconds: number;
  /** Status do cálculo */
  status: 'ok' | 'not_found' | 'zero_results';
}

/**
 * Resposta de matriz de distâncias
 */
export interface DistanceMatrixResponse {
  /** Matriz [origem][destino] */
  matrix: DistanceMatrixElement[][];
  origins: Coordinates[];
  destinations: Coordinates[];
}

// ============================================
// ISOCHRONE (Área de alcance)
// ============================================

/**
 * Requisição de isócrona
 */
export interface IsochroneRequest {
  center: Coordinates;
  profile: RoutingProfile;
  /** Intervalos em segundos */
  intervals: number[];
}

/**
 * Polígono de isócrona
 */
export interface IsochronePolygon {
  /** Intervalo em segundos */
  intervalSeconds: number;
  /** Coordenadas do polígono */
  coordinates: Coordinates[];
  /** Área em metros quadrados */
  areaSquareMeters?: number;
}

/**
 * Resposta de isócrona
 */
export interface IsochroneResponse {
  polygons: IsochronePolygon[];
  center: Coordinates;
  profile: RoutingProfile;
}

// ============================================
// MAP MATCHING (Snap to roads)
// ============================================

/**
 * Requisição de map matching
 */
export interface MapMatchingRequest {
  /** Coordenadas GPS brutas */
  coordinates: Coordinates[];
  /** Timestamps das coordenadas (ISO 8601) */
  timestamps?: string[];
  profile: RoutingProfile;
  /** Raio de busca em metros */
  radiusMeters?: number;
}

/**
 * Ponto matched
 */
export interface MatchedPoint {
  /** Coordenada original */
  original: Coordinates;
  /** Coordenada ajustada (snapped) */
  matched: Coordinates;
  /** Distância do ajuste em metros */
  distanceMeters: number;
  /** Confiança do matching (0-1) */
  confidence: number;
}

/**
 * Resposta de map matching
 */
export interface MapMatchingResponse {
  /** Geometria matched */
  geometry: Coordinates[];
  /** Pontos individuais matched */
  matchedPoints: MatchedPoint[];
  /** Confiança geral (0-1) */
  confidence: number;
  /** Distância total em metros */
  distanceMeters: number;
  /** Duração total em segundos */
  durationSeconds: number;
}

// ============================================
// TRIP REPLAY (Replay de trajeto)
// ============================================

/**
 * Ponto de trajeto com timestamp
 */
export interface TripPoint {
  coordinates: Coordinates;
  timestamp: string; // ISO 8601
  speed?: number; // m/s
  bearing?: number; // graus
  accuracy?: number; // metros
}

/**
 * Trajeto completo
 */
export interface Trip {
  id: string;
  points: TripPoint[];
  /** Geometria matched (opcional) */
  matchedGeometry?: Coordinates[];
  /** Distância total em metros */
  distanceMeters: number;
  /** Duração total em segundos */
  durationSeconds: number;
  /** Horário de início */
  startTime: string;
  /** Horário de término */
  endTime: string;
  bounds: BoundingBox;
}

// ============================================
// COVERAGE AREA (Área de cobertura)
// ============================================

/**
 * Tipo de área de cobertura
 */
export type CoverageAreaType = 'circle' | 'polygon' | 'territory';

/**
 * Área de cobertura circular
 */
export interface CircleCoverageArea {
  type: 'circle';
  center: Coordinates;
  radiusMeters: number;
}

/**
 * Área de cobertura poligonal
 */
export interface PolygonCoverageArea {
  type: 'polygon';
  coordinates: Coordinates[];
}

/**
 * Área de cobertura por territórios
 */
export interface TerritoryCoverageArea {
  type: 'territory';
  locationIds: string[];
}

/**
 * União de tipos de área de cobertura
 */
export type CoverageArea = CircleCoverageArea | PolygonCoverageArea | TerritoryCoverageArea;

// ============================================
// HELPERS
// ============================================

/**
 * Formata duração em segundos para texto legível
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

/**
 * Formata distância em metros para texto legível
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}
