import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  BusinessUrlService,
  type BusinessUrlContext,
} from "@/core/business/services/BusinessUrlService";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { resolveCommunityPublicAliasTerritory } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";
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
      routeParams: {
        state: string;
        city: string;
        district: string;
        slug: string;
      };
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

function parsePublicTerritoryPath(path: string): {
  state: string;
  city: string;
  territorySlug?: string;
} | null {
  const parts = path.split("/").filter(Boolean);
  const [state, city, territorySlug] = parts;
  if (!state || !city) return null;
  return { state, city, territorySlug };
}

function extractBusinessTerritory(ctx: BusinessUrlContext): {
  state: string;
  city: string;
  district: string;
} | null {
  const parts = ctx.geographic_path.split("/").filter(Boolean);
  const [, state, city, district] = parts;
  if (!state || !city || !district) return null;
  return { state, city, district };
}

async function businessBelongsToTerritorialGroup(
  business: BusinessUrlContext,
  groupId: string,
): Promise<boolean> {
  const group = await createTerritorialGroupRepository().findWithMembers(groupId);
  if (!group) return false;

  return group.members.some(
    (member) => member.geographic_path === business.geographic_path,
  );
}

async function resolveBusinessFromAlias(
  communitySlug: string,
  entitySlug: string,
): Promise<BusinessUrlContext | null> {
  const community = await resolveCommunityPublicAliasTerritory(communitySlug);
  if (community.status !== "resolved") return null;

  const territory = parsePublicTerritoryPath(community.publicTerritoryPath);
  if (!territory) return null;

  if (community.resolved.kind === "group") {
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return null;

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    if (!business.geographic_path.startsWith(cityPrefix)) return null;

    const belongsToGroup = await businessBelongsToTerritorialGroup(
      business,
      community.resolved.group.id,
    );
    return belongsToGroup ? business : null;
  }

  if (!territory.territorySlug) {
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return null;

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    return business.geographic_path.startsWith(cityPrefix) ? business : null;
  }

  return BusinessUrlService.resolveByTerritoryAndSlug(
    territory.state,
    territory.city,
    territory.territorySlug,
    entitySlug,
  );
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

      const business = await resolveBusinessFromAlias(communitySlug, slug);
      if (cancelled) return;

      const territory = business ? extractBusinessTerritory(business) : null;
      if (!business || !territory) {
        setState({
          status: "not-found",
          message: "Empresa nao encontrada nesta comunidade.",
        });
        return;
      }

      setState({
        status: "resolved",
        routeParams: {
          state: territory.state,
          city: territory.city,
          district: territory.district,
          slug: business.slug,
        },
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
