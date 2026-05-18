import React from "react";
import { useSpatialSearchByRadius } from "@/core/geospatial/hooks/useSpatialSearch";

export interface NearbyEntity {
  id: string;
  type: "business" | "event" | "alert" | "tourist_point";
  name: string;
  distance: number;
  latitude: number;
  longitude: number;
  metadata?: Record<string, unknown>;
}

export interface UseNearbyEntitiesOptions {
  radiusKm: number;
  entityTypes: Array<"business" | "event" | "alert" | "tourist_point">;
  center: { latitude: number; longitude: number } | null;
  locationId?: string;
  limit?: number;
}

export function useNearbyEntities(options: UseNearbyEntitiesOptions) {
  const center = options.center;
  const fallbackCenter = center || { latitude: 0, longitude: 0 };

  const businesses = useSpatialSearchByRadius({
    center: fallbackCenter,
    radiusKm: options.radiusKm,
    entityType: "business",
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes("business"),
  });

  const events = useSpatialSearchByRadius({
    center: fallbackCenter,
    radiusKm: options.radiusKm,
    entityType: "event",
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes("event"),
  });

  const alerts = useSpatialSearchByRadius({
    center: fallbackCenter,
    radiusKm: options.radiusKm,
    entityType: "alert",
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes("alert"),
  });

  const touristPoints = useSpatialSearchByRadius({
    center: fallbackCenter,
    radiusKm: options.radiusKm,
    entityType: "tourist_point",
    locationId: options.locationId,
    limit: options.limit,
    enabled: !!center && options.entityTypes.includes("tourist_point"),
  });

  const entities = React.useMemo(() => {
    const all: NearbyEntity[] = [];

    if (businesses.data) {
      all.push(
        ...businesses.data.map((business) => ({
          id: business.id,
          type: "business" as const,
          name: business.name,
          distance: business.distance_meters ?? 0,
          latitude: business.latitude,
          longitude: business.longitude,
          metadata: business as unknown as Record<string, unknown>,
        })),
      );
    }

    if (events.data) {
      all.push(
        ...events.data.map((event) => ({
          id: event.id,
          type: "event" as const,
          name: event.name,
          distance: event.distance_meters ?? 0,
          latitude: event.latitude,
          longitude: event.longitude,
          metadata: event as unknown as Record<string, unknown>,
        })),
      );
    }

    if (alerts.data) {
      all.push(
        ...alerts.data.map((alert) => ({
          id: alert.id,
          type: "alert" as const,
          name: alert.name,
          distance: alert.distance_meters ?? 0,
          latitude: alert.latitude,
          longitude: alert.longitude,
          metadata: alert as unknown as Record<string, unknown>,
        })),
      );
    }

    if (touristPoints.data) {
      all.push(
        ...touristPoints.data.map((touristPoint) => ({
          id: touristPoint.id,
          type: "tourist_point" as const,
          name: touristPoint.name,
          distance: touristPoint.distance_meters ?? 0,
          latitude: touristPoint.latitude,
          longitude: touristPoint.longitude,
          metadata: touristPoint as unknown as Record<string, unknown>,
        })),
      );
    }

    return all.sort((left, right) => left.distance - right.distance);
  }, [businesses.data, events.data, alerts.data, touristPoints.data]);

  return {
    entities,
    isLoading:
      businesses.isLoading ||
      events.isLoading ||
      alerts.isLoading ||
      touristPoints.isLoading,
    isError:
      businesses.isError ||
      events.isError ||
      alerts.isError ||
      touristPoints.isError,
  };
}
