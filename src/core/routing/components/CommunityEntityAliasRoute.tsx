import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import {
  buildCommunityScopedEntityUrl,
  decideCommunityEntityRoute,
} from "@/core/routing/policies";
import {
  resolveBusinessEntityFromCommunityAlias,
  type BusinessEntityRouteParams,
} from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialNotFound } from "./TerritorialNotFound";

const EmpresaDetailLandingPage = lazy(() => import("@/app/pages/EmpresaDetailLandingPage"));

type EntityAliasState =
  | { status: "loading" }
  | {
      status: "resolved";
      publicPath: string;
      canonicalAlias: string;
      routeParams: BusinessEntityRouteParams;
    }
  | { status: "not-found"; message: string };

type SupportedEntityModule =
  | typeof APP_MODULE_SLUGS.business
  | typeof APP_MODULE_SLUGS.gastronomy;

function getModuleFromPath(pathname: string): SupportedEntityModule | null {
  const moduleSlug = pathname.split("/").filter(Boolean)[2];
  if (moduleSlug === APP_MODULE_SLUGS.business || moduleSlug === APP_MODULE_SLUGS.gastronomy) {
    return moduleSlug;
  }
  return null;
}

export function CommunityEntityAliasRoute() {
  const location = useLocation();
  const { communitySlug, slug } = useParams<{
    communitySlug?: string;
    slug?: string;
  }>();
  const [state, setState] = useState<EntityAliasState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveEntityAlias() {
      const moduleSlug = getModuleFromPath(location.pathname);
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

      const targetPath = buildCommunityScopedEntityUrl({
        communityAlias: resolution.alias,
        module: moduleSlug,
        slug: resolution.business.slug,
      });
      const publicPath = BusinessUrlService.getCanonicalUrl(resolution.business);
      const routeDecision = decideCommunityEntityRoute({
        currentPath: location.pathname,
        targetPath,
      });
      if (routeDecision.intent === "not_found") {
        setState({
          status: "not-found",
          message: "URL comunitaria nao canonica para esta entidade.",
        });
        return;
      }

      setState({
        status: "resolved",
        publicPath,
        canonicalAlias: resolution.alias,
        routeParams: resolution.routeParams,
      });
    }

    void resolveEntityAlias();

    return () => {
      cancelled = true;
    };
  }, [communitySlug, location.pathname, slug]);

  if (state.status === "loading") {
    return <PageLoader fullScreen message="Abrindo empresa..." />;
  }

  if (state.status === "not-found") {
    return <TerritorialNotFound message={state.message} />;
  }

  return (
    <>
      <div className="border-b border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="truncate">
            Portal comunitario de {state.canonicalAlias}
          </span>
          <Link
            to={state.publicPath}
            className="shrink-0 font-semibold text-emerald-100 underline-offset-4 hover:underline"
          >
            Ver no site publico
          </Link>
        </div>
      </div>
      <Suspense fallback={<PageLoader fullScreen message="Abrindo empresa..." />}>
        <EmpresaDetailLandingPage
          routeParams={state.routeParams}
          canonicalPathOverride={state.publicPath}
          communityAliasOverride={state.canonicalAlias}
        />
      </Suspense>
    </>
  );
}
