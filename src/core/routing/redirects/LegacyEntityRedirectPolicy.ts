export type LegacyEntityRouteKind =
  | "public_entity_canonicalization"
  | "community_scoped_entity_alias";

export type LegacyEntityRouteDecision =
  | {
      readonly intent: "render";
      readonly owner: "public-site" | "community-portal";
      readonly targetPath: string;
    }
  | {
      readonly intent: "not_found";
      readonly owner: "community-portal";
      readonly targetPath: string;
      readonly reason: "non_canonical_community_entity_alias";
    };

export function decideLegacyEntityRoute({
  kind,
  currentPath,
  targetPath,
}: {
  readonly kind: LegacyEntityRouteKind;
  readonly currentPath: string;
  readonly targetPath: string;
}): LegacyEntityRouteDecision {
  if (kind === "public_entity_canonicalization") {
    return {
      intent: "render",
      owner: "public-site",
      targetPath,
    };
  }

  if (currentPath === targetPath) {
    return {
      intent: "render",
      owner: "community-portal",
      targetPath,
    };
  }

  return {
    intent: "not_found",
    owner: "community-portal",
    targetPath,
    reason: "non_canonical_community_entity_alias",
  };
}
