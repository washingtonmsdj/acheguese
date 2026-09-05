/**
 * useEducationNicheBilling Hook
 * 
 * Hook para acesso integrado a nicho + billing.
 * Combina useEducationNiche + useEducationSubscription.
 * 
 * Regra: capability final = nicho permite AND plano permite
 */

import { useMemo } from 'react';
import { useEducationSubscription } from '../../hooks/useEducationSubscription';
import { useEducationNiche } from './useEducationNiche';
import { EducationNicheBillingIntegration } from '../services/EducationNicheBillingIntegration';
import type { 
  EducationNicheCapability,
  EducationNicheValidationResult 
} from '../types';
import { PlanTier } from '@/core/billing/types';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useEducationNicheBilling(options: UseEducationNicheBillingOptions) {
  const { nicheKey, businessId, enabled = true } = options;
  
  // Hooks base
  const nicheData = useEducationNiche(nicheKey);
  const subscriptionData = useEducationSubscription({ 
    businessId, 
    enabled: enabled && Boolean(businessId) 
  });
  
  // Contexto combinado
  const context = useMemo(() => {
    if (!nicheKey || !subscriptionData.planType) return null;
    
    // Mapeia planType string para PlanTier enum
    const planTier = mapPlanTypeToTier(subscriptionData.planType);
    
    return {
      nicheKey,
      planTier,
      businessId,
    };
  }, [nicheKey, subscriptionData.planType, businessId]);
  
  // Calcula limites operacionais
  const limits = useMemo((): OperationalLimitsCheck | null => {
    if (!context || !nicheData.config) return null;
    // Combina com limites do nicho
    const niche = nicheData.config;
    
    return {
      programs: {
        current: 0,
        max: niche.entitlements.maxPrograms,
        canCreate: false, // Calculado via checkCanCreateProgram
        upgradeRequired: false,
      },
      events: {
        current: 0,
        max: niche.entitlements.maxEvents,
        canCreate: false,
        upgradeRequired: false,
      },
      leads: {
        current: 0,
        max: niche.entitlements.maxLeadsPerMonth,
        canReceive: false,
        upgradeRequired: false,
      },
    };
  }, [context, nicheData.config, subscriptionData]);
  
  // Helpers de capability
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
  
  // Verificações específicas
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
  
  // Validação de ações
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
  
  // Calcula limites com uso atual
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
  
  // Estado combinado
  const isReady = Boolean(nicheData.config && subscriptionData.status);
  const hasErrors = nicheData.config === null || subscriptionData.isError;
  
  return {
    // Dados base
    niche: nicheData,
    subscription: subscriptionData,
    
    // Estado
    isReady,
    isLoading: nicheData.config === undefined || subscriptionData.isLoading,
    hasErrors,
    
    // Helpers de capability
    can,
    
    // Verificações operacionais
    checkCanCreateProgram,
    checkCanCreateEvent,
    checkCanReceiveLead,
    calculateLimits,
    
    // Validação
    validateAction,
    
    // Limites base (sem uso)
    limits,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function mapPlanTypeToTier(planType: string): PlanTier {
  switch (planType.toLowerCase()) {
    case 'free':
      return PlanTier.FREE;
    case 'basic':
      return PlanTier.PRO;
    case 'pro':
    case 'premium':
      return PlanTier.PRO;
    case 'delivery':
      return PlanTier.DELIVERY;
    case 'enterprise':
      return PlanTier.PRO;
    default:
      return PlanTier.FREE;
  }
}

export default useEducationNicheBilling;
