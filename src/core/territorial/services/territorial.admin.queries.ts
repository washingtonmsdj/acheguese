import type { TerritorialGroupWithMembers } from '@/core/territorial/contracts';
import { createTerritorialGroupRepository } from '@/core/territorial/repositories/createTerritorialGroupRepository';

/**
 * Administrative inventory for territorial groups.
 *
 * Unlike the product/public list, this intentionally does not force
 * `status=active`. Visibility of inactive rows is still governed by the
 * canonical admin RLS on territorial_groups / territorial_group_members.
 */
export async function listAdminTerritorialGroups(): Promise<TerritorialGroupWithMembers[]> {
  return createTerritorialGroupRepository().listAllForAdmin();
}
