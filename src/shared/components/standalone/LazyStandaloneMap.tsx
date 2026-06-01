import { lazy, Suspense } from "react";

import { cn } from "@/shared/utils/cn";

import type { StandaloneMapProps } from "./StandaloneMap";

const StandaloneMap = lazy(() => import("./StandaloneMap"));

interface LazyStandaloneMapProps extends StandaloneMapProps {
  fallbackClassName?: string;
}

export function LazyStandaloneMap({
  fallbackClassName,
  ...props
}: LazyStandaloneMapProps) {
  return (
    <Suspense
      fallback={
        <section id="location" className={cn("py-16", fallbackClassName)}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="h-[420px] w-full rounded-xl border bg-muted animate-pulse" />
          </div>
        </section>
      }
    >
      <StandaloneMap {...props} />
    </Suspense>
  );
}
