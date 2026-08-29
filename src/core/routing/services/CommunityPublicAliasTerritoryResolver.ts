import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { territorialGroupService } from "@/core/territorial";
import type { ResolvedTerritory } from "@/core/routing/types/territoryResolution";
import { isTerritoryPubliclyNavigable } from "@/core/routing/utils/territoryVisibility";
import {
  CommunityPublicAliasService,
  type CommunityPublicAliasResolution,
} from "./CommunityPublicAliasService";

export type CommunityPublicAliasTerritoryResolution =
  | {
      status: "resolved";
      alias: string;
      canonicalPath: string;
      publicTerritoryPath: string;
      resolved: Exclude<ResolvedTerritory, null>;
    }
  | {
      status: "not-found" | "ambiguous";
      alias: string;
      reason: string;
    };

function unresolved(
  resolution: CommunityPublicAliasResolution,
): CommunityPublicAliasTerritoryResolution {
  return {
    status: resolution.status === "ambiguous" ? "ambiguous" : "not-found",
    alias: resolution.alias,
    reason:
      resolution.reason ??
      "A URL curta informada nao corresponde a uma comunidade ativa.",
  };
}

export async function resolveCommunityPublicAliasTerritory(
  aliasValue: string,
): Promise<CommunityPublicAliasTerritoryResolution> {
  const resolution = await CommunityPublicAliasService.resolve(aliasValue);

  if (
    resolution.status !== "resolved" ||
    !resolution.canonicalPath ||
    !resolution.publicTerritoryPath ||
    !resolution.territoryType ||
    !resolution.territoryId
  ) {
    return unresolved(resolution);
  }

  if (resolution.territoryType === "territorial_group") {
    const group = await territorialGroupService.getGroupWithMembers(
      resolution.territoryId,
    );

    if (
      !group ||
      group.status !== "active" ||
      !isTerritoryPubliclyNavigable(group.metadata)
    ) {
      return {
        status: "not-found",
        alias: resolution.alias,
        reason: "Comunidade nao encontrada para este alias.",
      };
    }

    return {
      status: "resolved",
      alias: resolution.alias,
      canonicalPath: resolution.canonicalPath,
      publicTerritoryPath: resolution.publicTerritoryPath,
      resolved: { kind: "group", group },
    };
  }

  const location = await createLocationRepository().findById(
    resolution.territoryId,
  );

  if (
    !location ||
    location.status !== "active" ||
    !isTerritoryPubliclyNavigable(location.metadata)
  ) {
    return {
      status: "not-found",
      alias: resolution.alias,
      reason: "Comunidade nao encontrada para este alias.",
    };
  }

  return {
    status: "resolved",
    alias: resolution.alias,
    canonicalPath: resolution.canonicalPath,
    publicTerritoryPath: resolution.publicTerritoryPath,
    resolved: { kind: "location", location },
  };
}
