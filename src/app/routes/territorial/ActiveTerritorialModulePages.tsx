import { lazy, Suspense } from "react";

import { StateLandingPage } from "@/core/routing/components/StateLandingPage";
import { TerritorialLayout, useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import NotFound from "@/app/pages/NotFound";
import TerritoryHomePage from "@/app/pages/TerritoryHomePage";
import { getActiveNearbyProviderRolloutModuleKeys } from "@/app/config/nearbyProviderScope";
import { getActiveMapLayerRolloutModuleKeys } from "@/app/config/mapLayerProviderScope";
import { ModulePageLoader } from "@/shared/components/loading/PageLoader";
import { MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";

const CategoryBusinessPage = lazy(
  () => import("@/core/business/pages/CategoryBusinessPage"),
);

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
  return <TerritoryHomePage activeView="map" />;
}

export function TerritorialBusinessPortalPage() {
  return <TerritoryHomePage activeView="business" />;
}

export function TerritorialNearbyPortalPage() {
  return <TerritoryHomePage activeView="nearby" />;
}

export function TerritorialSearchPortalPage() {
  return <TerritoryHomePage activeView="search" />;
}


export function ActiveStateLandingPage() {
  return <StateLandingPage NotFoundComponent={NotFound} />;
}

export function ActiveTerritorialLayout() {
  return (
    <TerritorialLayout
      NotFoundComponent={NotFound}
      moduleKeysBySlug={{
        [MODULE_SLUGS.map]: getActiveMapLayerRolloutModuleKeys(),
        [MODULE_SLUGS.nearby]: getActiveNearbyProviderRolloutModuleKeys(),
      }}
    />
  );
}
