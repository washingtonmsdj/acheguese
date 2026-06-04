import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { buildBusinessPublicUrlFromCommunityAlias } from "@/core/business/utils/businessPublicUrls";
import {
  resolveBusinessEntityFromCommunityAlias,
  type BusinessEntityRouteParams,
} from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialLayout } from "./TerritorialLayout";
import { TerritorialNotFound } from "./TerritorialNotFound";

const EmpresaDetailLandingPage = lazy(() => import("@/app/pages/EmpresaDetailLandingPage"));

type ResolutionState =
  | { status: "checking" }
  | { status: "territory" }
  | {
      status: "entity";
      routeParams: BusinessEntityRouteParams;
      canonicalPath: string;
      canonicalAlias: string;
    }
  | { status: "not-found"; message: string };

function isStateCode(segment: string): boolean {
  return /^[a-z]{2}$/i.test(segment);
}

function isTwoSegmentRootPath(pathname: string): boolean {
  return pathname.split("/").filter(Boolean).length === 2;
}

export function CommunityEntityOrTerritorialCityRoute() {
  const location = useLocation();
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const [resolution, setResolution] = useState<ResolutionState>({
    status: "checking",
  });

  useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      if (!state || !city || !isTwoSegmentRootPath(location.pathname) || isStateCode(state)) {
        setResolution({ status: "territory" });
        return;
      }

      const entity = await resolveBusinessEntityFromCommunityAlias(state, city);
      if (cancelled) return;

      if (entity.status === "community-not-found") {
        setResolution({ status: "territory" });
        return;
      }

      if (entity.status === "business-not-found") {
        setResolution({ status: "not-found", message: entity.message });
        return;
      }

      setResolution({
        status: "entity",
        routeParams: entity.routeParams,
        canonicalPath: buildBusinessPublicUrlFromCommunityAlias(
          entity.alias,
          entity.business.slug,
        ),
        canonicalAlias: entity.alias,
      });
    }

    void resolveRoute();

    return () => {
      cancelled = true;
    };
  }, [city, location.pathname, state]);

  if (resolution.status === "checking") {
    return <PageLoader fullScreen message="Abrindo..." />;
  }

  if (resolution.status === "territory") {
    return <TerritorialLayout />;
  }

  if (resolution.status === "not-found") {
    return <TerritorialNotFound message={resolution.message} />;
  }

  return (
    <Suspense fallback={<PageLoader fullScreen message="Abrindo empresa..." />}>
      {resolution.canonicalPath !== location.pathname ? (
        <Navigate
          to={`${resolution.canonicalPath}${location.search}${location.hash}`}
          replace
        />
      ) : (
        <EmpresaDetailLandingPage
          routeParams={resolution.routeParams}
          canonicalPathOverride={resolution.canonicalPath}
          communityAliasOverride={resolution.canonicalAlias}
        />
      )}
    </Suspense>
  );
}
