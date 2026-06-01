import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { BusinessUrlService, type BusinessUrlContext } from "@/core/business/services/BusinessUrlService";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";
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

async function businessBelongsToTerritorialGroup(
  business: BusinessUrlContext,
  groupId: string,
): Promise<boolean> {
  const groupRepo = createTerritorialGroupRepository();
  const group = await groupRepo.findWithMembers(groupId);
  if (!group) return false;

  return group.members.some(
    (member) => member.geographic_path === business.geographic_path,
  );
}

async function resolveBusinessFromCommunityAlias(
  moduleSlug: SupportedEntityModule,
  communitySlug: string,
  entitySlug: string,
): Promise<{ targetPath: string } | null> {
  const community = await CommunityPublicAliasService.resolve(communitySlug);
  if (
    community.status !== "resolved" ||
    !community.publicTerritoryPath ||
    !community.territoryType
  ) {
    return null;
  }

  const territory = parsePublicTerritoryPath(community.publicTerritoryPath);
  if (!territory) return null;

  if (community.territoryType === "territorial_group") {
    if (!community.territoryId) return null;
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return null;

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    if (!business.geographic_path.startsWith(cityPrefix)) return null;

    const belongsToGroup = await businessBelongsToTerritorialGroup(
      business,
      community.territoryId,
    );
    if (!belongsToGroup) return null;

    return { targetPath: `/${communitySlug}/${moduleSlug}/${business.slug}` };
  }

  if (!territory.territorySlug) {
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return null;

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    if (!business.geographic_path.startsWith(cityPrefix)) return null;

    return { targetPath: `/${communitySlug}/${moduleSlug}/${business.slug}` };
  }

  const business = await BusinessUrlService.resolveByTerritoryAndSlug(
    territory.state,
    territory.city,
    territory.territorySlug,
    entitySlug,
  );
  if (!business) return null;

  return { targetPath: `/${communitySlug}/${moduleSlug}/${business.slug}` };
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

      const resolution = await resolveBusinessFromCommunityAlias(
        moduleSlug,
        communitySlug,
        slug,
      );
      if (cancelled) return;

      if (!resolution) {
        setState({
          status: "not-found",
          message: "Empresa nao encontrada nesta comunidade.",
        });
        return;
      }

      setState({ status: "resolved", targetPath: resolution.targetPath });
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
