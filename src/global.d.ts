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
}

interface Window {
  __mapState?: MapE2EState;
}
