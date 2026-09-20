import { useMemo, useRef } from "react";
import { MapPin } from "lucide-react";
import { mapEntityProjection } from "@/core/maps";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { MAP_DEFAULT_COORDINATES } from "@/core/maps/config/defaultCoordinates";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { MapMarker } from "@/core/maps/types";
import { EntityStatus } from "@/shared/types/enums";
import type { NearbyEntity } from "../hooks/useNearbyEntities";

interface NearbyMiniMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  entities: NearbyEntity[];
  radiusKm: number;
  showProximity: boolean;
  className?: string;
}

export function NearbyMiniMap({
  userLocation,
  entities,
  radiusKm,
  showProximity,
  className = "",
}: NearbyMiniMapProps) {
  const adapterRef = useRef(null);

  const markers = useMemo<MapMarker[]>(() => {
    return entities
      .slice(0, 30)
      .map((entity) => {
        const entityMetadata = entity.metadata ?? {};
        const {
          distance: _distance,
          distance_meters: _distanceMeters,
          ...metadataWithoutProximity
        } = entityMetadata;
        const proximityMetadata = showProximity
          ? {
              distance: entity.distance,
              distance_meters: entity.distance,
            }
          : {};

        const marker = mapEntityProjection.projectEntity(
          {
            id: entity.id,
            name: entity.name,
            latitude: entity.latitude,
            longitude: entity.longitude,
            status: EntityStatus.ACTIVE,
            ...metadataWithoutProximity,
            ...proximityMetadata,
          },
          entity.type,
          { includeMetadata: true },
        );

        if (!marker) return null;

        marker.metadata = {
          ...marker.metadata,
          ...metadataWithoutProximity,
          ...proximityMetadata,
          source: "nearby",
        };

        return marker;
      })
      .filter((marker): marker is MapMarker => marker !== null);
  }, [entities, showProximity]);

  const center = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }
    return MAP_DEFAULT_COORDINATES;
  }, [userLocation]);

  const zoom = useMemo(() => {
    if (radiusKm <= 1) return 15;
    if (radiusKm <= 2) return 14;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    return 11;
  }, [radiusKm]);

  if (!userLocation) {
    return (
      <div
        className={`rounded-2xl border border-border/50 bg-muted/30 flex items-center justify-center h-64 ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ative a localizacao para ver o mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-border/50 overflow-hidden ${className}`}
      style={{ height: "400px" }}
    >
      <MapLibreAdapter
        ref={adapterRef}
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={{ center, zoom }}
        markers={markers}
        userLocationMarker={{
          enabled: showProximity,
          autoAdd: showProximity,
        }}
        className="h-full w-full"
      />
    </div>
  );
}
