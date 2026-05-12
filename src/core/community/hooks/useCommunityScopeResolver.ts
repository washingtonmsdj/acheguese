import { useMemo } from "react";
import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type CommunityScopeType = "district" | "territorial_group";

export type CommunityScope = {
  scope_type: CommunityScopeType;
  scope_id: string;
};

export function useCommunityScopeResolver(): {
  resolvedScope: CommunityScope | null;
  isLoading: boolean;
  resolved: ReturnType<typeof useResolveTerritoryFromUrl>["resolved"];
} {
  const { status, resolved } = useResolveTerritoryFromUrl();

  const resolvedScope = useMemo<CommunityScope | null>(() => {
    if (!resolved) return null;

    if (resolved.kind === "group") {
      return {
        scope_type: "territorial_group",
        scope_id: resolved.group.id,
      };
    }

    if (resolved.location.type === "city") return null;

    return {
      scope_type: "district",
      scope_id: resolved.location.id,
    };
  }, [resolved]);

  return {
    resolvedScope,
    isLoading: status === "idle" || status === "loading",
    resolved,
  };
}
