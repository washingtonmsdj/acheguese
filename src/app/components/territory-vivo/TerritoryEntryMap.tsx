import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { DEFAULT_TILE_STYLE } from "@/shared/config/mapDefaults";
import {
  TerritoryEntryMapArrival,
  type TerritoryEntryArrivalStage,
} from "./TerritoryEntryMapArrival";

const loadTerritoryEntryMapRuntime = () => import("./TerritoryEntryMapRuntime");
const LazyTerritoryEntryMapRuntime = lazy(loadTerritoryEntryMapRuntime);

function preloadEntryMapStyle(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector("link[data-entry-map-style-preload]")) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "fetch";
  link.href = DEFAULT_TILE_STYLE.styleUrl;
  link.crossOrigin = "anonymous";
  link.setAttribute("fetchpriority", "high");
  link.dataset.entryMapStylePreload = "true";
  document.head.appendChild(link);
}

function preconnectOfficialBoundarySources(
  resolved: ResolvedTerritory | null | undefined,
): void {
  if (typeof document === "undefined" || !resolved) return;

  const locations =
    resolved.kind === "group" ? resolved.group.members : [resolved.location];
  const origins = new Set<string>();

  locations.forEach((location) => {
    const sourceUrl = location.metadata?.source_url;
    if (typeof sourceUrl !== "string" || !sourceUrl) return;

    try {
      const source = new URL(sourceUrl);
      if (source.protocol !== "https:" && source.protocol !== "http:") return;
      origins.add(source.origin);
    } catch {
      // Invalid optional metadata must never affect entry rendering.
    }
  });

  const existingPreconnectOrigins = new Set(
    Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'),
    ).flatMap((link) => {
      try {
        return [new URL(link.href).origin];
      } catch {
        return [];
      }
    }),
  );
  const existingDnsHosts = new Set(
    Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel="dns-prefetch"]'),
    ).flatMap((link) => {
      try {
        return [new URL(link.href, window.location.href).host];
      } catch {
        return [];
      }
    }),
  );

  origins.forEach((origin) => {
    const source = new URL(origin);

    if (!existingDnsHosts.has(source.host)) {
      const dnsPrefetch = document.createElement("link");
      dnsPrefetch.rel = "dns-prefetch";
      dnsPrefetch.href = `//${source.host}`;
      dnsPrefetch.dataset.entryBoundaryDnsPrefetch = "true";
      document.head.appendChild(dnsPrefetch);
      existingDnsHosts.add(source.host);
    }

    if (existingPreconnectOrigins.has(origin)) return;

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = origin;
    preconnect.crossOrigin = "anonymous";
    preconnect.dataset.entryBoundaryPreconnect = "true";
    document.head.appendChild(preconnect);
    existingPreconnectOrigins.add(origin);
  });
}

interface TerritoryEntryMapProps {
  city: Location | null;
  resolvedTerritory?: ResolvedTerritory | null;
  label?: string;
  isLoading: boolean;
  className?: string;
}

function EntryMapArrivalSurface({
  className,
  stage,
  label,
  sectionRef,
}: {
  className: string;
  stage: TerritoryEntryArrivalStage;
  label: string;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  const statusText =
    stage === "community"
      ? "Reconhecendo sua comunidade"
      : "Preparando o mapa oficial do território";

  return (
    <section
      ref={sectionRef}
      className={`territory-entry-map relative h-full min-h-[12rem] w-full overflow-hidden bg-territory-raised md:min-h-[18rem] lg:min-h-[24rem] ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${statusText} de ${label}`}
    >
      <TerritoryEntryMapArrival
        label={label}
        stage={stage}
        statusText={statusText}
      />
    </section>
  );
}

export default function TerritoryEntryMap({
  city,
  resolvedTerritory = null,
  label,
  isLoading,
  className = "",
}: TerritoryEntryMapProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shouldMountRuntime, setShouldMountRuntime] = useState(false);
  const territoryLabel = label ?? "Complexo do Nordeste de Amaralina";

  useEffect(() => {
    if (shouldMountRuntime) return;

    preloadEntryMapStyle();
    const preloadResolved =
      resolvedTerritory ?? (city ? { kind: "location" as const, location: city } : null);
    preconnectOfficialBoundarySources(preloadResolved);

    const runtimePromise = loadTerritoryEntryMapRuntime();
    void runtimePromise.then((module) =>
      Promise.all([
        module.preloadTerritoryEntryMapEngine(),
        module.preloadTerritoryEntryBoundary(preloadResolved),
      ]).then(() => undefined),
    );

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      const timeoutId = window.setTimeout(() => setShouldMountRuntime(true), 32);
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setShouldMountRuntime(true);
      },
      { rootMargin: "720px 0px", threshold: 0.01 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [city, resolvedTerritory, shouldMountRuntime]);

  if (!shouldMountRuntime) {
    return (
      <EntryMapArrivalSurface
        className={className}
        stage={isLoading ? "community" : "map"}
        label={territoryLabel}
        sectionRef={sectionRef}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <EntryMapArrivalSurface
          className={className}
          stage={isLoading ? "community" : "map"}
          label={territoryLabel}
        />
      }
    >
      <LazyTerritoryEntryMapRuntime
        city={city}
        resolvedTerritory={resolvedTerritory}
        label={territoryLabel}
        isLoading={isLoading}
        className={className}
      />
    </Suspense>
  );
}
