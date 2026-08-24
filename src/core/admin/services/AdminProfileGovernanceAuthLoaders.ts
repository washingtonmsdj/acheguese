import { profileService } from '@/core/profiles/services/ProfileService';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

import type {
  AdminProfileIdentityAuthSummary,
  AdminProfileIdentityEffectiveContext,
} from './AdminProfileGovernanceTypes';

interface AdminAuthSummaryBrokerResponse {
  summary?: {
    email?: string | null;
    phone?: string | null;
    emailConfirmed?: boolean;
    createdAt?: string | null;
    lastSignInAt?: string | null;
  } | null;
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
      logger.error('AdminProfileGovernanceService.loadAuthSummary', error);
      return null;
    }

    const summary = data?.summary;
    if (!summary) {
      return null;
    }

    return {
      email: summary.email ?? null,
      phone: summary.phone ?? null,
      emailConfirmed: summary.emailConfirmed === true,
      createdAt: summary.createdAt ?? null,
      lastSignInAt: summary.lastSignInAt ?? null,
    };
  } catch (error) {
    logger.error('AdminProfileGovernanceService.loadAuthSummary', error);
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
    logger.error('AdminProfileGovernanceService.loadEffectiveContext', error);
    return null;
  }
}
