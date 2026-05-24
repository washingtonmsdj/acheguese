/**
 * Core Routing Types - SSOT para tipos de roteamento
 * 
 * Tipos transversais para roteamento, ETA, distância e navegação.
 * Usado por maps, mobility e qualquer módulo que precise de routing.
 * 
 * @module core/routing/types
 */

import type { Coordinates } from '@/core/maps/types';

// ============================================
// TRANSPORT PROFILES
// ============================================

/**
 * Perfis de transporte suportados
 */
export type TransportProfile = 
  | 'car'           // Carro
  | 'motorcycle'    // Moto
  | 'foot'          // A pé
  | 'bicycle';      // Bicicleta

/**
 * Mapeamento de perfis legados para novos
 */
export const PROFILE_MAPPING: Record<string, TransportProfile> = {
  'driving': 'car',
  'walking': 'foot',
  'cycling': 'bicycle',
  'transit': 'car', // Fallback
};

// ============================================
// ROUTE REQUEST
// ============================================

/**
 * Opções de roteamento
 */
export interface RoutingOptions {
  profile: TransportProfile;
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
  /** Bounding box da rota [west, south, east, north] */
  bounds: [number, number, number, number];
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
  profile: TransportProfile;
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
  profile: TransportProfile;
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
// PROVIDER INTERFACE
// ============================================

/**
 * Interface de provider de roteamento
 * 
 * Implementações: OSRMProvider, ValhallaProvider, GraphHopperProvider, etc.
 */
export interface RoutingProvider {
  /**
   * Calcular rota entre pontos
   */
  calculateRoute(request: RouteRequest): Promise<RouteResponse>;

  /**
   * Calcular ETA (Estimated Time of Arrival)
   */
  calculateETA(request: ETARequest): Promise<ETAResponse>;

  /**
   * Calcular matriz de distâncias (opcional)
   */
  calculateDistanceMatrix?(request: DistanceMatrixRequest): Promise<DistanceMatrixResponse>;

  /**
   * Validar se provider está disponível
   */
  validate(): Promise<boolean>;
}
