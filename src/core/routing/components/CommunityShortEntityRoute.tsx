import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { buildBusinessPublicUrlFromCommunityAlias } from "@/core/business/utils/businessPublicUrls";
import {
  resolveBusinessEntityFromCommunityAlias,
} from "@/core/routing/services/CommunityBusinessEntityResolver";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { TerritorialNotFound } from "./TerritorialNotFound";

type EntityState =
  | { status: "loading" }
  | {
      status: "resolved";
      targetPath: string;
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
        targetPath: buildBusinessPublicUrlFromCommunityAlias(
          resolution.alias,
          resolution.business.slug,
        ),
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
    <Navigate
      to={`${state.targetPath}${location.search}${location.hash}`}
      replace
    />
  );
}
