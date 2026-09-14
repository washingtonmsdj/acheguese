import { EntityStatus } from "@/shared/types/enums";
import { MAP_DEFAULT_CENTER_LNGLAT, MAP_DEFAULT_ZOOM } from "../../config/defaultCoordinates";
import type { MapMarker } from "../../types/core";

export { readMapState, writeMapState } from "../../runtime/mapRuntimeState";

export interface CircleArea {
  center: [number, number];
  radiusMeters: number;
}

export const DEFAULT_CENTER: [number, number] = MAP_DEFAULT_CENTER_LNGLAT;
export { MAP_DEFAULT_ZOOM as DEFAULT_ZOOM };

interface ClusterRenderMarker {
  id: string;
  type: "cluster";
  coordinates: { latitude: number; longitude: number };
  title: string;
  status: typeof EntityStatus.ACTIVE;
  metadata: {
    isCluster: true;
    pointCount: number;
    clusterId: number;
  };
}

export type RenderMarker = MapMarker | ClusterRenderMarker;

export const MARKER_TYPE_TO_LAYER: Partial<Record<string, string>> = {
  business: "businesses",
  service: "services",
  classified: "classifieds",
  event: "events",
  alert: "alerts",
  professional: "professionals",
  tourist_point: "tourist_points",
  driver: "mobility",
  ride: "mobility",
};

export function getRecordBoolean(
  source: Record<string, boolean>,
  key: string,
): boolean | undefined {
  for (const [entryKey, value] of Object.entries(source)) {
    if (entryKey === key) {
      return value;
    }
  }
  return undefined;
}

export function setRecordBoolean(
  source: Record<string, boolean>,
  key: string,
  value: boolean,
): Record<string, boolean> {
  let found = false;
  const entries = Object.entries(source).map(([entryKey, entryValue]) => {
    if (entryKey === key) {
      found = true;
      return [entryKey, value] as const;
    }
    return [entryKey, entryValue] as const;
  });

  if (!found) {
    entries.push([key, value] as const);
  }
  return Object.fromEntries(entries);
}

export function createUserLocationMarker(
  coordinates: { latitude: number; longitude: number },
  label?: string,
): MapMarker {
  // This helper builds synthetic runtime markers, not projected domain entities.
  // eslint-disable-next-line maps/no-manual-entity-projection
  return {
    id: "user-location",
    type: "user_location" as const,
    coordinates: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    title: label ?? "Voce esta aqui",
    status: EntityStatus.ACTIVE,
    metadata: { isUserLocation: true },
  };
}

export function createClusterRenderMarker(
  clusterId: number,
  pointCount: number,
  coordinates: [number, number],
): RenderMarker {
  const [longitude, latitude] = coordinates;
  // Clusters are synthetic map UI markers and do not originate from entity projection.
  const marker = {
    id: `cluster-${clusterId}`,
    type: "cluster" as const,
    title: `${pointCount} itens`,
    status: EntityStatus.ACTIVE,
    metadata: {
      isCluster: true,
      pointCount,
      clusterId,
    },
  } as RenderMarker;

  marker.coordinates = { latitude, longitude };
  return marker;
}
