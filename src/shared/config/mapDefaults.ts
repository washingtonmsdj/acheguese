type PublicEnv = Partial<Record<string, string>>;

export type SharedBoundingBox = [number, number, number, number];

export interface SharedCoordinates {
  latitude: number;
  longitude: number;
}

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const latitude = parseNumber(publicEnv.VITE_DEFAULT_MAP_LATITUDE, -14.235);
const longitude = parseNumber(publicEnv.VITE_DEFAULT_MAP_LONGITUDE, -51.9253);
const boundsDelta = parseNumber(publicEnv.VITE_DEFAULT_MAP_BOUNDS_DELTA, 0.15);
const launchCityName = publicEnv.VITE_LAUNCH_CITY_NAME?.trim() || "Território inicial";
const launchState = (publicEnv.VITE_LAUNCH_STATE?.trim() || "").toUpperCase();

/**
 * Canonical OpenFreeMap vector TileJSON endpoint used by the hosted styles.
 * Keeping this beside the style URLs lets performance preloads reuse the same
 * map-provider SSOT instead of hardcoding provider internals in bootstrap code.
 */
export const OPENFREEMAP_TILEJSON_URL = "https://tiles.openfreemap.org/planet";

export const MAP_TILE_STYLES = {
  streets: {
    name: "openfreemap",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
  light: {
    name: "openfreemap-light",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
  dark: {
    name: "carto-dark-matter",
    styleUrl: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: "openfreemap",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
  hybrid: {
    name: "openfreemap",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
  terrain: {
    name: "openfreemap",
    styleUrl: "https://tiles.openfreemap.org/styles/positron",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  },
} as const;

export const DEFAULT_TILE_STYLE = MAP_TILE_STYLES.streets;

/**
 * Canonical visuals for the reusable MapLibre MiniMap renderer.
 * MapLibre paint values and DOM marker styles require concrete CSS color strings,
 * so this config owns them instead of scattering literals through React surfaces.
 */
export const MINI_MAP_VISUALS = {
  marker: {
    defaultColor: "#10b981",
    outlineColor: "#ffffff",
  },
  route: {
    defaultColor: "#0f766e",
    startColor: "#fbbf24",
    endColor: "#064e3b",
    casingColor: "#ffffff",
    endpointBorder: "3px solid #ffffff",
    endpointShadow: "0 2px 8px rgba(15, 23, 42, 0.25)",
  },
} as const;

/**
 * Read limits shared by the map-backed listing services. Keeping these in
 * the map configuration prevents each layer from silently inventing a new
 * operational ceiling.
 */
export const MAP_QUERY_LIMITS = {
  classifieds: { defaultLimit: 100, maxLimit: 200 },
  business: { defaultLimit: 100, maxLimit: 200 },
  gastronomy: { defaultLimit: 100, maxLimit: 200 },
  services: { defaultLimit: 100, maxLimit: 200 },
} as const;

export const MAP_DEFAULT_COORDINATES: SharedCoordinates = {
  latitude,
  longitude,
};

export const MAP_DEFAULT_CENTER_LNGLAT: [number, number] = [longitude, latitude];

export const MAP_DEFAULT_BOUNDS: SharedBoundingBox = [
  longitude - boundsDelta,
  latitude - boundsDelta,
  longitude + boundsDelta,
  latitude + boundsDelta,
];

export const MAP_DEFAULT_ZOOM = parseNumber(publicEnv.VITE_DEFAULT_MAP_ZOOM, 13);

export const MAP_DEFAULT_LOCATION = {
  city: publicEnv.VITE_DEFAULT_MAP_CITY ?? launchCityName,
  region: publicEnv.VITE_DEFAULT_MAP_REGION ?? launchState,
  country: publicEnv.VITE_DEFAULT_MAP_COUNTRY ?? "Brasil",
} as const;
