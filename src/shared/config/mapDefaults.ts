import { TERRITORY_CONFIG } from "@/core/routing/config/territory";

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
  city: publicEnv.VITE_DEFAULT_MAP_CITY ?? TERRITORY_CONFIG.launch.name,
  region: publicEnv.VITE_DEFAULT_MAP_REGION ?? TERRITORY_CONFIG.launch.state.toUpperCase(),
  country: publicEnv.VITE_DEFAULT_MAP_COUNTRY ?? "Brasil",
} as const;
