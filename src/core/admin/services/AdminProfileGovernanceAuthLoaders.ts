import { profileService } from '@/core/profiles/services/ProfileService';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

import type {
  AdminProfileIdentityAuthSummary,
  AdminProfileIdentityEffectiveContext,
} from './AdminProfileGovernanceTypes';

interface AdminAuthSummaryBrokerResponse {
  summary?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export async function loadAuthSummary(userId: string): Promise<AdminProfileIdentityAuthSummary | null> {
  try {
    const { data, error } = await supabase.functions.invoke<AdminAuthSummaryBrokerResponse>(
      'admin-get-user-auth-summary',
      {
        body: { userId },
      },
    );

    if (error) {
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        'Failed to load auth summary';
      logger.error('AdminProfileGovernanceService.loadAuthSummary', { message });
      return null;
    }

    const summary = data?.summary;
    if (!isRecord(summary)) {
      if (summary !== null && summary !== undefined) {
        logger.error('AdminProfileGovernanceService.loadAuthSummary', {
          message: 'Invalid auth summary response',
        });
      }
      return null;
    }

    return {
      email: nullableString(summary.email),
      phone: nullableString(summary.phone),
      emailConfirmed: summary.emailConfirmed === true,
      createdAt: nullableString(summary.createdAt),
      lastSignInAt: nullableString(summary.lastSignInAt),
    };
  } catch (error) {
    logger.error('AdminProfileGovernanceService.loadAuthSummary', {
      message: error instanceof Error ? error.message : 'Unknown auth summary failure',
    });
    return null;
  }
}

export async function loadEffectiveContext(
  userId: string,
): Promise<AdminProfileIdentityEffectiveContext | null> {
  try {
    const context = await profileService.getProfileContext(userId);
    if (!context) return null;

    return {
      profileId: context.id,
      status: context.status,
      permissions: context.permissions,
      plan: context.plan,
      reputation: context.reputation,
      verified: context.verified,
    };
  } catch (error) {
    logger.error('AdminProfileGovernanceService.loadEffectiveContext', {
      message: error instanceof Error ? error.message : 'Unknown profile context failure',
    });
    return null;
  }
}
