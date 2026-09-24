import type { ModuleKey } from "@/core/rollout/types";
import type {
  GroupAvailabilityResult,
  GroupSurfaceAvailabilityResult,
} from "./types";

export function aggregateGroupSurfaceAvailability(
  groupId: string,
  moduleKeys: readonly ModuleKey[],
  results: readonly GroupAvailabilityResult[],
): GroupSurfaceAvailabilityResult {
  const activeMemberIds = [
    ...new Set(results.flatMap((result) => result.active_member_ids)),
  ];
  const totalActiveMembers = Math.max(
    activeMemberIds.length,
    ...results.map((result) => result.total_active_members),
    0,
  );
  const activeModuleMembers = activeMemberIds.length;

  return {
    group_id: groupId,
    module_keys: [...new Set(moduleKeys)],
    availability:
      activeModuleMembers === 0
        ? "none"
        : activeModuleMembers >= totalActiveMembers
          ? "full"
          : "partial",
    active_member_ids: activeMemberIds,
    total_active_members: totalActiveMembers,
    active_module_members: activeModuleMembers,
  };
}
