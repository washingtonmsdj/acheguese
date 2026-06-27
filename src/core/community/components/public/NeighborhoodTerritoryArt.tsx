import { useId } from "react";

import type { MapMarker, TerritoryPolygon } from "@/core/maps";

const ART_WIDTH = 360;
const ART_HEIGHT = 240;
const ART_PADDING = 32;

type TerritoryBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type NeighborhoodTerritoryArtProps = {
  polygons: TerritoryPolygon[];
  markers: MapMarker[];
  compact?: boolean;
  decorative?: boolean;
};

function getTerritoryBounds(polygons: TerritoryPolygon[]): TerritoryBounds | null {
  const coordinates = polygons.flatMap((polygon) => polygon.coordinates);
  if (coordinates.length === 0) return null;

  const latitudes = coordinates.map(([latitude]) => latitude).filter(Number.isFinite);
  const longitudes = coordinates.map(([, longitude]) => longitude).filter(Number.isFinite);
  if (latitudes.length === 0 || longitudes.length === 0) return null;

  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLng: Math.min(...longitudes),
    maxLng: Math.max(...longitudes),
  };
}

function projectCoordinate(
  latitude: number,
  longitude: number,
  bounds: TerritoryBounds,
  width = ART_WIDTH,
  height = ART_HEIGHT,
  padding = ART_PADDING,
): ProjectedPoint {
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.000001);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.000001);
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;

  return {
    x: padding + ((longitude - bounds.minLng) / lngSpan) * drawableWidth,
    y: padding + ((bounds.maxLat - latitude) / latSpan) * drawableHeight,
  };
}

function buildTerritoryPath(polygon: TerritoryPolygon, bounds: TerritoryBounds): string | null {
  const points = polygon.coordinates
    .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude))
    .map(([latitude, longitude]) => projectCoordinate(latitude, longitude, bounds));

  if (points.length < 3) return null;

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ") + " Z";
}

function getProjectedMarkerPoints(markers: MapMarker[], bounds: TerritoryBounds | null): ProjectedPoint[] {
  if (!bounds) return [];

  const projected = markers
    .map((marker) => projectCoordinate(marker.coordinates.latitude, marker.coordinates.longitude, bounds))
    .filter((point) => point.x >= ART_PADDING && point.x <= ART_WIDTH - ART_PADDING && point.y >= ART_PADDING && point.y <= ART_HEIGHT - ART_PADDING);

  const visible: ProjectedPoint[] = [];
  for (const point of projected) {
    const overlaps = visible.some((used) => Math.hypot(used.x - point.x, used.y - point.y) < 30);
    if (!overlaps) visible.push(point);
    if (visible.length >= 7) break;
  }

  return visible;
}

function getTerritoryAnchorPoints(polygons: TerritoryPolygon[], bounds: TerritoryBounds | null): ProjectedPoint[] {
  if (!bounds) return [];

  const candidates = polygons.flatMap((polygon) => {
    const center = polygon.center
      ? [projectCoordinate(polygon.center[0], polygon.center[1], bounds)]
      : [];
    const ringStep = Math.max(1, Math.floor(polygon.coordinates.length / 4));
    const ringPoints = polygon.coordinates
      .filter((_, index) => index % ringStep === 0)
      .map(([latitude, longitude]) => projectCoordinate(latitude, longitude, bounds));

    return [...center, ...ringPoints];
  });

  const visible: ProjectedPoint[] = [];
  for (const point of candidates) {
    if (point.x < ART_PADDING || point.x > ART_WIDTH - ART_PADDING || point.y < ART_PADDING || point.y > ART_HEIGHT - ART_PADDING) {
      continue;
    }

    const overlaps = visible.some((used) => Math.hypot(used.x - point.x, used.y - point.y) < 42);
    if (!overlaps) visible.push(point);
    if (visible.length >= 5) break;
  }

  return visible;
}

function mergeMarkerPoints(primary: ProjectedPoint[], fallback: ProjectedPoint[]): ProjectedPoint[] {
  const merged: ProjectedPoint[] = [];

  for (const point of [...primary, ...fallback]) {
    const overlaps = merged.some((used) => Math.hypot(used.x - point.x, used.y - point.y) < 34);
    if (!overlaps) merged.push(point);
    if (merged.length >= 7) break;
  }

  return merged;
}

