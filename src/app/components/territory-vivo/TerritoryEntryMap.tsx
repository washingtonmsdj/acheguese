import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Map, MapPin } from "lucide-react";
import { LocationType, type Location } from "@/core/location/types";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import {
  DEFAULT_TILE_STYLE,
  NEIGHBORHOOD_COLORS,
} from "@/core/maps/providers/MapProvider";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";

const SALVADOR_VIEWPORT = {
  center: { latitude: -12.95, longitude: -38.48 },
  zoom: 10.1,
};

const LazyMapLibreAdapter = lazy(() =>
  import("@/core/maps/components/v3/MapLibreAdapter").then((module) => ({
    default: module.MapLibreAdapter,
  })),
);

interface TerritoryEntryMapProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  isLoading: boolean;
  className?: string;
}

export default function TerritoryEntryMap({
  city,
  resolvedTerritory = null,
  label,
  isLoading,
  className = "",
}: TerritoryEntryMapProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [shouldMountMap, setShouldMountMap] = useState(false);
  const resolved = useMemo<ResolvedTerritory>(
    () =>
      resolvedTerritory ??
      (city ? { kind: "location", location: city } : null),
    [city, resolvedTerritory],
  );
  const { polygons, isLoading: isBoundaryLoading } = useTerritoryPolygon(resolved, {
    enabled: shouldMountMap,
  });
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
    shouldMountMap &&
    resolved?.kind === "group" &&
    !isLoading &&
    !isBoundaryLoading &&
    !hasCompleteGroupBoundary;

  useEffect(() => {
    if (isLoading || shouldMountMap) return;

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      return scheduleBrowserIdleWork(
        () => setShouldMountMap(true),
        { timeoutMs: 900, fallbackDelayMs: 180 },
      );
    }

    let cancelIdleMount: (() => void) | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        // MapLibre/WebGL e mais caro que o restante da entrada. Mesmo quando o
        // mapa esta proximo da viewport, deixe o primeiro paint e a primeira
        // interacao terem prioridade antes de baixar/inicializar o chunk.
        cancelIdleMount = scheduleBrowserIdleWork(
          () => setShouldMountMap(true),
          { timeoutMs: 900, fallbackDelayMs: 180 },
        );
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      cancelIdleMount?.();
    };
  }, [isLoading, shouldMountMap]);

  useEffect(() => {
    setMapReady(false);
    setMapUnavailable(false);
  }, [territoryKey, isLoading]);

  useEffect(() => {
    if (isLoading || !shouldMountMap || mapReady) return;

    const timeoutId = window.setTimeout(() => {
      setMapUnavailable(true);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, mapReady, shouldMountMap]);

  return (
    <section
      ref={sectionRef}
      className={`territory-entry-map relative overflow-hidden bg-territory-raised ${className}`}
      aria-labelledby="territory-entry-map-title"
    >
      {isLoading || !shouldMountMap ? (
        <div
          className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_62%_36%,hsl(var(--territory-brand)/0.18),transparent_28%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]"
          aria-label={isLoading ? "Carregando mapa territorial" : "Preparando mapa territorial"}
        />
      ) : (
        <Suspense
          fallback={
            <div className="absolute inset-0 animate-pulse bg-territory-raised" />
          }
        >
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
            className="pointer-events-none h-full w-full"
          />
        </Suspense>
      )}

      {mapUnavailable ? (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[hsl(var(--territory-canvas)/0.72)] p-6 text-center backdrop-blur-[2px]"
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

      {!isCity ? (
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
