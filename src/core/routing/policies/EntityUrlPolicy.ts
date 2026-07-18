export {
  buildPublicEntityUrl,
  type PublicEntityUrlInput,
  type PublicUrlIntent,
} from "./PublicRoutePolicy";
export {
  buildCommunityPortalUrl,
  buildCommunityScopedEntityUrl,
  type CommunityScopedEntityUrlInput,
} from "./CommunityRoutePolicy";

export type CommunityEntityRouteDecision =
  | {
      readonly intent: "render";
      readonly targetPath: string;
    }
  | {
      readonly intent: "not_found";
      readonly targetPath: string;
      readonly reason: "non_canonical_community_entity_path";
    };

export function decideCommunityEntityRoute({
  currentPath,
  targetPath,
}: {
  readonly currentPath: string;
  readonly targetPath: string;
}): CommunityEntityRouteDecision {
  if (currentPath === targetPath) {
    return { intent: "render", targetPath };
  }

  return {
    intent: "not_found",
    targetPath,
    reason: "non_canonical_community_entity_path",
  };
}
