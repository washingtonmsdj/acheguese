import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";
import { TerritoryEntryMapSkeleton } from "./TerritoryEntryMapSkeleton";

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

function EntryMapPlaceholder({
  className,
  isLoading,
  label,
  sectionRef,
}: {
  className: string;
  isLoading: boolean;
  label: string;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  const statusText = isLoading
    ? "Carregando mapa e limite territorial oficial"
    : "Preparando mapa e limite territorial oficial";

  return (
    <section
      ref={sectionRef}
      className={`territory-entry-map relative h-full min-h-full w-full overflow-hidden bg-territory-raised ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${statusText} de ${label}`}
    >
      <TerritoryEntryMapSkeleton label={label} statusText={statusText} />
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
      <EntryMapPlaceholder
        className={className}
        isLoading={isLoading}
        label={territoryLabel}
        sectionRef={sectionRef}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <EntryMapPlaceholder
          className={className}
          isLoading={false}
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
