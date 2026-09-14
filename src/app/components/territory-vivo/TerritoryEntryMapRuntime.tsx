import { useEffect, useMemo, useState } from "react";
import { Map, MapPin, ShieldCheck } from "lucide-react";
import { LocationType, type Location } from "@/core/location/types";
import { MapLibreAdapter } from "@/core/maps/components/v3/LazyMapLibreAdapter";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { DEFAULT_TILE_STYLE, NEIGHBORHOOD_COLORS } from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { TerritoryEntryMapArrival } from "./TerritoryEntryMapArrival";

const SALVADOR_VIEWPORT = { center: { latitude: -12.95, longitude: -38.48 }, zoom: 10.1 };
const ARRIVAL_CROSSFADE_MS = 360;
const MAP_TIMEOUT_MS = 6000;
const BOUNDARY_TIMEOUT_MS = 8000;

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
  const [boundarySlow, setBoundarySlow] = useState(false);
  const [showArrival, setShowArrival] = useState(true);
  const [arrivalLeaving, setArrivalLeaving] = useState(false);

  const resolved = useMemo<ResolvedTerritory>(
    () => resolvedTerritory ?? (city ? { kind: "location", location: city } : null),
    [city, resolvedTerritory],
  );
  const { polygons, isLoading: isBoundaryLoading } = useTerritoryPolygon(resolved);
  const color = useMemo(() => {
    if (typeof document === "undefined") return NEIGHBORHOOD_COLORS[1];
    const root = getComputedStyle(document.documentElement);
    const sun = root.getPropertyValue("--territory-sun").trim();
    const brand = root.getPropertyValue("--territory-brand").trim();
    return sun ? `hsl(${sun})` : brand ? `hsl(${brand})` : NEIGHBORHOOD_COLORS[1];
  }, []);

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
      : city?.name ?? "Salvador";
  const territoryLabel = label ?? territoryName;
  const boundaryUnavailable = resolved?.kind === "group" && !isLoading && !isBoundaryLoading && !hasCompleteGroupBoundary;
  const boundaryPending = mapReady && !boundaryUnavailable && (isLoading || isBoundaryLoading);

  useEffect(() => {
    if (!mapReady) {
      setShowArrival(!mapUnavailable);
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
    const id = window.setTimeout(() => setMapUnavailable(true), MAP_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [mapReady, mapUnavailable]);

  useEffect(() => {
    if (!mapReady || !resolved || resolved.kind !== "group" || !isBoundaryLoading) {
      setBoundarySlow(false);
      return;
    }
    const id = window.setTimeout(() => setBoundarySlow(true), BOUNDARY_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isBoundaryLoading, mapReady, resolved]);

  return (
    <section
      className={`territory-entry-map relative h-full min-h-[12rem] w-full overflow-hidden bg-territory-raised md:min-h-[18rem] lg:min-h-[24rem] ${className}`}
      aria-labelledby="territory-entry-map-title"
      aria-busy={!mapReady || isLoading || isBoundaryLoading}
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
        className={`pointer-events-none h-full min-h-[12rem] w-full transition-opacity duration-500 motion-reduce:transition-none md:min-h-[18rem] lg:min-h-[24rem] ${mapReady ? "opacity-100" : "opacity-0"}`}
      />

      {showArrival && !mapUnavailable ? (
        <TerritoryEntryMapArrival
          label={territoryLabel}
          stage={isLoading ? "community" : "map"}
          statusText={isLoading ? "Reconhecendo sua comunidade enquanto o mapa abre" : "Conectando o mapa para sua chegada"}
          leaving={arrivalLeaving}
        />
      ) : null}

      {mapUnavailable ? (
        <div role="status" className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[hsl(var(--territory-canvas)/0.76)] p-4 text-center backdrop-blur-[3px]">
          <div className="w-full max-w-xs rounded-3xl border border-territory-border bg-territory-surface/95 px-5 py-5 shadow-territory-highlight">
            <Map className="mx-auto h-6 w-6 text-territory-brand" aria-hidden="true" />
            <p className="mt-3 font-heading text-base font-bold text-territory-ink">A comunidade continua aqui.</p>
            <p className="mt-1.5 text-sm leading-5 text-territory-muted-strong">O mapa não respondeu agora, mas você pode continuar entrando no Complexo normalmente.</p>
          </div>
        </div>
      ) : boundaryUnavailable ? (
        <div role="status" className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 text-sm shadow-territory-highlight backdrop-blur-[2px] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-w-md">
          <p className="font-semibold text-territory-ink">Limite territorial oficial indisponível agora.</p>
          <p className="mt-1 leading-5 text-territory-muted-strong">Não exibimos contorno aproximado ou incompleto do Complexo.</p>
        </div>
      ) : boundaryPending ? (
        <div role="status" className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-territory-border bg-territory-surface/90 px-3 py-2 text-xs font-semibold text-territory-muted-strong shadow-sm backdrop-blur-[3px] lg:bottom-6 lg:left-6">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="truncate">{boundarySlow ? "Mapa aberto. Limite oficial ainda carregando." : "Mapa pronto. Carregando limite oficial..."}</span>
        </div>
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--territory-canvas)/0.04)_0%,transparent_85%)]" />
      <h2 id="territory-entry-map-title" className="sr-only">{isCity ? `${territoryLabel} disponível por inteiro` : `Perímetro de ${territoryLabel}`}</h2>
      {!isCity && mapReady ? (
        <div className="entry-map-label" aria-hidden="true">
          <MapPin className="h-5 w-5" />
          <span><strong>{territoryLabel}</strong><small>Salvador · BA</small></span>
        </div>
      ) : null}
      <span className="sr-only"><Map aria-hidden="true" /> Mapa territorial de {territoryName}</span>
    </section>
  );
}
