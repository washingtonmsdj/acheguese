/**
 * Core Tourist Points Module - SSOT
 * 
 * Único ponto de acesso para pontos turísticos.
 * Escalável para qualquer cidade do Brasil.
 */

export * from './types';
export { TouristPointService } from './services/TouristPointService';
export { TouristPointQueryService } from './services/TouristPointQueryService';
export { useTouristPoints, useTouristPoint, useTouristPointBySlug, useNearbyTouristPoints } from './hooks/useTouristPoints';
export { TouristPointsMap } from './components/TouristPointsMap';
