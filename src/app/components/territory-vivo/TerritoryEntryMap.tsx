import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Location } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";

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
  sectionRef,
}: {
  className: string;
  isLoading: boolean;
  sectionRef?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={sectionRef}
      className={`territory-entry-map relative overflow-hidden bg-territory-raised ${className}`}
      aria-label={isLoading ? "Carregando mapa territorial" : "Preparando mapa territorial"}
    >
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_62%_36%,hsl(var(--territory-brand)/0.18),transparent_28%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]" />
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
        />
      }
    >
      <LazyTerritoryEntryMapRuntime
        city={city}
        resolvedTerritory={resolvedTerritory}
        label={label}
        isLoading={false}
        className={className}
      />
    </Suspense>
  );
}
