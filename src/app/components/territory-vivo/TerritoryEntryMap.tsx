import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
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
      className={`territory-entry-map relative overflow-hidden bg-territory-raised ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${statusText} de ${label}`}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--territory-border)/0.2)_1px,transparent_1px),linear-gradient(hsl(var(--territory-border)/0.2)_1px,transparent_1px),radial-gradient(circle_at_62%_36%,hsl(var(--territory-brand)/0.14),transparent_30%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]"
        style={{
          backgroundSize: "72px 72px, 72px 72px, 100% 100%, 100% 100%",
        }}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[14%] top-[18%] h-12 w-28 animate-pulse rounded-2xl bg-territory-surface/50 motion-reduce:animate-none" />
        <div className="absolute right-[12%] top-[28%] h-16 w-36 animate-pulse rounded-2xl bg-territory-surface/40 [animation-delay:120ms] motion-reduce:animate-none" />
        <div className="absolute bottom-[22%] left-[34%] h-14 w-32 animate-pulse rounded-2xl bg-territory-surface/50 [animation-delay:240ms] motion-reduce:animate-none" />
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-territory-border bg-territory-surface/95 px-4 py-3 shadow-territory-highlight backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-brand/10"
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-territory-brand" />
            <span className="absolute h-7 w-7 animate-ping rounded-full border border-territory-brand/30 motion-reduce:animate-none" />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-territory-ink">
              {label}
            </strong>
            <small className="mt-0.5 block text-xs text-territory-muted-strong">
              Salvador · BA · {statusText}
            </small>
          </span>
        </div>
      </div>
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
