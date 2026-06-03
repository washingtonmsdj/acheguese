import {
  BusinessUrlService,
  type BusinessUrlContext,
} from "@/core/business/services/BusinessUrlService";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { resolveCommunityPublicAliasTerritory } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";

export interface BusinessEntityRouteParams {
  state: string;
  city: string;
  district: string;
  slug: string;
}

export type CommunityBusinessEntityResolution =
  | {
      status: "resolved";
      alias: string;
      business: BusinessUrlContext;
      routeParams: BusinessEntityRouteParams;
    }
  | { status: "community-not-found"; message: string }
  | { status: "business-not-found"; message: string };

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

export function extractBusinessTerritory(ctx: BusinessUrlContext): {
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

function resolvedBusiness(
  business: BusinessUrlContext | null,
  alias: string,
): CommunityBusinessEntityResolution {
  const territory = business ? extractBusinessTerritory(business) : null;

  if (!business || !territory) {
    return {
      status: "business-not-found",
      message: "Empresa nao encontrada nesta comunidade.",
    };
  }

  return {
    status: "resolved",
    alias,
    business,
    routeParams: {
      state: territory.state,
      city: territory.city,
      district: territory.district,
      slug: business.slug,
    },
  };
}

export async function resolveBusinessEntityFromCommunityAlias(
  communitySlug: string,
  entitySlug: string,
): Promise<CommunityBusinessEntityResolution> {
  const community = await resolveCommunityPublicAliasTerritory(communitySlug);
  if (community.status !== "resolved") {
    return {
      status: "community-not-found",
      message: community.reason,
    };
  }

  const territory = parsePublicTerritoryPath(community.publicTerritoryPath);
  if (!territory) {
    return {
      status: "community-not-found",
      message: "Comunidade nao encontrada para este alias.",
    };
  }

  if (community.resolved.kind === "group") {
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return resolvedBusiness(null, community.alias);

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    if (!business.geographic_path.startsWith(cityPrefix)) {
      return resolvedBusiness(null, community.alias);
    }

    const belongsToGroup = await businessBelongsToTerritorialGroup(
      business,
      community.resolved.group.id,
    );

    return resolvedBusiness(belongsToGroup ? business : null, community.alias);
  }

  if (!territory.territorySlug) {
    const business = await BusinessUrlService.resolveBySlug(entitySlug);
    if (!business) return resolvedBusiness(null, community.alias);

    const cityPrefix = `/br/${territory.state}/${territory.city}/`;
    return resolvedBusiness(
      business.geographic_path.startsWith(cityPrefix) ? business : null,
      community.alias,
    );
  }

  return resolvedBusiness(
    await BusinessUrlService.resolveByTerritoryAndSlug(
      territory.state,
      territory.city,
      territory.territorySlug,
      entitySlug,
    ),
    community.alias,
  );
}
