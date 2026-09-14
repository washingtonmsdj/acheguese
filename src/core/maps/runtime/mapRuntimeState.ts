export interface MapRuntimeState {
  loaded?: boolean;
  tilesLoaded?: boolean;
  idle?: boolean;
  zoom?: number;
  lastCenter?: { lat: number; lng: number };
  territoryPolygonCount?: number;
  territoryCoordinateCount?: number;
  territoryBounds?: { west: number; south: number; east: number; north: number };
  errors?: string[];
  webglContextLost?: boolean;
}

type WindowWithMapState = Window & { __mapState?: MapRuntimeState };

export function readMapState(): MapRuntimeState {
  if (typeof window === "undefined") return {};
  const typedWindow = window as WindowWithMapState;
  return typedWindow.__mapState ?? {};
}

export function writeMapState(state: MapRuntimeState): void {
  if (typeof window === "undefined") return;
  const typedWindow = window as WindowWithMapState;
  typedWindow.__mapState = state;
}
