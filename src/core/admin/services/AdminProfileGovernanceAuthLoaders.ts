import { profileService } from '@/core/profiles/services/ProfileService';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

import type {
  AdminProfileIdentityAuthSummary,
  AdminProfileIdentityEffectiveContext,
} from './AdminProfileGovernanceTypes';

export async function loadAuthSummary(userId: string): Promise<AdminProfileIdentityAuthSummary | null> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-get-user-auth-summary', {
      body: { userId },
    });

    if (error) {
      logger.error('AdminProfileGovernanceService.loadAuthSummary', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      email: data.email ?? null,
      phone: data.phone ?? null,
      emailConfirmed: Boolean(data.email_confirmed_at),
      createdAt: data.created_at ?? null,
      lastSignInAt: data.last_sign_in_at ?? null,
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
