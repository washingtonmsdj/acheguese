import { Suspense } from "react";
import type { ComponentType } from "react";
import { TerritorialLandingPage } from "./TerritorialLandingPage";
import { useTerritorialContext } from "./TerritorialLayout";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";

interface TerritorialIndexPageProps {
  CityLandingComponent?: ComponentType;
}

export function TerritorialIndexPage({ CityLandingComponent }: TerritorialIndexPageProps = {}) {
  const { resolved } = useTerritorialContext();

  if (resolved?.kind === "location" && resolved.location.type === "city") {
    if (!CityLandingComponent) return <TerritorialLandingPage />;
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <CityLandingComponent />
      </Suspense>
    );
  }

  return <TerritorialLandingPage />;
}
