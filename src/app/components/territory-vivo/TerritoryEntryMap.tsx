import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";
import {
  TerritoryEntryMapArrival,
  type TerritoryEntryArrivalStage,
} from "./TerritoryEntryMapArrival";

const LazyTerritoryEntryMapRuntime = lazy(() =>
  import("./TerritoryEntryMapRuntime"),
);

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
    if (isLoading || shouldMountRuntime) return;

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      return scheduleBrowserIdleWork(
        () => setShouldMountRuntime(true),
        { timeoutMs: 900, fallbackDelayMs: 180 },
      );
    }

    let cancelIdleMount: (() => void) | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        cancelIdleMount = scheduleBrowserIdleWork(
          () => setShouldMountRuntime(true),
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
  }, [isLoading, shouldMountRuntime]);

  if (isLoading || !shouldMountRuntime) {
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
          stage="map"
          label={territoryLabel}
        />
      }
    >
      <LazyTerritoryEntryMapRuntime
        city={city}
        resolvedTerritory={resolvedTerritory}
        label={territoryLabel}
        isLoading={false}
        className={className}
      />
    </Suspense>
  );
}
