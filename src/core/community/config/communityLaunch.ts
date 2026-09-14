import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";

export interface CommunityLaunchTerritory {
  readonly name: string;
  readonly slug: string;
}

/**
 * Community rollout projection for the configured public launch territory.
 *
 * Territory membership and canonical slugs belong to the routing/territory
 * fallback owner. This module only projects that data for Community consumers;
 * it does not maintain a second list of neighborhoods or group slugs.
 */
const configuredLaunchTerritory = resolvePublicTerritoryFallback({
  state: TERRITORY_CONFIG.launch.state,
  city: TERRITORY_CONFIG.launch.city,
  territorySlug: TERRITORY_CONFIG.launch.community.slug,
});

const configuredLaunchGroup =
  configuredLaunchTerritory?.kind === "group"
    ? configuredLaunchTerritory.group
    : null;

export const SALVADOR_COMMUNITY_LAUNCH_CLUSTER: readonly CommunityLaunchTerritory[] =
  (configuredLaunchGroup?.members ?? []).map((member) => ({
    name: getPublicTerritoryLocationLabel(member),
    slug: member.slug,
  }));

export const SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG =
  configuredLaunchGroup?.slug ?? TERRITORY_CONFIG.launch.community.slug ?? "";

const configuredCommunityLaunchSlugs = new Set([
  SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
  ...SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((territory) => territory.slug),
].filter(Boolean));

export function isSalvadorCommunityLaunchTerritory(
  territorySlug: string | undefined,
): boolean {
  return Boolean(
    territorySlug &&
    configuredCommunityLaunchSlugs.has(territorySlug.toLowerCase()),
  );
}
