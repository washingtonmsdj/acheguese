/**
 * useEducationNicheBilling Hook
 *
 * Hook para acesso integrado a nicho + billing.
 * Combina useEducationNiche + useEducationSubscription.
 *
 * Regra: capability final = nicho permite AND plano permite.
 * O tier usado para autorização vem diretamente do Billing canônico.
 */

import { useMemo } from 'react';
import { useEducationSubscription } from '../../hooks/useEducationSubscription';
import { useEducationNiche } from './useEducationNiche';
import { EducationNicheBillingIntegration } from '../services/EducationNicheBillingIntegration';
import type {
  EducationNicheCapability,
  EducationNicheValidationResult
} from '../types';

export interface UseEducationNicheBillingOptions {
  nicheKey: string | null | undefined;
  businessId: string;
  enabled?: boolean;
}

export interface CapabilityCheck {
  allowed: boolean;
  reason: 'allowed' | 'niche_denied' | 'plan_denied' | 'inactive' | 'unknown';
  upgradeMessage: string;
}

export interface OperationalLimitsCheck {
  programs: {
    current: number;
    max: number;
    canCreate: boolean;
    upgradeRequired: boolean;
  };
  events: {
    current: number;
    max: number;
    canCreate: boolean;
    upgradeRequired: boolean;
  };
  leads: {
    current: number;
    max: number;
    canReceive: boolean;
    upgradeRequired: boolean;
  };
}

export function useEducationNicheBilling(options: UseEducationNicheBillingOptions) {
  const { nicheKey, businessId, enabled = true } = options;

  const nicheData = useEducationNiche(nicheKey);
  const subscriptionData = useEducationSubscription({
    businessId,
    enabled: enabled && Boolean(businessId)
  });

  const context = useMemo(() => {
    if (!nicheKey || !subscriptionData.status) return null;

    return {
      nicheKey,
      planTier: subscriptionData.status.planTier,
      businessId,
    };
  }, [nicheKey, subscriptionData.status, businessId]);

  const can = useMemo(() => {
    return (capability: EducationNicheCapability): CapabilityCheck => {
      if (!context) {
        return {
          allowed: false,
          reason: 'inactive',
          upgradeMessage: 'Nicho ou plano não configurado.',
        };
      }

      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        context,
        capability
      );

      return {
        allowed: result.allowed,
        reason: result.reason,
        upgradeMessage: EducationNicheBillingIntegration.getUpgradeMessage(
          result.reason,
          capability
        ),
      };
    };
  }, [context]);

  const checkCanCreateProgram = useMemo(() => {
    return (currentCount: number): { allowed: boolean; reason?: string } => {
      if (!context) return { allowed: false, reason: 'Nicho ou plano não configurado' };
      return EducationNicheBillingIntegration.canCreateProgram(context, currentCount);
    };
  }, [context]);

  const checkCanCreateEvent = useMemo(() => {
    return (currentCount: number): { allowed: boolean; reason?: string } => {
      if (!context) return { allowed: false, reason: 'Nicho ou plano não configurado' };
      return EducationNicheBillingIntegration.canCreateEvent(context, currentCount);
    };
  }, [context]);

  const checkCanReceiveLead = useMemo(() => {
    return (currentCount: number): { allowed: boolean; reason?: string } => {
      if (!context) return { allowed: false, reason: 'Nicho ou plano não configurado' };
      return EducationNicheBillingIntegration.canReceiveLead(context, currentCount);
    };
  }, [context]);

  const validateAction = useMemo(() => {
    return (
      action: 'create_program' | 'create_event' | 'receive_lead' | 'view_analytics' | 'export_data',
      payload?: Record<string, unknown>
    ): EducationNicheValidationResult => {
      if (!context) {
        return { isValid: false, errors: ['Nicho ou plano não configurado'] };
      }
      return EducationNicheBillingIntegration.validateAction(context, action, payload);
    };
  }, [context]);

  const calculateLimits = useMemo(() => {
    return (usage: {
      programCount: number;
      eventCount: number;
      leadsThisMonth: number;
    }): OperationalLimitsCheck | null => {
      if (!context) return null;

      const opLimits = EducationNicheBillingIntegration.getOperationalLimits(context, usage);

      return {
        programs: {
          ...opLimits.programs,
          upgradeRequired: !opLimits.programs.canCreate,
        },
        events: {
          ...opLimits.events,
          upgradeRequired: !opLimits.events.canCreate,
        },
        leads: {
          ...opLimits.leads,
          upgradeRequired: !opLimits.leads.canReceive,
        },
      };
    };
  }, [context]);

  const isReady = Boolean(nicheData.config && subscriptionData.status);
  const hasErrors = nicheData.config === null || subscriptionData.isError;

  return {
    niche: nicheData,
    subscription: subscriptionData,
    isReady,
    isLoading: nicheData.config === undefined || subscriptionData.isLoading,
    hasErrors,
    can,
    checkCanCreateProgram,
    checkCanCreateEvent,
    checkCanReceiveLead,
    calculateLimits,
    validateAction,
  };
}

export default useEducationNicheBilling;
