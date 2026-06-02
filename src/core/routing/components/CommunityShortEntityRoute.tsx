import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  resolveBusinessEntityFromCommunityAlias,
  type BusinessEntityRouteParams,
} from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialNotFound } from "./TerritorialNotFound";

const EmpresaDetailLandingPage = lazy(() => import("@/app/pages/EmpresaDetailLandingPage"));
const GastronomyDetailPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/GastronomyDetailPage"),
);

type EntityState =
  | { status: "loading" }
  | {
      status: "resolved";
      routeParams: BusinessEntityRouteParams;
      canonicalPath: string;
    }
  | { status: "not-found"; message: string };

type SupportedEntityModule =
  | typeof APP_MODULE_SLUGS.business
  | typeof APP_MODULE_SLUGS.gastronomy;

function getModuleFromPath(pathname: string): SupportedEntityModule | null {
  const parts = pathname.split("/").filter(Boolean);
  const moduleSlug = parts[1];
  if (moduleSlug === APP_MODULE_SLUGS.business || moduleSlug === APP_MODULE_SLUGS.gastronomy) {
    return moduleSlug;
  }
  return null;
}

export function CommunityShortEntityRoute() {
  const location = useLocation();
  const { communitySlug, slug } = useParams<{
    communitySlug?: string;
    slug?: string;
  }>();
  const [state, setState] = useState<EntityState>({ status: "loading" });

  const moduleSlug = getModuleFromPath(location.pathname);

  useEffect(() => {
    let cancelled = false;

    async function resolveEntity() {
      if (!communitySlug || !slug || !moduleSlug) {
        setState({
          status: "not-found",
          message: "URL curta de empresa invalida.",
        });
        return;
      }

      const resolution = await resolveBusinessEntityFromCommunityAlias(
        communitySlug,
        slug,
      );
      if (cancelled) return;

      if (resolution.status !== "resolved") {
        setState({
          status: "not-found",
          message: resolution.message,
        });
        return;
      }

      setState({
        status: "resolved",
        routeParams: resolution.routeParams,
        canonicalPath: location.pathname,
      });
    }

    void resolveEntity();

    return () => {
      cancelled = true;
    };
  }, [communitySlug, location.pathname, moduleSlug, slug]);

  if (state.status === "loading") {
    return <PageLoader fullScreen message="Abrindo empresa..." />;
  }

  if (state.status === "not-found" || !moduleSlug) {
    return (
      <TerritorialNotFound
        message={
          state.status === "not-found"
            ? state.message
            : "URL curta de empresa invalida."
        }
      />
    );
  }

  return (
    <Suspense fallback={<PageLoader fullScreen message="Abrindo empresa..." />}>
      {moduleSlug === APP_MODULE_SLUGS.gastronomy ? (
        <GastronomyDetailPage
          routeParams={state.routeParams}
          canonicalPathOverride={state.canonicalPath}
        />
      ) : (
        <EmpresaDetailLandingPage
          routeParams={state.routeParams}
          canonicalPathOverride={state.canonicalPath}
        />
      )}
    </Suspense>
  );
}