export function NeighborhoodTerritoryArt({
  polygons,
  markers,
  compact = false,
  decorative = false,
}: NeighborhoodTerritoryArtProps) {
  const svgId = useId().replace(/:/g, "");
  const gridPatternId = `${svgId}-grid`;
  const boundaryGradientId = `${svgId}-boundary`;
  const bounds = getTerritoryBounds(polygons);
  const paths = bounds ? polygons.map((polygon) => buildTerritoryPath(polygon, bounds)).filter((path): path is string => Boolean(path)) : [];
  const markerPoints = getProjectedMarkerPoints(markers, bounds);
  const territoryAnchorPoints = getTerritoryAnchorPoints(polygons, bounds);
  const visibleMarkerPoints = markerPoints.length >= 3 ? markerPoints : mergeMarkerPoints(markerPoints, territoryAnchorPoints);
  const fallbackMarkerPoints = [
    { x: 170, y: 104 },
    { x: 214, y: 133 },
    { x: 150, y: 168 },
  ];
  const pinPalette = [
    { fill: "#1cd7e3", inner: "#dffcff" },
    { fill: "#ffae3d", inner: "#fff4d8" },
    { fill: "#54c977", inner: "#ecfff1" },
    { fill: "#4e97ff", inner: "#eef5ff" },
  ] as const;

  return (
    <svg
      className={`neighborhood-territory-art${compact ? " is-compact" : ""}${paths.length > 0 ? " has-boundary" : " is-fallback"}`}
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : paths.length > 0 ? "Contorno territorial do bairro" : "Mapa territorial em carregamento"}
    >
      <defs>
        <pattern id={gridPatternId} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(148, 163, 184, 0.13)" strokeWidth="1" />
        </pattern>
        <linearGradient id={boundaryGradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22e0d4" />
          <stop offset="100%" stopColor="#0d7186" />
        </linearGradient>
      </defs>
      <rect width={ART_WIDTH} height={ART_HEIGHT} fill="#07131a" />
      <rect width={ART_WIDTH} height={ART_HEIGHT} fill={`url(#${gridPatternId})`} opacity={compact ? 0.72 : 0.86} />
      <path d="M 20 206 C 88 164, 140 143, 211 91 S 312 35, 350 24" fill="none" stroke="rgba(120, 138, 157, 0.18)" strokeWidth={compact ? 1.4 : 1.6} />
      <path d="M 64 22 C 117 88, 172 118, 284 215" fill="none" stroke="rgba(120, 138, 157, 0.15)" strokeWidth={compact ? 1.1 : 1.3} />
      <path d="M 18 72 C 88 63, 135 65, 212 44 S 309 26, 352 44" fill="none" stroke="rgba(120, 138, 157, 0.14)" strokeWidth={compact ? 1.1 : 1.25} />
      {paths.length > 0 ? (
        paths.map((path, index) => (
          <path
            key={index}
            d={path}
            fill="rgba(10, 62, 78, 0.18)"
            stroke={`url(#${boundaryGradientId})`}
            strokeWidth={compact ? 2.2 : 2.6}
            strokeLinejoin="round"
          />
        ))
      ) : (
        <path
          d="M 144 34 L 238 48 L 300 98 L 252 164 L 188 205 L 112 178 L 74 118 L 96 58 Z"
          fill="rgba(10, 62, 78, 0.18)"
          stroke={`url(#${boundaryGradientId})`}
          strokeWidth={compact ? 2.2 : 2.6}
          strokeLinejoin="round"
        />
      )}
      {(visibleMarkerPoints.length > 0 ? visibleMarkerPoints : fallbackMarkerPoints).map((point, index) => {
        const tone = pinPalette[index % pinPalette.length];
        return (
          <g key={`${point.x}-${point.y}-${index}`} transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}>
            <circle r={compact ? 8 : 9} fill={tone.fill} fillOpacity="0.9" />
            <circle r={compact ? 2.4 : 3} fill={tone.inner} />
          </g>
        );
      })}
    </svg>
  );
}
