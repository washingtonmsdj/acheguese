import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import {
  isCommunityRouteableTerritoryType,
  type CommunityPublicAliasTerritoryReference,
  type CommunityRouteableTerritoryType,
  type TerritoryCommunityRecord,
} from "@/core/community-experience/types";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import {
  buildCommunityAliasUrl,
  buildCommunityTerritoryUrl,
  geoPathToPublicUrl,
} from "@/core/routing/utils/territoryUrls";

export type CommunityPublicAliasStatus = "resolved" | "not-found" | "ambiguous";

export interface CommunityPublicAliasResolution {
  status: CommunityPublicAliasStatus;
  alias: string;
  canonicalPath?: string;
  publicTerritoryPath?: string;
  territoryType?: CommunityRouteableTerritoryType;
  territoryId?: string;
  reason?: string;
}

const explicitCommunityAliasLookupEnabled =
  import.meta.env.MODE === "test" ||
  import.meta.env.VITE_ENABLE_COMMUNITY_PUBLIC_ALIASES === "true";

const RESERVED_ROOT_ALIAS_SEGMENTS = new Set([
  "admin",
  "ai",
  "analytics",
  "br",
  "brasil",
  "busca",
  "buscar",
  "cadastro",
  "central",
  "chat",
  "checkout",
  "classificados",
  "comunicacao",
  "comunidade",
  "conta",
  "contato",
  "cupons",
  "dpo",
  "educacao",
  "empresas",
  "eventos",
  "gastronomia",
  "gastronomia-premium",
  "login",
  "mapa",
  "mensagens",
  "mobilidade",
  "notificacoes",
  "notifications",
  "oportunidades",
  "onboarding",
  "p",
  "perto-de-mim",
  "planos",
  "privacidade",
  "q",
  "ranking",
  "recomendacoes",
  "regras",
  "reset-password",
  "servicos",
  "settings",
  "sobre",
  "splash",
  "status",
  "termos",
  "track",
  "u",
  "vagas",
]);

function cleanAlias(value: string): string | null {
  const alias = value.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!alias || /[/?#]/.test(alias)) return null;
  if (/^[a-z]{2}$/.test(alias) || RESERVED_ROOT_ALIAS_SEGMENTS.has(alias)) {
    return null;
  }
  return alias;
}

export function normalizeCommunityPublicAliasCandidate(value: string): string | null {
  return cleanAlias(value);
}

function isCommunityRouteable(row: TerritoryCommunityRecord | null): row is Required<
  Pick<TerritoryCommunityRecord, "id" | "slug" | "city_id" | "territory_type" | "territory_id">
> &
  TerritoryCommunityRecord & { territory_type: CommunityRouteableTerritoryType } {
  return Boolean(
    row?.id &&
      row.slug &&
      row.city_id &&
      isCommunityRouteableTerritoryType(row.territory_type) &&
      row.territory_id &&
      row.status !== "inactive",
  );
}

async function findSingleCommunityBySlug(alias: string): Promise<{
  row: TerritoryCommunityRecord | null;
  ambiguous: boolean;
}> {
  return CommunityExperienceService.findSingleActiveCommunityBySlug(alias);
}

async function findCommunityByTerritoryReference(
  reference: CommunityPublicAliasTerritoryReference,
): Promise<TerritoryCommunityRecord | null> {
  return CommunityExperienceService.findCommunityByTerritoryReference(reference);
}

async function findCommunityByExplicitAlias(alias: string): Promise<TerritoryCommunityRecord | null> {
  if (!explicitCommunityAliasLookupEnabled) return null;

  const aliasRow = await CommunityExperienceService.findActivePublicAlias(alias);
  if (!aliasRow?.territory_community_id) return null;
  return CommunityExperienceService.findCommunityById(aliasRow.territory_community_id);
}

async function findExplicitAliasByCommunityId(communityId: string): Promise<string | null> {
  if (!explicitCommunityAliasLookupEnabled) return null;

  const aliasRow = await CommunityExperienceService.findActivePublicAliasByCommunityId(communityId);
  return aliasRow?.alias ? cleanAlias(aliasRow.alias) : null;
}

async function resolvePublicAliasForCommunity(
  community: TerritoryCommunityRecord,
): Promise<string | null> {
  if (!community.id) return null;

  const explicitAlias = await findExplicitAliasByCommunityId(community.id);
  if (explicitAlias) return explicitAlias;

  const fallbackAlias = community.slug ? cleanAlias(community.slug) : null;
  if (!fallbackAlias) return null;

  const slugLookup = await findSingleCommunityBySlug(fallbackAlias);
  if (slugLookup.ambiguous || slugLookup.row?.id !== community.id) return null;

  return fallbackAlias;
}

async function buildRoutePaths(row: TerritoryCommunityRecord): Promise<{
  canonicalPath: string;
  publicTerritoryPath: string;
} | null> {
  if (!isCommunityRouteable(row)) return null;

  const locationRepo = createLocationRepository();
  const cityLocation = await locationRepo.findById(row.city_id);
  if (!cityLocation?.geographic_path) return null;

  const cityBasePath = geoPathToPublicUrl(cityLocation.geographic_path);
  const territoryBasePath = `${cityBasePath}/${row.slug}`;

  return {
    canonicalPath: buildCommunityTerritoryUrl(territoryBasePath),
    publicTerritoryPath: territoryBasePath,
  };
}

export class CommunityPublicAliasService {
  static async findPublicUrlForTerritory(
    reference: CommunityPublicAliasTerritoryReference,
  ): Promise<string | null> {
    try {
      const community = await findCommunityByTerritoryReference(reference);
      if (!community || !isCommunityRouteable(community)) return null;

      const alias = await resolvePublicAliasForCommunity(community);
      return alias ? buildCommunityAliasUrl(alias) : null;
    } catch {
      return null;
    }
  }

  static async resolve(aliasValue: string): Promise<CommunityPublicAliasResolution> {
    const alias = cleanAlias(aliasValue);
    if (!alias) {
      return {
        status: "not-found",
        alias: aliasValue,
        reason: "Alias de comunidade invalido.",
      };
    }

    try {
      const explicitCommunity = await findCommunityByExplicitAlias(alias);
      const slugLookup = explicitCommunity
        ? null
        : await findSingleCommunityBySlug(alias);
      const community = explicitCommunity ?? slugLookup?.row ?? null;

      if (!community) {
        return {
          status: slugLookup?.ambiguous ? "ambiguous" : "not-found",
          alias,
          reason: slugLookup?.ambiguous
            ? "Este alias existe em mais de uma cidade. Use a URL completa da comunidade."
            : "Comunidade nao encontrada para este alias.",
        };
      }

      if (!isCommunityRouteable(community)) {
        return {
          status: "not-found",
          alias,
          reason: "A comunidade encontrada nao possui territorio canonico valido.",
        };
      }

      const routePaths = await buildRoutePaths(community);
      if (!routePaths) {
        return {
          status: "not-found",
          alias,
          reason: "A comunidade encontrada nao possui territorio canonico valido.",
        };
      }

      return {
        status: "resolved",
        alias,
        canonicalPath: routePaths.canonicalPath,
        publicTerritoryPath: routePaths.publicTerritoryPath,
        territoryType: community.territory_type,
        territoryId: community.territory_id,
      };
    } catch {
      return {
        status: "not-found",
        alias,
        reason: "Nao foi possivel resolver este alias de comunidade.",
      };
    }
  }
}
