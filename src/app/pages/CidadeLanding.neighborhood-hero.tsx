import { Link } from "react-router-dom";
import {
  Globe2,
  Lock,
  MapPin,
  PencilLine,
  ShieldCheck,
  Store,
  Users,
  Wrench,
} from "lucide-react";

import type { MapMarker, TerritoryPolygon } from "@/core/maps";
import { formatMetric } from "./CidadeLanding.constants";
import type { PopulationMetric } from "./CidadeLanding.neighborhood-panels";

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

type NeighborhoodTerritoryHeroProps = {
  territoryName: string;
  cityName: string;
  stateLabel: string;
  isGroup: boolean;
  memberCount: number;
  population: PopulationMetric;
  businessCount: number;
  servicesCount: number;
  polygons: TerritoryPolygon[];
  markers: MapMarker[];
  enterHref: string;
  interactionHref: string;
  verifyHref: string;
  canInteract: boolean;
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

function TerritoryOutlineArt({
  polygons,
  markers,
  compact = false,
}: {
  polygons: TerritoryPolygon[];
  markers: MapMarker[];
  compact?: boolean;
}) {
  const bounds = getTerritoryBounds(polygons);
  const paths = bounds ? polygons.map((polygon) => buildTerritoryPath(polygon, bounds)).filter((path): path is string => Boolean(path)) : [];
  const markerPoints = getProjectedMarkerPoints(markers, bounds);
  const fallbackMarkerPoints = compact
    ? [{ x: 168, y: 126 }]
    : [
        { x: 170, y: 104 },
        { x: 214, y: 133 },
        { x: 150, y: 168 },
      ];

  return (
    <svg
      className={`neighborhood-territory-art${compact ? " is-compact" : ""}${paths.length > 0 ? " has-boundary" : " is-fallback"}`}
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      role="img"
      aria-label={paths.length > 0 ? "Contorno territorial do bairro" : "Mapa territorial em carregamento"}
    >
      <defs>
        <pattern id={compact ? "neighborhood-mini-grid" : "neighborhood-hero-grid"} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" />
        </pattern>
        <linearGradient id={compact ? "neighborhood-mini-boundary" : "neighborhood-hero-boundary"} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22e0d4" />
          <stop offset="100%" stopColor="#0d7186" />
        </linearGradient>
      </defs>
      <rect className="neighborhood-territory-grid" width={ART_WIDTH} height={ART_HEIGHT} />
      <path className="neighborhood-territory-road is-one" d="M 20 206 C 88 164, 140 143, 211 91 S 312 35, 350 24" />
      <path className="neighborhood-territory-road is-two" d="M 64 22 C 117 88, 172 118, 284 215" />
      <path className="neighborhood-territory-road is-three" d="M 18 72 C 88 63, 135 65, 212 44 S 309 26, 352 44" />
      {paths.length > 0 ? (
        paths.map((path, index) => <path key={index} className="neighborhood-territory-boundary" d={path} />)
      ) : (
        <path className="neighborhood-territory-boundary" d="M 144 34 L 238 48 L 300 98 L 252 164 L 188 205 L 112 178 L 74 118 L 96 58 Z" />
      )}
      {(markerPoints.length > 0 ? markerPoints : fallbackMarkerPoints).map((point, index) => (
        <g key={`${point.x}-${point.y}-${index}`} className={`neighborhood-territory-pin is-${index % 4}`} transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}>
          <circle r={compact ? 7 : 9} />
          <circle r={compact ? 2.4 : 3} />
        </g>
      ))}
    </svg>
  );
}

export function NeighborhoodTerritoryHero({
  territoryName,
  cityName,
  stateLabel,
  isGroup,
  memberCount,
  population,
  businessCount,
  servicesCount,
  polygons,
  markers,
  enterHref,
  interactionHref,
  verifyHref,
  canInteract,
}: NeighborhoodTerritoryHeroProps) {
  const populationLabel = population.value ? formatMetric(population.value) : "IBGE pendente";
  const territoryContextLabel = isGroup ? `${memberCount} áreas conectadas` : `${cityName}, ${stateLabel}`;

  return (
    <section className="neighborhood-community-hero neighborhood-community-hero-territorial" aria-label={`Comunidade pública de ${territoryName}`}>
      <div className="neighborhood-community-hero-copy">
        <span className="neighborhood-community-eyebrow">
          <MapPin aria-hidden="true" />
          {territoryName.toUpperCase()}
        </span>
        <h1>Comunidade do bairro</h1>
        <p>Serviços, avisos e negócios perto de você</p>
        <div className="neighborhood-community-badges">
          <span>
            <Globe2 aria-hidden="true" />
            Leitura pública
          </span>
          <span>
            <Users aria-hidden="true" />
            Interação para moradores
          </span>
        </div>
        <div className="neighborhood-community-rules">
          <span>
            <ShieldCheck aria-hidden="true" />
            Comunidade moderada
          </span>
          <span>
            <MapPin aria-hidden="true" />
            {territoryContextLabel}
          </span>
          <span>
            <Lock aria-hidden="true" />
            Para publicar, confirme sua moradia
          </span>
        </div>
        <div className="neighborhood-community-hero-actions">
          <Link to={enterHref}>
            <Users aria-hidden="true" />
            Entrar no bairro
          </Link>
          <Link to={interactionHref} aria-label={canInteract ? "Publicar no bairro" : "Entrar ou verificar moradia para publicar"}>
            <PencilLine aria-hidden="true" />
            Publicar
          </Link>
        </div>
      </div>

      <div className="neighborhood-community-hero-map" aria-hidden="true">
        <TerritoryOutlineArt polygons={polygons} markers={markers} />
      </div>

      <aside className="neighborhood-community-hero-summary" aria-label={`Resumo territorial de ${territoryName}`}>
        <div className="neighborhood-community-summary-top">
          <div className="neighborhood-community-summary-map" aria-hidden="true">
            <TerritoryOutlineArt polygons={polygons} markers={markers} compact />
          </div>
          <div className="neighborhood-community-summary-copy">
            <span>Sobre o bairro</span>
            <strong>{territoryName}</strong>
            <small>{territoryContextLabel}</small>
          </div>
        </div>

        <div className="neighborhood-community-summary-stats" aria-label="Dados do bairro">
          <span>
            <Users aria-hidden="true" />
            <strong>{populationLabel}</strong>
            <small>moradores</small>
          </span>
          <span>
            <Store aria-hidden="true" />
            <strong>{formatMetric(businessCount)}</strong>
            <small>negócios</small>
          </span>
          <span>
            <Wrench aria-hidden="true" />
            <strong>{formatMetric(servicesCount)}</strong>
            <small>serviços</small>
          </span>
        </div>

        <div className="neighborhood-community-summary-cta">
          <div>
            <strong>Participe mais do seu bairro</strong>
            <small>Verifique seu endereço para publicar, comentar, recomendar e entrar em grupos.</small>
          </div>
          <Link to={verifyHref}>
            <ShieldCheck aria-hidden="true" />
            Verifique sua moradia
          </Link>
        </div>
      </aside>
    </section>
  );
}
