import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import {
  resolveCommunityNavigationContext,
  type CommunityNavigationContext,
} from "@/core/routing/utils/communityNavigationContext";

export function useCommunityNavigationContext(): CommunityNavigationContext | null {
  const location = useLocation();
  const territorialContext = useTerritorialContextOptional();

  return useMemo(
    () =>
      resolveCommunityNavigationContext({
        pathname: location.pathname,
        territorialContext,
      }),
    [location.pathname, territorialContext],
  );
}
