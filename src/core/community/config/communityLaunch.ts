export interface CommunityLaunchTerritory {
  readonly name: string;
  readonly slug: string;
}

/**
 * Canonical first Community cluster for Salvador.
 * Territory identities remain independent; this list only describes rollout.
 */
export const SALVADOR_COMMUNITY_LAUNCH_CLUSTER: readonly CommunityLaunchTerritory[] =
  [
    { name: "Nordeste de Amaralina", slug: "nordeste-de-amaralina" },
    { name: "Santa Cruz", slug: "santa-cruz" },
    { name: "Vale das Pedrinhas", slug: "vale-das-pedrinhas" },
    { name: "Chapada", slug: "chapada" },
  ] as const;

export const SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG =
  "complexo-do-nordeste-de-amaralina";

const SALVADOR_COMMUNITY_LAUNCH_SLUGS = new Set([
  SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
  ...SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((territory) => territory.slug),
]);

export function isSalvadorCommunityLaunchTerritory(
  territorySlug: string | undefined,
): boolean {
  return Boolean(
    territorySlug &&
    SALVADOR_COMMUNITY_LAUNCH_SLUGS.has(territorySlug.toLowerCase()),
  );
}
