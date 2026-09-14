import { useEffect, useMemo, useState } from "react";
import { Map, MapPin } from "lucide-react";
import { LocationType, type Location } from "@/core/location/types";
import { MapLibreAdapter } from "@/core/maps/components/v3/LazyMapLibreAdapter";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import {
  DEFAULT_TILE_STYLE,
  NEIGHBORHOOD_COLORS,
} from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { TerritoryEntryMapArrival } from "./TerritoryEntryMapArrival";

const SALVADOR_VIEWPORT = {
  center: { latitude: -12.95, longitude: -38.48 },
  zoom: 10.1,
};

const ARRIVAL_CROSSFADE_MS = 360;

export interface TerritoryEntryMapRuntimeProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  isLoading: boolean;
  className?: string;
}

export default function TerritoryEntryMapRuntime({
  city,
  resolvedTerritory = null,
  label,
  isLoading,
  className = "",
}: TerritoryEntryMapRuntimeProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [showArrival, setShowArrival] = useState(true);
  const [arrivalLeaving, setArrivalLeaving] = useState(false);
  const resolved = useMemo<ResolvedTerritory>(
    () =>
      resolvedTerritory ??
      (city ? { kind: "location", location: city } : null),
    [city, resolvedTerritory],
  );
  const { polygons, isLoading: isBoundaryLoading } = useTerritoryPolygon(resolved);
  const territoryMapColor = useMemo(() => {
    if (typeof document === "undefined") return NEIGHBORHOOD_COLORS[1];

    const brandToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--territory-brand")
      .trim();

    const sunToken = getComputedStyle(document.documentElement)
      .getPropertyValue("--territory-sun")
      .trim();

    return sunToken
      ? `hsl(${sunToken})`
      : brandToken
        ? `hsl(${brandToken})`
        : NEIGHBORHOOD_COLORS[1];
  }, []);

  const hasCompleteGroupBoundary = useMemo(() => {
    if (!resolved || resolved.kind !== "group") return true;
    if (resolved.group.members.length === 0) return false;

    const renderedMembers = new Set(polygons.map((polygon) => polygon.name));
    return resolved.group.members.every((member) => renderedMembers.has(member.name));
  }, [polygons, resolved]);

  const entryPolygons = useMemo(
    () =>
      (hasCompleteGroupBoundary ? polygons : []).map((polygon) => ({
        ...polygon,
        color: territoryMapColor,
        fillOpacity: 0.12,
        lineWidth: 4,
        lineOpacity: 1,
      })),
    [hasCompleteGroupBoundary, polygons, territoryMapColor],
  );
  const isCity =
    !resolved ||
    (resolved.kind === "location" && resolved.location.type === LocationType.CITY);
  const territoryName =
    resolved?.kind === "group"
      ? resolved.group.name
      : resolved?.kind === "location"
        ? resolved.location.name
        : city?.name ?? "Salvador";
  const territoryLabel = label ?? territoryName;
  const territoryKey =
    resolved?.kind === "group"
      ? `group:${resolved.group.id}`
      : resolved?.kind === "location"
        ? `location:${resolved.location.id}`
        : "none";
  const boundaryUnavailable =
    resolved?.kind === "group" &&
    !isLoading &&
    !isBoundaryLoading &&
    !hasCompleteGroupBoundary;
  const mapPresented = mapReady && !isBoundaryLoading;
  const arrivalStage = mapReady ? "boundary" : "map";
  const arrivalStatusText = mapReady
    ? "Conferindo o limite territorial oficial"
    : "Conectando o mapa para sua chegada";

  useEffect(() => {
    setMapReady(false);
    setMapUnavailable(false);
    setShowArrival(true);
    setArrivalLeaving(false);
  }, [territoryKey, isLoading]);

  useEffect(() => {
    if (mapUnavailable) {
      setShowArrival(false);
      setArrivalLeaving(false);
      return;
    }

    if (!mapPresented) {
      setShowArrival(true);
      setArrivalLeaving(false);
      return;
    }

    setShowArrival(true);
    setArrivalLeaving(true);
    const timeoutId = window.setTimeout(() => {
      setShowArrival(false);
    }, ARRIVAL_CROSSFADE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [mapPresented, mapUnavailable]);

  useEffect(() => {
    if (isLoading || mapPresented) return;

    const timeoutId = window.setTimeout(() => {
      setMapUnavailable(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, mapPresented]);

  return (
    <section
      className={`territory-entry-map relative h-full min-h-[12rem] w-full overflow-hidden bg-territory-raised md:min-h-[18rem] lg:min-h-[24rem] ${className}`}
      aria-labelledby="territory-entry-map-title"
      aria-busy={!mapPresented}
    >
      <MapLibreAdapter
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={SALVADOR_VIEWPORT}
        territoryPolygons={entryPolygons}
        resolved={resolved}
        fitTerritoryBounds={entryPolygons.length > 0}
        territoryFitPadding={24}
        territoryFitMaxZoom={isCity ? 10.5 : 14}
        markers={[]}
        userLocationMarker={{ enabled: false, autoAdd: false }}
        enableClustering={false}
        attribution={false}
        hideNavigationControl
        interactive={false}
        onLoad={() => {
          setMapReady(true);
          setMapUnavailable(false);
        }}
        className={`pointer-events-none h-full min-h-[12rem] w-full transition-opacity duration-500 motion-reduce:transition-none md:min-h-[18rem] lg:min-h-[24rem] ${
          mapPresented ? "opacity-100" : "opacity-0"
        }`}
      />

      {showArrival && !mapUnavailable ? (
        <TerritoryEntryMapArrival
          label={territoryLabel}
          stage={arrivalStage}
          statusText={arrivalStatusText}
          leaving={arrivalLeaving}
        />
      ) : null}

      {mapUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[hsl(var(--territory-canvas)/0.76)] p-4 text-center backdrop-blur-[3px] sm:p-6"
        >
          <div className="w-full max-w-xs rounded-3xl border border-territory-border bg-territory-surface/95 px-5 py-5 shadow-territory-highlight sm:px-6 lg:max-w-sm lg:px-7 lg:py-6">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-territory-border bg-territory-raised text-territory-brand shadow-sm lg:h-12 lg:w-12">
              <Map className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 font-heading text-base font-bold text-territory-ink lg:text-lg">
              A comunidade continua aqui.
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-territory-muted-strong">
              O mapa não respondeu agora, mas você pode continuar entrando no Complexo normalmente.
            </p>
          </div>
        </div>
      ) : boundaryUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 text-sm shadow-territory-highlight backdrop-blur-[2px] sm:inset-x-4 sm:bottom-4 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-w-md lg:rounded-3xl lg:px-5 lg:py-4"
        >
          <p className="font-semibold text-territory-ink">
            Limite territorial oficial indisponível agora.
          </p>
          <p className="mt-1 leading-5 text-territory-muted-strong">
            Não exibimos contorno aproximado ou incompleto do Complexo.
          </p>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.04)_0%,transparent_85%)]"
      />

      <h2 id="territory-entry-map-title" className="sr-only">
        {isCity
          ? `${territoryLabel} disponível por inteiro`
          : `Perímetro de ${territoryLabel}`}
      </h2>

      {!isCity && mapPresented ? (
        <div className="entry-map-label" aria-hidden="true">
          <MapPin className="h-5 w-5" />
          <span>
            <strong>{territoryLabel}</strong>
            <small>Salvador · BA</small>
          </span>
        </div>
      ) : null}

      <span className="sr-only">
        <Map aria-hidden="true" /> Mapa territorial de {territoryName}
      </span>
    </section>
  );
}
