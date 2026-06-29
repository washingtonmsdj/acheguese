/**
 * NeighborhoodBoundaryService
 *
 * Manage custom neighborhood polygons as a fallback when OSM data is missing.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type GeoJsonPosition = [number, number] | [number, number, number];
type PolygonCoordinates = GeoJsonPosition[][];
type MultiPolygonCoordinates = GeoJsonPosition[][][];

type BoundaryGeometry =
  | {
      type: "Polygon";
      coordinates: PolygonCoordinates;
    }
  | {
      type: "MultiPolygon";
      coordinates: MultiPolygonCoordinates;
    };

interface NeighborhoodBoundary {
  id: string;
  location_id: string;
  geometry: BoundaryGeometry;
  source: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface NeighborhoodBoundaryUpsertInput {
  location_id: string;
  geometry: BoundaryGeometry;
  source: string;
  notes?: string;
}

function isGeoJsonPosition(value: unknown): value is GeoJsonPosition {
  return (
    Array.isArray(value) &&
    (value.length === 2 || value.length === 3) &&
    value.every((coordinate) => typeof coordinate === "number")
  );
}

function isPolygonCoordinates(value: unknown): value is PolygonCoordinates {
  return Array.isArray(value) && value.every((ring) => Array.isArray(ring) && ring.every(isGeoJsonPosition));
}

function isMultiPolygonCoordinates(value: unknown): value is MultiPolygonCoordinates {
  return (
    Array.isArray(value) &&
    value.every((polygon) => Array.isArray(polygon) && polygon.every((ring) => Array.isArray(ring) && ring.every(isGeoJsonPosition)))
  );
}

function isBoundaryGeometry(value: unknown): value is BoundaryGeometry {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "Polygon") {
    return isPolygonCoordinates(candidate.coordinates);
  }

  if (candidate.type === "MultiPolygon") {
    return isMultiPolygonCoordinates(candidate.coordinates);
  }

  return false;
}

function normalizeBoundary(
  row: Omit<NeighborhoodBoundary, "geometry"> & { geometry: unknown },
): NeighborhoodBoundary | null {
  if (!isBoundaryGeometry(row.geometry)) {
    return null;
  }

  return {
    ...row,
    geometry: row.geometry,
  };
}

export class NeighborhoodBoundaryService {
  static async getByLocationId(locationId: string): Promise<NeighborhoodBoundary | null> {
    try {
      const { data, error } = await supabase
        .from("neighborhood_boundaries")
        .select("*")
        .eq("location_id", locationId)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST116" || error.code === "406" || error.message?.includes("406")) {
          return null;
        }
        return null;
      }

      return data ? normalizeBoundary(data) : null;
    } catch {
      return null;
    }
  }

  static async getByLocationIds(locationIds: string[]): Promise<Map<string, NeighborhoodBoundary>> {
    try {
      const { data, error } = await supabase
        .from("neighborhood_boundaries")
        .select("*")
        .in("location_id", locationIds);

      if (error) throw error;

      const boundaryMap = new Map<string, NeighborhoodBoundary>();
      data?.forEach((boundary) => {
        const normalized = normalizeBoundary(boundary);
        if (normalized) {
          boundaryMap.set(normalized.location_id, normalized);
        }
      });

      return boundaryMap;
    } catch (error) {
      logger.error("[NeighborhoodBoundaryService] Error fetching boundaries:", error);
      return new Map();
    }
  }

  static async upsert(data: NeighborhoodBoundaryUpsertInput): Promise<NeighborhoodBoundary | null> {
    try {
      const { data: result, error } = await supabase
        .from("neighborhood_boundaries")
        .upsert(data, {
          onConflict: "location_id",
        })
        .select()
        .single();

      if (error) throw error;
      return result ? normalizeBoundary(result) : null;
    } catch (error) {
      logger.error("[NeighborhoodBoundaryService] Error upserting boundary:", error);
      return null;
    }
  }

  static async delete(locationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("neighborhood_boundaries")
        .delete()
        .eq("location_id", locationId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("[NeighborhoodBoundaryService] Error deleting boundary:", error);
      return false;
    }
  }

  static async listAll(): Promise<NeighborhoodBoundary[]> {
    try {
      const { data, error } = await supabase
        .from("neighborhood_boundaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? [])
        .map((boundary) => normalizeBoundary(boundary))
        .filter((boundary): boundary is NeighborhoodBoundary => boundary !== null);
    } catch (error) {
      logger.error("[NeighborhoodBoundaryService] Error listing boundaries:", error);
      return [];
    }
  }
}
