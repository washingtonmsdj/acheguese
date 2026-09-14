import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  TerritoryEntryMapArrival,
  type TerritoryEntryArrivalStage,
} from "./TerritoryEntryMapArrival";

const loadTerritoryEntryMapRuntime = () => import("./TerritoryEntryMapRuntime");
const LazyTerritoryEntryMapRuntime = lazy(loadTerritoryEntryMapRuntime);

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

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      void loadTerritoryEntryMapRuntime();
      const timeoutId = window.setTimeout(() => setShouldMountRuntime(true), 32);
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void loadTerritoryEntryMapRuntime();
        setShouldMountRuntime(true);
      },
      { rootMargin: "720px 0px", threshold: 0.01 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldMountRuntime]);

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
