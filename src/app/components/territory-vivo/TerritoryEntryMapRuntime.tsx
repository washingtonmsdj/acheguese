import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Map, MapPin } from "lucide-react";
import { LocationType, type Location } from "@/core/location/types";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import {
  DEFAULT_TILE_STYLE,
  NEIGHBORHOOD_COLORS,
} from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

const SALVADOR_VIEWPORT = {
  center: { latitude: -12.95, longitude: -38.48 },
  zoom: 10.1,
};

const LazyMapLibreAdapter = lazy(() =>
  import("@/core/maps/components/v3/MapLibreAdapter").then((module) => ({
    default: module.MapLibreAdapter,
  })),
);

export interface TerritoryEntryMapRuntimeProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  isLoading: boolean;
  className?: string;
}

function RuntimeMapLoadingSurface({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-territory-raised transition-opacity duration-300 motion-reduce:transition-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--territory-border)/0.2)_1px,transparent_1px),linear-gradient(hsl(var(--territory-border)/0.2)_1px,transparent_1px),radial-gradient(circle_at_62%_36%,hsl(var(--territory-brand)/0.14),transparent_30%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]"
        style={{
          backgroundSize: "72px 72px, 72px 72px, 100% 100%, 100% 100%",
        }}
      />
      <div className="absolute left-[14%] top-[18%] h-12 w-28 animate-pulse rounded-2xl bg-territory-surface/50 motion-reduce:animate-none" />
      <div className="absolute right-[12%] top-[28%] h-16 w-36 animate-pulse rounded-2xl bg-territory-surface/40 [animation-delay:120ms] motion-reduce:animate-none" />
      <div className="absolute bottom-[22%] left-[34%] h-14 w-32 animate-pulse rounded-2xl bg-territory-surface/50 [animation-delay:240ms] motion-reduce:animate-none" />
      <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 shadow-territory-highlight backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-brand/10">
            <span className="h-2.5 w-2.5 rounded-full bg-territory-brand" />
            <span className="absolute h-7 w-7 animate-ping rounded-full border border-territory-brand/30 motion-reduce:animate-none" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-territory-ink">
              {label}
            </strong>
            <small className="mt-0.5 block text-xs text-territory-muted-strong">
              Salvador · BA · Carregando mapa e limite territorial oficial
            </small>
          </span>
        </div>
      </div>
    </div>
  );
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

  useEffect(() => {
    setMapReady(false);
    setMapUnavailable(false);
  }, [territoryKey, isLoading]);

  useEffect(() => {
    if (isLoading || mapPresented) return;

    const timeoutId = window.setTimeout(() => {
      setMapUnavailable(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, mapPresented]);

  return (
    <section
      className={`territory-entry-map relative overflow-hidden bg-territory-raised ${className}`}
      aria-labelledby="territory-entry-map-title"
      aria-busy={!mapPresented}
    >
      <Suspense fallback={<RuntimeMapLoadingSurface label={territoryLabel} />}>
        <LazyMapLibreAdapter
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
          className={`pointer-events-none h-full w-full transition-opacity duration-300 motion-reduce:transition-none ${
            mapPresented ? "opacity-100" : "opacity-0"
          }`}
        />
      </Suspense>

      {!mapPresented && !mapUnavailable ? (
        <RuntimeMapLoadingSurface label={territoryLabel} />
      ) : null}

      {mapUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[hsl(var(--territory-canvas)/0.72)] p-6 text-center backdrop-blur-[2px]"
        >
          <div className="max-w-xs rounded-2xl border border-territory-border bg-territory-surface/95 px-5 py-4 shadow-territory-highlight">
            <Map className="mx-auto h-6 w-6 text-territory-brand" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-territory-ink">
              O mapa não carregou agora.
            </p>
            <p className="mt-1 text-sm leading-5 text-territory-muted-strong">
              A entrada no Complexo continua disponível nesta tela.
            </p>
          </div>
        </div>
      ) : boundaryUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 text-sm shadow-territory-highlight backdrop-blur-[2px]"
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
