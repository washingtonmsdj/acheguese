import { supabase } from "@/integrations/supabase";
import {
  isCommunityRouteableTerritoryType,
  type CommunityRouteableTerritoryType,
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

export type CommunityPublicAliasTerritoryReference =
  | { kind: "location"; territoryId: string | null | undefined }
  | { kind: "group"; territoryId: string | null | undefined };

interface CommunityAliasRow {
  alias?: string;
  territory_community_id?: string;
  status?: string;
}

interface TerritoryCommunityRow {
  id?: string;
  name?: string;
  slug?: string;
  city_id?: string | null;
  territory_type?: string;
  territory_id?: string;
  status?: string;
}

const COMMUNITY_SELECT = [
  "id",
  "name",
  "slug",
  "city_id",
  "territory_type",
  "territory_id",
  "status",
].join(",");

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

function isCommunityRouteable(row: TerritoryCommunityRow | null): row is Required<
  Pick<TerritoryCommunityRow, "id" | "slug" | "city_id" | "territory_type" | "territory_id">
> &
  TerritoryCommunityRow & { territory_type: CommunityRouteableTerritoryType } {
  return Boolean(
    row?.id &&
      row.slug &&
      row.city_id &&
      isCommunityRouteableTerritoryType(row.territory_type) &&
      row.territory_id &&
      row.status !== "inactive",
  );
}

async function findCommunityById(id: string): Promise<TerritoryCommunityRow | null> {
  const { data, error } = await supabase
    .from("territory_communities" as never)
    .select(COMMUNITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as TerritoryCommunityRow;
}

async function findSingleCommunityBySlug(alias: string): Promise<{
  row: TerritoryCommunityRow | null;
  ambiguous: boolean;
}> {
  const { data, error } = await supabase
    .from("territory_communities" as never)
    .select(COMMUNITY_SELECT)
    .eq("slug", alias)
    .neq("status", "inactive")
    .limit(2);

  if (error || !data) {
    return { row: null, ambiguous: false };
  }

  const rows = data as TerritoryCommunityRow[];
  return {
    row: rows.length === 1 ? rows[0] : null,
    ambiguous: rows.length > 1,
  };
}

async function findCommunityByTerritoryReference(
  reference: CommunityPublicAliasTerritoryReference,
): Promise<TerritoryCommunityRow | null> {
  if (!reference.territoryId) return null;

  let query = supabase
    .from("territory_communities" as never)
    .select(COMMUNITY_SELECT)
    .eq("territory_id", reference.territoryId)
    .neq("status", "inactive");

  query =
    reference.kind === "group"
      ? query.eq("territory_type", "territorial_group")
      : query.in("territory_type", ["district", "neighborhood"]);

  const { data, error } = await query.limit(2);
  if (error || !data) return null;

  const rows = data as TerritoryCommunityRow[];
  return rows.length === 1 ? rows[0] : null;
}

async function findCommunityByExplicitAlias(alias: string): Promise<TerritoryCommunityRow | null> {
  if (!explicitCommunityAliasLookupEnabled) return null;

  const { data, error } = await supabase
    .from("community_public_aliases" as never)
    .select("alias, territory_community_id, status")
    .eq("alias", alias)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;

  const aliasRow = data as CommunityAliasRow;
  if (!aliasRow.territory_community_id) return null;
  return findCommunityById(aliasRow.territory_community_id);
}

async function findExplicitAliasByCommunityId(communityId: string): Promise<string | null> {
  if (!explicitCommunityAliasLookupEnabled) return null;

  const { data, error } = await supabase
    .from("community_public_aliases" as never)
    .select("alias, territory_community_id, status")
    .eq("territory_community_id", communityId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;

  const aliasRow = data as CommunityAliasRow;
  return aliasRow.alias ? cleanAlias(aliasRow.alias) : null;
}

async function resolvePublicAliasForCommunity(
  community: TerritoryCommunityRow,
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

async function buildRoutePaths(row: TerritoryCommunityRow): Promise<{
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
