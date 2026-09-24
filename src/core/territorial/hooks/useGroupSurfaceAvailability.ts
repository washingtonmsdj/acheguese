import { useQueries } from "@tanstack/react-query";
import { groupAvailabilityService } from "../GroupAvailabilityService";
import { aggregateGroupSurfaceAvailability } from "../groupSurfaceAvailability";
import type { ModuleKey } from "@/core/rollout/types";
import type { GroupAvailabilityResult } from "../types";

export function useGroupSurfaceAvailability(
  groupId: string | null | undefined,
  moduleKeys: readonly ModuleKey[],
) {
  const uniqueModuleKeys = [...new Set(moduleKeys)];
  const enabled = Boolean(groupId && uniqueModuleKeys.length > 0);

  const queries = useQueries({
    queries: uniqueModuleKeys.map((moduleKey) => ({
      queryKey: ["group-availability", groupId, moduleKey],
      queryFn: () =>
        groupAvailabilityService.getGroupModuleAvailability(groupId!, moduleKey),
      enabled,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })),
  });

  const isLoading = enabled && queries.some((query) => query.isLoading);
  const isError = enabled && queries.some((query) => query.isError);
  const results = queries
    .map((query) => query.data)
    .filter(
      (result): result is GroupAvailabilityResult => result !== undefined,
    );

  const result =
    groupId && uniqueModuleKeys.length > 0
      ? aggregateGroupSurfaceAvailability(groupId, uniqueModuleKeys, results)
      : null;

  return {
    availability: result?.availability ?? "none",
    active_member_ids: isLoading
      ? undefined
      : (result?.active_member_ids ?? []),
    result,
    isLoading,
    isError,
  };
}
