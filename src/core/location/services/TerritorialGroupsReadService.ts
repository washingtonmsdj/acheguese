/**
 * @deprecated Compatibility bridge.
 * Territorial-group reads are owned by core/territorial.
 */
import { territorialGroupService } from '@/core/territorial';
import type { TerritorialGroupWithMembers } from '@/core/territorial/contracts';

export class TerritorialGroupsReadService {
  static async listActiveGroups(): Promise<TerritorialGroupWithMembers[]> {
    return territorialGroupService.listAllGroups();
  }
}
