import { useEffect, useMemo, useRef, useState } from "react";
import { LocationType, type Location } from "@/core/location/types";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE, NEIGHBORHOOD_COLORS } from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { MAP_DEFAULT_COORDINATES } from "@/shared/config/mapDefaults";
import {
  markPublicRootMapReady,
  PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS,
} from "@/shared/utils/publicRootReadiness";
import { TerritoryEntryMapArrival } from "./TerritoryEntryMapArrival";

const DEFAULT_ENTRY_VIEWPORT = {
  center: MAP_DEFAULT_COORDINATES,
  zoom: 10.1,
};
const ARRIVAL_CROSSFADE_MS = 160;
const BOUNDARY_TIMEOUT_MS = 8000;

function readLocationCenter(location: Location | null | undefined) {
  const latitude = location?.metadata?.center_latitude;
  const longitude = location?.metadata?.center_longitude;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return { latitude, longitude };
}

function formatCityContext(city: Location | null): string | null {
  if (!city) return null;
  const stateCode = city.metadata?.state_code;
  const normalizedStateCode =
    typeof stateCode === "string" && stateCode.trim().length > 0
      ? stateCode.trim().toUpperCase()
      : null;

  return [city.name, normalizedStateCode].filter(Boolean).join(" · ");
}

function resolveInitialViewport(
  resolved: ResolvedTerritory,
  city: Location | null,
) {
  if (resolved?.kind === "group") {
    const centers = resolved.group.members
      .map((member) => readLocationCenter(member))
      .filter((center): center is { latitude: number; longitude: number } => Boolean(center));

    if (centers.length > 0) {
      return {
        center: {
          latitude:
            centers.reduce((total, center) => total + center.latitude, 0) /
            centers.length,
          longitude:
            centers.reduce((total, center) => total + center.longitude, 0) /
            centers.length,
        },
        zoom: 13.1,
      };
    }
  }

  if (resolved?.kind === "location") {
    const center = readLocationCenter(resolved.location);
    if (center) {
      return {
        center,
        zoom: resolved.location.type === LocationType.CITY ? 10.1 : 13.4,
      };
    }
  }

  const cityCenter = readLocationCenter(city);
  return cityCenter ? { center: cityCenter, zoom: 10.1 } : DEFAULT_ENTRY_VIEWPORT;
}

export interface TerritoryEntryMapRuntimeProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  className?: string;
}

