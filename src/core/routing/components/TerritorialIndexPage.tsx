import { lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { useTerritorialContext } from "./TerritorialLayout";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";

const TerritorialLandingPage = lazy(() =>
  import("./TerritorialLandingPage").then((module) => ({ default: module.TerritorialLandingPage })),
);

interface TerritorialIndexPageProps {
  CityLandingComponent?: ComponentType;
}

export function TerritorialIndexPage({ CityLandingComponent }: TerritorialIndexPageProps = {}) {
  const { resolved } = useTerritorialContext();

  if (resolved?.kind === "location" && resolved.location.type === "city") {
    if (!CityLandingComponent) {
      return (
        <Suspense fallback={<FullScreenLoader />}>
          <TerritorialLandingPage />
        </Suspense>
      );
    }
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
