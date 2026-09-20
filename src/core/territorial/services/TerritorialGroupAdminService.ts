/**
 * Admin lifecycle commands for territorial groups.
 *
 * Browser code never mutates territorial_groups or territorial_group_members
 * directly. The authenticated Edge broker owns authorization and delegates the
 * atomic command to the database transaction.
 */

import { invokeSupabaseBroker } from '@/core/infrastructure/edge-functions/edgeFunctionBroker';
import type {
  TerritorialGroup,
  TerritorialGroupStatus,
} from '@/core/territorial/contracts';

const FUNCTION_NAME = 'territorial-group-admin-rpc';
type TerritorialGroupAdminAction = 'saveGroup' | 'setStatus';

export interface SaveTerritorialGroupInput {
  groupId?: string;
  slug: string;
  name: string;
  description?: string | null;
  anchorCityId: string;
  memberLocationIds: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(message);
  return value;
}

function parseGroup(value: unknown): TerritorialGroup {
  const group = requireRecord(value, 'Resposta invalida ao salvar grupo territorial.');

  if (
    typeof group.id !== 'string' ||
    typeof group.slug !== 'string' ||
    typeof group.name !== 'string' ||
    (group.description !== null && typeof group.description !== 'string') ||
    typeof group.anchor_city_id !== 'string' ||
    (group.status !== 'active' && group.status !== 'inactive') ||
    !isRecord(group.metadata) ||
    typeof group.created_at !== 'string' ||
    typeof group.updated_at !== 'string'
  ) {
    throw new Error('Resposta invalida ao salvar grupo territorial.');
  }

  return group as unknown as TerritorialGroup;
}

function normalizedDescription(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function sameMemberSet(value: unknown, expected: string[]): boolean {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return false;
  }

  const actual = [...new Set(value as string[])].sort();
  const target = [...new Set(expected)].sort();
  return actual.length === target.length && actual.every((id, index) => id === target[index]);
}

async function invoke(
  action: TerritorialGroupAdminAction,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data = await invokeSupabaseBroker<Record<string, unknown>, TerritorialGroupAdminAction>({
    action,
    functionName: FUNCTION_NAME,
    noDataMessage: 'Broker territorial retornou dados invalidos.',
    params,
    serviceName: 'TerritorialGroupAdminService',
  });
  return data;
}

export class TerritorialGroupAdminService {
  static async saveGroup(input: SaveTerritorialGroupInput): Promise<TerritorialGroup> {
    const description = normalizedDescription(input.description);
    const data = await invoke('saveGroup', {
      ...(input.groupId ? { groupId: input.groupId } : {}),
      slug: input.slug.trim(),
      name: input.name.trim(),
      description,
      anchorCityId: input.anchorCityId,
      memberLocationIds: input.memberLocationIds,
    });

    const group = parseGroup(data.group);
    const memberCount = data.memberCount;
    if (
      group.slug !== input.slug.trim() ||
      group.name !== input.name.trim() ||
      group.description !== description ||
      group.anchor_city_id !== input.anchorCityId ||
      (input.groupId !== undefined && group.id !== input.groupId) ||
      typeof memberCount !== 'number' ||
      memberCount !== input.memberLocationIds.length ||
      !sameMemberSet(data.memberIds, input.memberLocationIds)
    ) {
      throw new Error('Confirmacao inconsistente ao salvar grupo territorial.');
    }

    return group;
  }

  static async setStatus(
    groupId: string,
    status: TerritorialGroupStatus,
  ): Promise<TerritorialGroup> {
    const data = await invoke('setStatus', { groupId, status });
    const group = parseGroup(data.group);

    if (group.id !== groupId || group.status !== status) {
      throw new Error('Confirmacao inconsistente ao alterar status territorial.');
    }

    return group;
  }
}

export const territorialGroupAdminService = TerritorialGroupAdminService;
