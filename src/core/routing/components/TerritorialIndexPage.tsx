import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";

const TerritorialLandingPage = lazy(() =>
  import("./TerritorialLandingPage").then((module) => ({ default: module.TerritorialLandingPage })),
);

interface TerritorialIndexPageProps {
  CityLandingComponent?: ComponentType;
}

export function TerritorialIndexPage({ CityLandingComponent }: TerritorialIndexPageProps = {}) {
  if (CityLandingComponent) {
    return (
      <Suspense fallback={<PassivePageFallback />}>
        <CityLandingComponent />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PassivePageFallback />}>
      <TerritorialLandingPage />
    </Suspense>
  );
}
