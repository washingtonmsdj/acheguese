import {
  MOBILITY_MAP_VISUALS,
  type MobilityMapMarkerKind,
  type MobilityMapMarkerSize,
} from "@/core/mobility/constants/mapVisuals";

export function createMobilityMapMarkerElement(
  kind: MobilityMapMarkerKind,
  size: MobilityMapMarkerSize = "standard",
): HTMLDivElement {
  const element = document.createElement("div");
  const marker = MOBILITY_MAP_VISUALS.markers[kind];
  const markerSize = MOBILITY_MAP_VISUALS.markerSizes[size];

  element.style.width = `${markerSize}px`;
  element.style.height = `${markerSize}px`;
  element.style.background = marker.color;
  element.style.borderRadius = marker.borderRadius;
  element.style.border = `${MOBILITY_MAP_VISUALS.markerBorder.width}px solid ${MOBILITY_MAP_VISUALS.markerBorder.color}`;
  element.style.boxShadow = MOBILITY_MAP_VISUALS.markerShadow;

  return element;
}
