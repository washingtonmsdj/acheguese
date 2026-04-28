/**
 * EducationLimitValidationService
 * 
 * Serviço para validação de limites operacionais do módulo Education.
 * Valida criação de programas, eventos e recebimento de leads contra
 * os limites definidos no nicho + plano.
 * 
 * REGRA: Todas as mutações devem validar limites antes de executar.
 */

import type { EducationNicheConfig } from '../niches/types';
import { getNicheByKey, getNicheOrDefault } from '../niches/registry';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface LimitValidationResult {
  allowed: boolean;
  error?: {
    code: 'LIMIT_REACHED' | 'NICHE_NOT_FOUND' | 'PROFILE_NOT_CONFIGURED';
    message: string;
    current: number;
    max: number;
    resource: 'program' | 'event' | 'lead';
  };
}

export interface ValidationContext {
  nicheKey: string;
  profileId: string;
  currentCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE LIMITES
// ═══════════════════════════════════════════════════════════════════════════

export const EducationLimitValidationService = {
  
  /**
   * Valida se pode criar novo programa
   */
  validateCanCreateProgram(
    nicheKey: string | null | undefined,
    currentProgramCount: number
  ): LimitValidationResult {
    if (!nicheKey) {
      return {
        allowed: false,
        error: {
          code: 'PROFILE_NOT_CONFIGURED',
          message: 'Nicho não configurado. Configure o nicho da instituição primeiro.',
          current: 0,
          max: 0,
          resource: 'program',
        },
      };
    }

    const niche = getNicheByKey(nicheKey);
    if (!niche) {
      return {
        allowed: false,
        error: {
          code: 'NICHE_NOT_FOUND',
          message: `Nicho '${nicheKey}' não encontrado.`,
          current: currentProgramCount,
          max: 0,
          resource: 'program',
        },
      };
    }

    const maxPrograms = niche.entitlements.maxPrograms;
    
    if (currentProgramCount >= maxPrograms) {
      return {
        allowed: false,
        error: {
          code: 'LIMIT_REACHED',
          message: `Limite de ${maxPrograms} programas atingido. Faça upgrade do plano para adicionar mais.`,
          current: currentProgramCount,
          max: maxPrograms,
          resource: 'program',
        },
      };
    }

    return { allowed: true };
  },

  /**
   * Valida se pode criar novo evento
   */
  validateCanCreateEvent(
    nicheKey: string | null | undefined,
    currentEventCount: number
  ): LimitValidationResult {
    if (!nicheKey) {
      return {
        allowed: false,
        error: {
          code: 'PROFILE_NOT_CONFIGURED',
          message: 'Nicho não configurado. Configure o nicho da instituição primeiro.',
          current: 0,
          max: 0,
          resource: 'event',
        },
      };
    }

    const niche = getNicheByKey(nicheKey);
    if (!niche) {
      return {
        allowed: false,
        error: {
          code: 'NICHE_NOT_FOUND',
          message: `Nicho '${nicheKey}' não encontrado.`,
          current: currentEventCount,
          max: 0,
          resource: 'event',
        },
      };
    }

    const maxEvents = niche.entitlements.maxEvents;
    
    if (currentEventCount >= maxEvents) {
      return {
        allowed: false,
        error: {
          code: 'LIMIT_REACHED',
          message: `Limite de ${maxEvents} eventos atingido. Faça upgrade do plano para adicionar mais.`,
          current: currentEventCount,
          max: maxEvents,
          resource: 'event',
        },
      };
    }

    return { allowed: true };
  },

  /**
   * Valida se pode receber novo lead
   */
  validateCanReceiveLead(
    nicheKey: string | null | undefined,
    currentLeadsThisMonth: number
  ): LimitValidationResult {
    if (!nicheKey) {
      return {
        allowed: false,
        error: {
          code: 'PROFILE_NOT_CONFIGURED',
          message: 'Nicho não configurado.',
          current: 0,
          max: 0,
          resource: 'lead',
        },
      };
    }

    const niche = getNicheByKey(nicheKey);
    if (!niche) {
      return {
        allowed: false,
        error: {
          code: 'NICHE_NOT_FOUND',
          message: `Nicho '${nicheKey}' não encontrado.`,
          current: currentLeadsThisMonth,
          max: 0,
          resource: 'lead',
        },
      };
    }

    const maxLeads = niche.entitlements.maxLeadsPerMonth;
    
    if (currentLeadsThisMonth >= maxLeads) {
      return {
        allowed: false,
        error: {
          code: 'LIMIT_REACHED',
          message: `Limite mensal de ${maxLeads} leads atingido. Faça upgrade do plano.`,
          current: currentLeadsThisMonth,
          max: maxLeads,
          resource: 'lead',
        },
      };
    }

    return { allowed: true };
  },

  /**
   * Valida múltiplos limites de uma vez
   * Útil para dashboard/overview
   */
  validateAllLimits(
    nicheKey: string | null | undefined,
    usage: {
      programCount: number;
      eventCount: number;
      leadsThisMonth: number;
    }
  ): {
    programs: LimitValidationResult;
    events: LimitValidationResult;
    leads: LimitValidationResult;
  } {
    return {
      programs: this.validateCanCreateProgram(nicheKey, usage.programCount),
      events: this.validateCanCreateEvent(nicheKey, usage.eventCount),
      leads: this.validateCanReceiveLead(nicheKey, usage.leadsThisMonth),
    };
  },

  /**
   * Retorna mensagem de erro formatada
   */
  formatErrorMessage(result: LimitValidationResult): string {
    if (result.allowed) return '';
    return result.error?.message || 'Limite atingido.';
  },

  /**
   * Retorna sugestão de upgrade baseada no erro
   */
  getUpgradeSuggestion(result: LimitValidationResult): string | null {
    if (result.allowed) return null;
    
    switch (result.error?.code) {
      case 'LIMIT_REACHED':
        return `Você está usando ${result.error.current}/${result.error.max} ${result.error.resource}s. Faça upgrade do plano para aumentar seu limite.`;
      case 'NICHE_NOT_FOUND':
        return 'Entre em contato com o suporte para configurar seu nicho corretamente.';
      case 'PROFILE_NOT_CONFIGURED':
        return 'Configure o perfil da sua instituição para começar a usar todas as funcionalidades.';
      default:
        return null;
    }
  },

  /**
   * Retorna porcentagem de uso
   */
  getUsagePercentage(current: number, max: number): number {
    if (max === 0) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  },

  /**
   * Verifica se está próximo do limite (80% ou mais)
   */
  isNearLimit(current: number, max: number, threshold = 0.8): boolean {
    if (max === 0) return false;
    return current / max >= threshold;
  },

  /**
   * Retorna status visual do uso
   */
  getUsageStatus(current: number, max: number): 'safe' | 'warning' | 'danger' {
    if (max === 0) return 'safe';
    const percentage = current / max;
    
    if (percentage >= 1) return 'danger';
    if (percentage >= 0.8) return 'warning';
    return 'safe';
  },
};

export default EducationLimitValidationService;
