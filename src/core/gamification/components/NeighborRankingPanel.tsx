import { lazy, Suspense } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

const ModuleNeighborRankingPanel = lazy(() =>
  import("@/modules/mobility/components/NeighborRankingPanel").then((module) => ({
    default: module.NeighborRankingPanel,
  })),
);

export function NeighborRankingPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <ModuleNeighborRankingPanel />
    </Suspense>
  );
}

