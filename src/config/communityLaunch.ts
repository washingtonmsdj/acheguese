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

const SALVADOR_COMMUNITY_LAUNCH_SLUGS = new Set(
  SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((territory) => territory.slug),
);

export function isSalvadorCommunityLaunchTerritory(
  neighborhoodSlug: string | undefined,
): boolean {
  return Boolean(
    neighborhoodSlug &&
    SALVADOR_COMMUNITY_LAUNCH_SLUGS.has(neighborhoodSlug.toLowerCase()),
  );
}
