import type { Location } from "@/core/location/types";

export interface OfficialSourceBounds {
  rings: [number, number][][];
  center: [number, number];
}

interface GeoJsonGeometry {
  type: "Polygon" | "MultiPolygon" | string;
  coordinates: unknown;
}

interface GeoJsonFeature {
  geometry?: GeoJsonGeometry | null;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonFeatureCollection {
  features?: GeoJsonFeature[];
}

type OfficialSource = {
  sourceUrl: string;
  objectId: number;
};

const boundaryCache = new Map<string, OfficialSourceBounds | null>();
const pendingBatches = new Map<string, Promise<Map<string, OfficialSourceBounds>>>();

function getLocationCenter(location: Location): [number, number] | null {
  const latitude = location.metadata?.center_latitude;
  const longitude = location.metadata?.center_longitude;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return [latitude, longitude];
}

function getOfficialSource(location: Location): OfficialSource | null {
  const sourceUrl = location.metadata?.source_url;
  const rawObjectId = location.metadata?.source_object_id;
  const objectId =
    typeof rawObjectId === "number"
      ? rawObjectId
      : typeof rawObjectId === "string"
        ? Number(rawObjectId)
        : Number.NaN;

  if (
    location.metadata?.official !== true ||
    typeof sourceUrl !== "string" ||
    !sourceUrl ||
    !Number.isInteger(objectId) ||
    objectId <= 0
  ) {
    return null;
  }

  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return { sourceUrl: parsed.toString().replace(/\/+$/, ""), objectId };
  } catch {
    return null;
  }
}

function toLatLngRing(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (point): point is [number, number] =>
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number" &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
    )
    .map(([longitude, latitude]) => [latitude, longitude]);
}

function extractRings(geometry: GeoJsonGeometry | null | undefined): [number, number][][] {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  if (geometry.type === "Polygon") {
    const coordinates = geometry.coordinates as unknown[];
    return coordinates
      .map((ring) => toLatLngRing(ring))
      .filter((ring) => ring.length >= 3);
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates as unknown[];
    return polygons.flatMap((polygon) => {
      if (!Array.isArray(polygon)) return [];
      return polygon
        .map((ring) => toLatLngRing(ring))
        .filter((ring) => ring.length >= 3);
    });
  }

  return [];
}

function calculateCenter(rings: [number, number][][]): [number, number] | null {
  let latitudeTotal = 0;
  let longitudeTotal = 0;
  let count = 0;

  rings.forEach((ring) => {
    ring.forEach(([latitude, longitude]) => {
      latitudeTotal += latitude;
      longitudeTotal += longitude;
      count += 1;
    });
  });

  return count > 0
    ? [latitudeTotal / count, longitudeTotal / count]
    : null;
}

function readObjectId(feature: GeoJsonFeature): number | null {
  const properties = feature.properties;
  if (!properties) return null;

  for (const [key, value] of Object.entries(properties)) {
    if (key.toLowerCase() !== "objectid") continue;
    const objectId = typeof value === "number" ? value : Number(value);
    return Number.isInteger(objectId) ? objectId : null;
  }

  return null;
}

function cacheKey(sourceUrl: string, objectId: number): string {
  return `${sourceUrl}::${objectId}`;
}

async function fetchSourceBatch(
  sourceUrl: string,
  locations: Location[],
): Promise<Map<string, OfficialSourceBounds>> {
  const requested = locations
    .map((location) => ({ location, source: getOfficialSource(location) }))
    .filter(
      (entry): entry is { location: Location; source: OfficialSource } =>
        Boolean(entry.source && entry.source.sourceUrl === sourceUrl),
    );

  const uncached = requested.filter(
    ({ source }) => !boundaryCache.has(cacheKey(source.sourceUrl, source.objectId)),
  );

  if (uncached.length > 0 && typeof fetch === "function") {
    const objectIds = Array.from(
      new Set(uncached.map(({ source }) => source.objectId)),
    );
    const batchKey = `${sourceUrl}::${objectIds.sort((a, b) => a - b).join(",")}`;

    let pending = pendingBatches.get(batchKey);
    if (!pending) {
      pending = (async () => {
        const result = new Map<string, OfficialSourceBounds>();
        try {
          const url = new URL(`${sourceUrl}/query`);
          url.search = new URLSearchParams({
            where: `OBJECTID IN (${objectIds.join(",")})`,
            outFields: "OBJECTID",
            returnGeometry: "true",
            f: "geojson",
            outSR: "4326",
          }).toString();

          const response = await fetch(url.toString());
          if (!response.ok) return result;

          const payload = (await response.json()) as GeoJsonFeatureCollection;
          const features = payload.features ?? [];

          features.forEach((feature) => {
            const objectId = readObjectId(feature);
            if (objectId === null) return;
            const match = requested.find(
              ({ source }) => source.objectId === objectId,
            );
            if (!match) return;

            const rings = extractRings(feature.geometry);
            if (rings.length === 0) return;
            const center =
              getLocationCenter(match.location) ?? calculateCenter(rings);
            if (!center) return;

            const bounds = { rings, center };
            boundaryCache.set(cacheKey(sourceUrl, objectId), bounds);
            result.set(match.location.id, bounds);
          });

          uncached.forEach(({ source }) => {
            const key = cacheKey(sourceUrl, source.objectId);
            if (!boundaryCache.has(key)) boundaryCache.set(key, null);
          });
        } catch {
          // Network/source failures fall back to the BoundaryService chain.
        }

        return result;
      })().finally(() => {
        pendingBatches.delete(batchKey);
      });
      pendingBatches.set(batchKey, pending);
    }

    await pending;
  }

  const result = new Map<string, OfficialSourceBounds>();
  requested.forEach(({ location, source }) => {
    const cached = boundaryCache.get(cacheKey(source.sourceUrl, source.objectId));
    if (cached) result.set(location.id, cached);
  });
  return result;
}

export async function loadOfficialFeatureServerBoundaries(
  locations: Location[],
): Promise<Map<string, OfficialSourceBounds>> {
  const sources = new Map<string, Location[]>();

  locations.forEach((location) => {
    const source = getOfficialSource(location);
    if (!source) return;
    const group = sources.get(source.sourceUrl) ?? [];
    group.push(location);
    sources.set(source.sourceUrl, group);
  });

  const batches = await Promise.all(
    Array.from(sources.entries()).map(([sourceUrl, sourceLocations]) =>
      fetchSourceBatch(sourceUrl, sourceLocations),
    ),
  );

  const result = new Map<string, OfficialSourceBounds>();
  batches.forEach((batch) => {
    batch.forEach((bounds, locationId) => result.set(locationId, bounds));
  });
  return result;
}

export async function loadOfficialFeatureServerBoundary(
  location: Location,
): Promise<OfficialSourceBounds | null> {
  const result = await loadOfficialFeatureServerBoundaries([location]);
  return result.get(location.id) ?? null;
}