export default function TerritoryEntryMapRuntime({
  city,
  resolvedTerritory = null,
  label,
  className = "",
}: TerritoryEntryMapRuntimeProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [boundaryStarted, setBoundaryStarted] = useState(false);
  const [boundarySlow, setBoundarySlow] = useState(false);
  const [showArrival, setShowArrival] = useState(true);
  const [arrivalLeaving, setArrivalLeaving] = useState(false);
  const mapTimedOutRef = useRef(false);

  const resolved = useMemo<ResolvedTerritory>(
    () => resolvedTerritory ?? (city ? { kind: "location", location: city } : null),
    [city, resolvedTerritory],
  );
  const initialViewport = useMemo(
    () => resolveInitialViewport(resolved, city),
    [city, resolved],
  );
  const { polygons, isLoading: isBoundaryLoading } = useTerritoryPolygon(resolved, {
    enabled: boundaryStarted,
  });
  const color = useMemo(() => {
    // Reading computed CSS can force synchronous style calculation. The color
    // is only needed by the boundary, so keep it out of the basemap path.
    if (!boundaryStarted || typeof document === "undefined") {
      return NEIGHBORHOOD_COLORS[1];
    }
    const root = getComputedStyle(document.documentElement);
    const sun = root.getPropertyValue("--territory-sun").trim();
    const brand = root.getPropertyValue("--territory-brand").trim();
    return sun ? `hsl(${sun})` : brand ? `hsl(${brand})` : NEIGHBORHOOD_COLORS[1];
  }, [boundaryStarted]);

  const hasCompleteGroupBoundary = useMemo(() => {
    if (!resolved || resolved.kind !== "group") return true;
    if (resolved.group.members.length === 0) return false;
    const rendered = new Set(polygons.map((polygon) => polygon.name));
    return resolved.group.members.every((member) => rendered.has(member.name));
  }, [polygons, resolved]);

  const entryPolygons = useMemo(
    () => (hasCompleteGroupBoundary ? polygons : []).map((polygon) => ({
      ...polygon,
      color,
      fillOpacity: 0.12,
      lineWidth: 4,
      lineOpacity: 1,
    })),
    [color, hasCompleteGroupBoundary, polygons],
  );

  const isCity = !resolved || (resolved.kind === "location" && resolved.location.type === LocationType.CITY);
  const territoryName = resolved?.kind === "group"
    ? resolved.group.name
    : resolved?.kind === "location"
      ? resolved.location.name
      : city?.name ?? label ?? "Território";
  const territoryLabel = label ?? territoryName;
  const cityContext = formatCityContext(city);
  const boundaryUnavailable =
    boundaryStarted &&
    resolved?.kind === "group" &&
    !isBoundaryLoading &&
    !hasCompleteGroupBoundary;
  const boundaryPending =
    mapReady &&
    !boundaryUnavailable &&
    !boundarySlow &&
    (!boundaryStarted || isBoundaryLoading);
  const mapRegionBusy = !mapUnavailable && !mapReady;

  useEffect(() => {
    if (!mapReady) {
      setBoundaryStarted(false);
      return;
    }

    // Give the first usable basemap frame its own paint before starting the
    // official geometry request. This keeps GeoSalvador from competing with
    // the tiles that make the entry map visibly ready.
    const frameId = window.requestAnimationFrame(() => setBoundaryStarted(true));
    return () => window.cancelAnimationFrame(frameId);
  }, [mapReady, resolved]);

  useEffect(() => {
    if (!mapReady) {
      setShowArrival(!mapUnavailable);
      setArrivalLeaving(false);
      return;
    }

    // If the terminal timeout fallback was already shown, a late MapLibre
    // recovery should reveal the real canvas directly instead of replaying the
    // arrival skeleton for one more crossfade.
    if (mapTimedOutRef.current) {
      setShowArrival(false);
      setArrivalLeaving(false);
      return;
    }

    setShowArrival(true);
    setArrivalLeaving(true);
    const id = window.setTimeout(() => setShowArrival(false), ARRIVAL_CROSSFADE_MS);
    return () => window.clearTimeout(id);
  }, [mapReady, mapUnavailable]);

  useEffect(() => {
    if (mapReady || mapUnavailable) return;
    const id = window.setTimeout(() => {
      mapTimedOutRef.current = true;
      setMapUnavailable(true);
    }, PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [mapReady, mapUnavailable]);

  useEffect(() => {
    if (
      !mapReady ||
      !boundaryStarted ||
      !resolved ||
      resolved.kind !== "group" ||
      !isBoundaryLoading
    ) {
      setBoundarySlow(false);
      return;
    }
    const id = window.setTimeout(() => setBoundarySlow(true), BOUNDARY_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [boundaryStarted, isBoundaryLoading, mapReady, resolved]);

  return (
    <section
      className={`territory-entry-map relative h-full min-h-[12rem] w-full overflow-hidden bg-territory-raised md:min-h-[18rem] lg:min-h-[24rem] ${className}`}
      aria-labelledby="territory-entry-map-title"
      aria-busy={mapRegionBusy}
    >
      <MapLibreAdapter
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={initialViewport}
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
          markPublicRootMapReady();
          setMapReady(true);
          setMapUnavailable(false);
        }}
        className="pointer-events-none h-full min-h-[12rem] w-full md:min-h-[18rem] lg:min-h-[24rem]"
      />

      {showArrival && !mapUnavailable ? (
        <TerritoryEntryMapArrival
          label={territoryLabel}
          statusText="Conectando o mapa para sua chegada"
          leaving={arrivalLeaving}
        />
      ) : null}

      {mapUnavailable ? (
        <div role="status" className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[hsl(var(--territory-canvas)/0.82)] p-4 text-center">
          <div className="w-full max-w-xs rounded-3xl border border-territory-border bg-territory-surface px-5 py-5 shadow-territory-highlight">
            <span className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-territory-brand/25 bg-territory-brand/10 text-xs font-bold text-territory-brand" aria-hidden="true">A</span>
            <p className="mt-3 font-heading text-base font-bold text-territory-ink">A comunidade continua aqui.</p>
            <p className="mt-1.5 text-sm leading-5 text-territory-muted-strong">O mapa não respondeu agora, mas você pode continuar entrando em {territoryLabel} normalmente.</p>
          </div>
        </div>
      ) : boundaryUnavailable ? (
        <div role="status" className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 text-sm shadow-territory-highlight lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-w-md">
          <p className="font-semibold text-territory-ink">Limite territorial oficial indisponível agora.</p>
          <p className="mt-1.5 text-sm leading-5 text-territory-muted-strong">Não exibimos contorno aproximado ou incompleto de {territoryLabel}.</p>
        </div>
      ) : boundarySlow ? (
        <div role="status" className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 text-sm shadow-territory-highlight lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-w-md">
          <p className="font-semibold text-territory-ink">Mapa pronto. Limite oficial ainda carregando.</p>
          <p className="mt-1.5 text-sm leading-5 text-territory-muted-strong">Você já pode continuar. O contorno de {territoryLabel} segue sendo buscado em segundo plano, sem usar aproximação.</p>
        </div>
      ) : boundaryPending ? (
        <div role="status" className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-territory-border bg-territory-surface/95 px-3 py-2 text-xs font-semibold text-territory-muted-strong shadow-sm lg:bottom-6 lg:left-6">
          <span className="h-2 w-2 shrink-0 rounded-full bg-territory-brand motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          <span className="truncate">Mapa pronto. Carregando limite oficial...</span>
        </div>
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.04)_0%,transparent_85%)]" />
      <h2 id="territory-entry-map-title" className="sr-only">{isCity ? `${territoryLabel} disponível por inteiro` : `Perímetro de ${territoryLabel}`}</h2>
      {!isCity && mapReady ? (
        <div className="entry-map-label" aria-hidden="true">
          <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-[0.55rem] font-black leading-none">•</span>
          <span>
            <strong>{territoryLabel}</strong>
            {cityContext ? <small>{cityContext}</small> : null}
          </span>
        </div>
      ) : null}
      <span className="sr-only">Mapa territorial de {territoryName}</span>
    </section>
  );
}
