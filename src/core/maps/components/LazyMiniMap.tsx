import { lazy, Suspense } from "react";

import { cn } from "@/shared/utils/cn";

import type { MiniMapProps } from "./MiniMap";

const MiniMap = lazy(() =>
  import("./MiniMap").then((module) => ({ default: module.MiniMap })),
);

interface LazyMiniMapProps extends MiniMapProps {
  fallbackClassName?: string;
}

export function LazyMiniMap({
  className,
  fallbackClassName,
  height = "280px",
  ...props
}: LazyMiniMapProps) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className={cn("relative w-full bg-muted animate-pulse", className, fallbackClassName)}
          style={{ height }}
        />
      }
    >
      <MiniMap {...props} className={className} height={height} />
    </Suspense>
  );
}
