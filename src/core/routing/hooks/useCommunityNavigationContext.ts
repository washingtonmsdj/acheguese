import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { resolveCommunityPublicAliasTerritory } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";
import {
  getCommunityAliasCandidateFromPath,
  resolveCommunityNavigationContext,
  type CommunityNavigationContext,
} from "@/core/routing/utils/communityNavigationContext";

export function useCommunityNavigationContext(): CommunityNavigationContext | null {
  const location = useLocation();
  const territorialContext = useTerritorialContextOptional();
  const aliasCandidate = useMemo(
    () => getCommunityAliasCandidateFromPath(location.pathname),
    [location.pathname],
  );

  const aliasResolutionQuery = useQuery({
    queryKey: ["community-navigation-alias", aliasCandidate],
    enabled: Boolean(aliasCandidate),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      if (!aliasCandidate) return null;
      const resolution = await resolveCommunityPublicAliasTerritory(aliasCandidate);
      return resolution.status === "resolved" ? resolution : null;
    },
  });

  return useMemo(
    () =>
      resolveCommunityNavigationContext({
        pathname: location.pathname,
        territorialContext,
        aliasResolution: aliasResolutionQuery.data ?? null,
      }),
    [aliasResolutionQuery.data, location.pathname, territorialContext],
  );
}
