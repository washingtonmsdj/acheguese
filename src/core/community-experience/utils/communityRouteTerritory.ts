import type { TerritoryFilter } from "@/core/location";
import type { CommunityAccessTarget } from "@/core/community-experience/access";

export function resolveCommunityRouteTerritoryFilter(
  resolved: CommunityAccessTarget,
  activeMemberIds: readonly string[] = [],
): TerritoryFilter {
  if (resolved?.kind === "group") {
    const locationIds =
      activeMemberIds.length > 0
        ? activeMemberIds
        : resolved.group.members.map((member) => member.id).filter(Boolean);

    return locationIds.length > 0
      ? { scope: "group", location_ids: [...locationIds] }
      : { scope: "none" };
  }

  if (resolved?.kind === "location") {
    return { scope: "location", location_id: resolved.location.id };
  }

  return { scope: "none" };
}

export function resolveCommunityRouteDefaultLocationId(
  resolved: CommunityAccessTarget,
  activeMemberIds: readonly string[] = [],
): string | undefined {
  if (resolved?.kind === "location") return resolved.location.id;
  if (resolved?.kind === "group") {
    return activeMemberIds[0] ?? resolved.group.members[0]?.id;
  }

  return undefined;
}
