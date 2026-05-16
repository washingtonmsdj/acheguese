/**
 * Communication Channel Identity Adapter
 * Implementacao de identidade publica para communication_channels.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { insertLooseRow, selectLooseRows } from '@/integrations/supabase/services/supabaseHelpers';
import { CommunicationChannelIdentityPolicy } from '../policies/CommunicationChannelIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type {
  ChangeReason,
  CooldownResult,
  EntityId,
  EntityType,
  IdentityChangeRecord,
} from '../domain/types';

interface CommunicationChannelRow {
  id: string;
  slug: string;
}

interface CommunicationAuditRow {
  id: string;
  channel_id: string | null;
  action_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function toError(error: unknown, fallback: string): Error {
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message?: unknown }).message ?? fallback));
  }
  return new Error(fallback);
}

export class CommunicationChannelIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'communication_channel';
  readonly policy = new CommunicationChannelIdentityPolicy();

  async identifierExists(identifier: string, excludeEntityId?: EntityId): Promise<boolean> {
    const normalized = this.policy.normalize(identifier);

    let query = supabase
      .from('communication_channels' as never)
      .select('id', { count: 'exact', head: true })
      .eq('slug', normalized);

    if (excludeEntityId) {
      query = query.neq('id', excludeEntityId);
    }

    const { count, error } = await query;
    if (error) throw toError(error, 'Infrastructure error checking communication channel identifier');
    return (count ?? 0) > 0;
  }

  async getExistingSimilar(identifier: string): Promise<string[]> {
    const normalized = this.policy.normalize(identifier);
    if (!normalized) return [];

    const { data, error } = await supabase
      .from('communication_channels' as never)
      .select('slug')
      .ilike('slug', `${normalized}%`)
      .limit(20);

    if (error) throw toError(error, 'Infrastructure error getting similar communication identifiers');
    const rows = (data ?? []) as Array<{ slug?: string | null }>;
    return rows.map((row) => row.slug).filter((slug): slug is string => typeof slug === 'string' && slug.length > 0);
  }

  async recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    const { error } = await insertLooseRow('communication_channel_audit', {
      channel_id: params.entityId,
      action_type: 'slug_changed',
      metadata: {
        old_slug: params.oldIdentifier,
        new_slug: params.newIdentifier,
        reason: params.reason,
      },
    });

    if (error) {
      logger.error('[CommunicationChannelIdentityAdapter] recordChange error:', error);
      throw toError(error, 'Infrastructure error recording communication slug change');
    }
  }

  async getHistory(entityId: EntityId): Promise<IdentityChangeRecord[]> {
    const { data, error } = await selectLooseRows<CommunicationAuditRow>('communication_channel_audit', {
      columns: 'id,channel_id,action_type,metadata,created_at',
      filters: [
        { op: 'eq', column: 'channel_id', value: entityId },
        { op: 'eq', column: 'action_type', value: 'slug_changed' },
      ],
      orderBy: { column: 'created_at', ascending: false },
      limit: 100,
    });

    if (error) throw toError(error, 'Infrastructure error getting communication slug history');

    return (data ?? []).map((row) => {
      const metadata = row.metadata ?? {};
      const oldIdentifier = String(metadata.old_slug ?? '');
      const newIdentifier = String(metadata.new_slug ?? '');
      const reasonRaw = metadata.reason;
      const reason: ChangeReason =
        reasonRaw === 'admin_action' ||
        reasonRaw === 'policy_violation' ||
        reasonRaw === 'territory_changed'
          ? reasonRaw
          : 'user_requested';

      return {
        id: row.id,
        entityType: 'communication_channel',
        entityId,
        oldIdentifier,
        newIdentifier,
        reason,
        changedAt: new Date(row.created_at),
      };
    });
  }

  async canChange(entityId: EntityId): Promise<CooldownResult> {
    const history = await this.getHistory(entityId);

    if (history.length === 0) {
      return { canChange: true, reason: 'first_change' };
    }

    const lastChange = history[0];
    const nextAllowedDate = new Date(lastChange.changedAt);
    nextAllowedDate.setDate(nextAllowedDate.getDate() + this.policy.cooldownDays);

    const now = new Date();
    if (now >= nextAllowedDate) return { canChange: true };

    return {
      canChange: false,
      reason: 'cooldown_active',
      nextAllowedDate,
      daysRemaining: Math.ceil((nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }

  async resolveOldIdentifier(oldIdentifier: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null> {
    const normalized = this.policy.normalize(oldIdentifier);
    const { data, error } = await selectLooseRows<CommunicationAuditRow>('communication_channel_audit', {
      columns: 'id,channel_id,action_type,metadata,created_at',
      filters: [{ op: 'eq', column: 'action_type', value: 'slug_changed' }],
      orderBy: { column: 'created_at', ascending: false },
      limit: 300,
    });

    if (error) throw toError(error, 'Infrastructure error resolving old communication identifier');

    const row = (data ?? []).find((entry) => {
      const oldSlug = entry.metadata?.old_slug;
      return typeof oldSlug === 'string' && this.policy.normalize(oldSlug) === normalized;
    });

    if (!row?.channel_id) return null;

    const { data: channels, error: channelError } = await selectLooseRows<CommunicationChannelRow>('communication_channels', {
      columns: 'id,slug',
      filters: [{ op: 'eq', column: 'id', value: row.channel_id }],
      limit: 1,
    });

    if (channelError) throw toError(channelError, 'Infrastructure error resolving current communication identifier');
    const channel = channels?.[0];
    if (!channel) return null;

    return {
      entityId: channel.id,
      currentIdentifier: channel.slug,
    };
  }
}
