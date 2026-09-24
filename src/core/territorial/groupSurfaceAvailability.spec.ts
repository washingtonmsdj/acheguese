import { describe, expect, it } from "vitest";
import { ModuleKey } from "@/core/rollout/types";
import { aggregateGroupSurfaceAvailability } from "./groupSurfaceAvailability";
import type { GroupAvailabilityResult } from "./types";

function result(
  moduleKey: ModuleKey,
  activeMemberIds: string[],
  totalActiveMembers = 3,
): GroupAvailabilityResult {
  return {
    module_key: moduleKey,
    group_id: "group-1",
    availability:
      activeMemberIds.length === 0
        ? "none"
        : activeMemberIds.length >= totalActiveMembers
          ? "full"
          : "partial",
    active_member_ids: activeMemberIds,
    member_statuses: [],
    total_active_members: totalActiveMembers,
    active_module_members: activeMemberIds.length,
  };
}

describe("aggregateGroupSurfaceAvailability", () => {
  it("preserves singleton module behavior", () => {
    expect(
      aggregateGroupSurfaceAvailability(
        "group-1",
        [ModuleKey.BUSINESS],
        [result(ModuleKey.BUSINESS, ["a", "b"], 3)],
      ),
    ).toMatchObject({
      module_keys: [ModuleKey.BUSINESS],
      availability: "partial",
      active_member_ids: ["a", "b"],
      total_active_members: 3,
      active_module_members: 2,
    });
  });

  it("uses OR semantics across providers and deduplicates members", () => {
    expect(
      aggregateGroupSurfaceAvailability(
        "group-1",
        [ModuleKey.BUSINESS, ModuleKey.SERVICES],
        [
          result(ModuleKey.BUSINESS, ["a", "b"], 3),
          result(ModuleKey.SERVICES, ["b", "c"], 3),
        ],
      ),
    ).toMatchObject({
      availability: "full",
      active_member_ids: ["a", "b", "c"],
      total_active_members: 3,
      active_module_members: 3,
    });
  });

  it("fails closed when no provider returns an active member", () => {
    expect(
      aggregateGroupSurfaceAvailability(
        "group-1",
        [ModuleKey.BUSINESS, ModuleKey.SERVICES],
        [
          result(ModuleKey.BUSINESS, [], 3),
          result(ModuleKey.SERVICES, [], 3),
        ],
      ),
    ).toMatchObject({
      availability: "none",
      active_member_ids: [],
      total_active_members: 3,
      active_module_members: 0,
    });
  });
});
