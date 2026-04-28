/**
 * useEducationLimits Hook
 * 
 * Hook para validação de limites operacionais do módulo Education.
 * Fornece helpers para verificar se pode criar programas, eventos e receber leads.
 */

import { useMemo } from 'react';
import { EducationLimitValidationService } from '../services/EducationLimitValidationService';
import type { LimitValidationResult } from '../services/EducationLimitValidationService';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface UseEducationLimitsOptions {
  nicheKey: string | null | undefined;
  usage: {
    programCount: number;
    eventCount: number;
    leadsThisMonth: number;
  };
}

export interface UseEducationLimitsReturn {
  // Validações individuais
  canCreateProgram: LimitValidationResult;
  canCreateEvent: LimitValidationResult;
  canReceiveLead: LimitValidationResult;
  
  // Status de uso
  programUsage: {
    current: number;
    max: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
  };
  eventUsage: {
    current: number;
    max: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
  };
  leadUsage: {
    current: number;
    max: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
  };
  
  // Helpers
  hasAnyLimitReached: boolean;
  nearLimitResources: ('programs' | 'events' | 'leads')[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useEducationLimits(options: UseEducationLimitsOptions): UseEducationLimitsReturn {
  const { nicheKey, usage } = options;

  const validations = useMemo(() => {
    return EducationLimitValidationService.validateAllLimits(nicheKey, usage);
  }, [nicheKey, usage]);

  const usageStats = useMemo(() => {
    const niche = nicheKey ? EducationLimitValidationService['getNicheByKey']?.(nicheKey) : null;
    
    // Fallback - se não conseguir obter o nicho, usa valores padrão
    const maxPrograms = validations.programs.error?.max ?? 20;
    const maxEvents = validations.events.error?.max ?? 10;
    const maxLeads = validations.leads.error?.max ?? 500;

    return {
      programs: {
        current: usage.programCount,
        max: maxPrograms,
        percentage: EducationLimitValidationService.getUsagePercentage(usage.programCount, maxPrograms),
        status: EducationLimitValidationService.getUsageStatus(usage.programCount, maxPrograms),
      },
      events: {
        current: usage.eventCount,
        max: maxEvents,
        percentage: EducationLimitValidationService.getUsagePercentage(usage.eventCount, maxEvents),
        status: EducationLimitValidationService.getUsageStatus(usage.eventCount, maxEvents),
      },
      leads: {
        current: usage.leadsThisMonth,
        max: maxLeads,
        percentage: EducationLimitValidationService.getUsagePercentage(usage.leadsThisMonth, maxLeads),
        status: EducationLimitValidationService.getUsageStatus(usage.leadsThisMonth, maxLeads),
      },
    };
  }, [usage, validations, nicheKey]);

  const hasAnyLimitReached = useMemo(() => {
    return !validations.programs.allowed || 
           !validations.events.allowed || 
           !validations.leads.allowed;
  }, [validations]);

  const nearLimitResources = useMemo(() => {
    const near: ('programs' | 'events' | 'leads')[] = [];
    
    if (EducationLimitValidationService.isNearLimit(usage.programCount, usageStats.programs.max)) {
      near.push('programs');
    }
    if (EducationLimitValidationService.isNearLimit(usage.eventCount, usageStats.events.max)) {
      near.push('events');
    }
    if (EducationLimitValidationService.isNearLimit(usage.leadsThisMonth, usageStats.leads.max)) {
      near.push('leads');
    }
    
    return near;
  }, [usage, usageStats]);

  return {
    canCreateProgram: validations.programs,
    canCreateEvent: validations.events,
    canReceiveLead: validations.leads,
    programUsage: usageStats.programs,
    eventUsage: usageStats.events,
    leadUsage: usageStats.leads,
    hasAnyLimitReached,
    nearLimitResources,
  };
}

export default useEducationLimits;
