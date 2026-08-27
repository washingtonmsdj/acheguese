/**
 * Extensões de tipos globais do projeto.
 */

interface MapE2EState {
  loaded?: boolean;
  tilesLoaded?: boolean;
  idle?: boolean;
  zoom?: number;
  lastCenter?: { lat: number; lng: number };
  webglContextLost?: boolean;
  errors?: string[];
  territoryPolygonCount?: number;
  territoryCoordinateCount?: number;
  territoryBounds?: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
}

interface Window {
  __mapState?: MapE2EState;
}
