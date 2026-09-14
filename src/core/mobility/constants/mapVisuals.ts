export const MOBILITY_MAP_VISUALS = {
  route: {
    color: "#6366f1",
    width: 4,
    opacity: 0.8,
  },
  markers: {
    origin: {
      color: "#22c55e",
      borderRadius: "50%",
    },
    destination: {
      color: "#ef4444",
      borderRadius: "4px",
    },
    driver: {
      color: "#14b8a6",
      borderRadius: "50%",
    },
  },
  markerSizes: {
    compact: 18,
    standard: 24,
    driver: 32,
  },
  markerBorder: {
    width: 3,
    color: "#ffffff",
  },
  markerShadow: "0 2px 8px rgba(0,0,0,0.35)",
} as const;

export type MobilityMapMarkerKind = keyof typeof MOBILITY_MAP_VISUALS.markers;
export type MobilityMapMarkerSize = keyof typeof MOBILITY_MAP_VISUALS.markerSizes;
