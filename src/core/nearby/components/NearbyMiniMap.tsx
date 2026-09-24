import { useMemo, useRef } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mapEntityProjection } from "@/core/maps";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { MAP_DEFAULT_COORDINATES } from "@/core/maps/config/defaultCoordinates";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import type { MapMarker } from "@/core/maps/types";
import { EntityStatus } from "@/shared/types/enums";
import type { NearbyBusiness } from "../domain/types";

interface NearbyMiniMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  businesses: NearbyBusiness[];
  radiusKm: number;
  showProximity: boolean;
  className?: string;
}

export function NearbyMiniMap({
  userLocation,
  businesses,
  radiusKm,
  showProximity,
  className = "",
}: NearbyMiniMapProps) {
  const adapterRef = useRef(null);
  const navigate = useNavigate();

  const markers = useMemo<MapMarker[]>(() => {
    return businesses
      .slice(0, 30)
      .map((business) =>
        mapEntityProjection.projectBusiness(
          {
            id: business.id,
            name: business.name,
            latitude: business.latitude,
            longitude: business.longitude,
            status: EntityStatus.ACTIVE,
            url: business.canonicalUrl,
            category: business.category,
            rating: business.rating,
            is_verified: business.verified,
            ...(showProximity
              ? {
                  distance: business.distanceMeters,
                  distance_meters: business.distanceMeters,
                }
              : {}),
          },
          { includeMetadata: true },
        ),
      )
      .filter((marker): marker is MapMarker => marker !== null);
  }, [businesses, showProximity]);

  const handleMarkerClick = (businessId: string) => {
    const business = businesses.find((item) => item.id === businessId);
    if (business) {
      navigate(business.canonicalUrl);
    }
  };

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
        className={`flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">Ative a localização para ver o mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border/50 ${className}`}
      style={{ height: "400px" }}
    >
      <MapLibreAdapter
        ref={adapterRef}
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={{ center, zoom }}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        userLocationMarker={{
          enabled: showProximity,
          autoAdd: showProximity,
        }}
        className="h-full w-full"
      />
    </div>
  );
}
