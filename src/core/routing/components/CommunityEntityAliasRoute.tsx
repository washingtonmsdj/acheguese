import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import {
  buildCommunityScopedEntityUrl,
  decideLegacyEntityRoute,
} from "@/core/routing/policies";
import {
  resolveBusinessEntityFromCommunityAlias,
  type BusinessEntityRouteParams,
} from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialNotFound } from "./TerritorialNotFound";

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

export interface CommunityEntityAliasBusinessDetailProps {
  routeParams: BusinessEntityRouteParams;
  canonicalPathOverride: string;
  communityAliasOverride: string;
}

interface CommunityEntityAliasRouteProps {
  renderBusinessDetail: (
    props: CommunityEntityAliasBusinessDetailProps,
  ) => ReactNode;
}

function getModuleFromPath(pathname: string): SupportedEntityModule | null {
  const moduleSlug = pathname.split("/").filter(Boolean)[2];
  if (moduleSlug === APP_MODULE_SLUGS.business || moduleSlug === APP_MODULE_SLUGS.gastronomy) {
    return moduleSlug;
  }
  return null;
}

export function CommunityEntityAliasRoute({
  renderBusinessDetail,
}: CommunityEntityAliasRouteProps) {
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
      const routeDecision = decideLegacyEntityRoute({
        kind: "community_scoped_entity_alias",
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
        {renderBusinessDetail({
          routeParams: state.routeParams,
          canonicalPathOverride: state.publicPath,
          communityAliasOverride: state.canonicalAlias,
        })}
      </Suspense>
    </>
  );
}
