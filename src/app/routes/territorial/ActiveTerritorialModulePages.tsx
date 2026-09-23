import { lazy, Suspense } from "react";

import { StateLandingPage } from "@/core/routing/components/StateLandingPage";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import NotFound from "@/app/pages/NotFound";
import { ModulePageLoader } from "@/shared/components/loading/PageLoader";

const CategoryBusinessPage = lazy(
  () => import("@/core/business/pages/CategoryBusinessPage"),
);
const MapaPage = lazy(() => import("@/core/maps/pages/MapaPageV4"));

/**
 * Active territorial wrappers only.
 *
 * Post-MVP territorial modules stay in their bounded contexts and must not be
 * imported by the active AppLayout route graph while their lifecycle is paused.
 */
export function TerritorialCategoryBusinessPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();

  return (
    <Suspense fallback={<ModulePageLoader />}>
      <CategoryBusinessPage
        resolved={resolved}
        activeMemberIds={activeMemberIds}
      />
    </Suspense>
  );
}

export function TerritorialMapPage() {
  const { resolved, activeMemberIds } = useTerritorialContext();

  return (
    <Suspense fallback={<ModulePageLoader />}>
      <MapaPage
        resolved={resolved}
        activeMemberIds={activeMemberIds}
      />
    </Suspense>
  );
}


export function ActiveStateLandingPage() {
  return <StateLandingPage NotFoundComponent={NotFound} />;
}
