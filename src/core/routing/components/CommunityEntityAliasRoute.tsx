import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { resolveBusinessEntityFromCommunityAlias } from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialNotFound } from "./TerritorialNotFound";

type EntityAliasState =
  | { status: "loading" }
  | { status: "resolved"; targetPath: string }
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

      setState({
        status: "resolved",
        targetPath: `/${communitySlug}/${resolution.business.slug}`,
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
    <Navigate
      to={`${state.targetPath}${location.search}${location.hash}`}
      replace
    />
  );
}
