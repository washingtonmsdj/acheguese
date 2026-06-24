import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";

const TerritorialLandingPage = lazy(() =>
  import("./TerritorialLandingPage").then((module) => ({ default: module.TerritorialLandingPage })),
);

interface TerritorialIndexPageProps {
  CityLandingComponent?: ComponentType;
}

export function TerritorialIndexPage({ CityLandingComponent }: TerritorialIndexPageProps = {}) {
  if (CityLandingComponent) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CityLandingComponent />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <TerritorialLandingPage />
    </Suspense>
  );
}
