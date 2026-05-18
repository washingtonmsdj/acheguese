import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { Location, TerritorialGroupWithMembers } from "@/core/location/types";

interface GroupMemberRow {
  group_id: string;
  location?: Location | null;
}

export class TerritorialGroupsReadService {
  static async listActiveGroups(): Promise<TerritorialGroupWithMembers[]> {
    const { data: groupsRows, error: groupsError } = await supabase
      .from("territorial_groups")
      .select("*")
      .eq("status", "active");

    if (groupsError) {
      logger.error("TerritorialGroupsReadService.listActiveGroups.groups", groupsError);
      throw groupsError;
    }

    const groups = (groupsRows ?? []) as TerritorialGroupWithMembers[];
    if (groups.length === 0) return [];

    const groupIds = groups.map((group) => group.id).filter(Boolean);
    const membersByGroup = new Map<string, Location[]>();

    const { data: membersRows, error: membersError } = await supabase
      .from("territorial_group_members")
      .select("group_id, location:locations!location_id(*)")
      .in("group_id", groupIds);

    if (membersError) {
      logger.error("TerritorialGroupsReadService.listActiveGroups.members", membersError);
      throw membersError;
    }

    for (const row of (membersRows ?? []) as GroupMemberRow[]) {
      if (!row.group_id || !row.location) continue;
      const current = membersByGroup.get(row.group_id) ?? [];
      current.push(row.location);
      membersByGroup.set(row.group_id, current);
    }

    return groups.map((group) => ({
      ...group,
      members: membersByGroup.get(group.id) ?? [],
    }));
  }
}
