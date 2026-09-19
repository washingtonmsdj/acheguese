/**
 * useGroupAvailability
 *
 * Hook React que resolve a disponibilidade de um módulo para um grupo territorial.
 *
 * Retorna:
 *   - availability: 'full' | 'partial' | 'none'
 *   - active_member_ids: IDs dos membros com rollout ativo (para TerritoryFilter)
 *   - isLoading / isError
 *
 * Uso: dentro de TerritorialLayout quando resolved.kind === 'group'
 */

import { useQuery } from '@tanstack/react-query';
import { groupAvailabilityService } from '../GroupAvailabilityService';
import type { ModuleKey } from '@/core/rollout/types';
import type { GroupAvailabilityResult } from '../types';

const DATABASE_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function isGroupAvailabilityQueryEnabled(
  groupId: string | null | undefined,
  moduleKey: ModuleKey | null | undefined,
): boolean {
  return Boolean(
    groupId && DATABASE_UUID_PATTERN.test(groupId) && moduleKey,
  );
}

const NONE_RESULT = (groupId: string, moduleKey: ModuleKey): GroupAvailabilityResult => ({
  module_key: moduleKey,
  group_id: groupId,
  availability: 'none',
  active_member_ids: [],
  member_statuses: [],
  total_active_members: 0,
  active_module_members: 0,
});

export function useGroupAvailability(
  groupId: string | null | undefined,
  moduleKey: ModuleKey | null | undefined,
) {
  // Public fallback territories use stable string IDs and have no persisted rollout row.
  // Never send those presentation-only IDs to a UUID-backed database query.
  const enabled = isGroupAvailabilityQueryEnabled(groupId, moduleKey);

  const query = useQuery({
    queryKey: ['group-availability', groupId, moduleKey],
    queryFn: () =>
      groupAvailabilityService.getGroupModuleAvailability(groupId!, moduleKey!),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    availability: query.data?.availability ?? 'none',
    active_member_ids: query.isLoading ? undefined : (query.data?.active_member_ids ?? []),
    result: query.data ?? (groupId && moduleKey ? NONE_RESULT(groupId, moduleKey) : null),
    isLoading: query.isLoading && enabled,
    isError: query.isError,
  };
}
