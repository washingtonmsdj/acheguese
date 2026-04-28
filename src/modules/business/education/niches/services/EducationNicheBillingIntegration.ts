/**
 * EducationNicheBillingIntegration
 * 
 * Serviço para integração entre nicho education e billing.
 * Regra canônica: capability final = nicho permite AND plano permite
 * 
 * SSOT: Única fonte para resolver capabilities efetivas considerando ambos os contextos.
 */

import type { 
  EducationNicheConfig, 
  EducationNicheCapability,
  EducationNicheValidationResult 
} from '../types';
import { 
  getNicheByKey, 
  getNicheOrDefault,
  canCreateProgram as canCreateProgramNiche,
  canCreateEvent as canCreateEventNiche,
  canReceiveLead as canReceiveLeadNiche,
} from '../registry';
import { EntitlementsService } from '@/core/billing/entitlements';
import { PlanTier } from '@/core/billing/types';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface NicheBillingContext {
  nicheKey: string;
  planTier: PlanTier;
  businessId: string;
}

export interface EffectiveCapabilityResult {
  allowed: boolean;
  reason: 'allowed' | 'niche_denied' | 'plan_denied' | 'inactive';
  nicheHas: boolean;
  planAllows: boolean;
}

export interface OperationalLimits {
  programs: {
    max: number;
    current: number;
    canCreate: boolean;
  };
  events: {
    max: number;
    current: number;
    canCreate: boolean;
  };
  leads: {
    max: number;
    current: number;
    canReceive: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVIÇO
// ═══════════════════════════════════════════════════════════════════════════

export const EducationNicheBillingIntegration = {
  
  /**
   * Resolve capability efetiva considerando nicho + plano
   * Regra: capability final = nicho permite AND plano permite
   */
  resolveEffectiveCapability(
    context: NicheBillingContext,
    capability: EducationNicheCapability
  ): EffectiveCapabilityResult {
    const { nicheKey, planTier } = context;
    
    // Verifica se nicho permite
    const niche = getNicheByKey(nicheKey);
    const nicheHas = niche?.enabledCapabilities.includes(capability) ?? false;
    
    // Verifica se plano permite (por padrão, planos pagos permitem tudo do education)
    const planAllows = this.planAllowsEducationCapability(planTier, capability);
    
    // Capability efetiva = nicho AND plano
    const allowed = nicheHas && planAllows;
    
    let reason: EffectiveCapabilityResult['reason'];
    if (!allowed) {
      if (!nicheHas) reason = 'niche_denied';
      else if (!planAllows) reason = 'plan_denied';
      else reason = 'inactive';
    } else {
      reason = 'allowed';
    }
    
    return {
      allowed,
      reason,
      nicheHas,
      planAllows,
    };
  },

  /**
   * Verifica se múltiplas capabilities são permitidas
   */
  resolveMultipleCapabilities(
    context: NicheBillingContext,
    capabilities: EducationNicheCapability[]
  ): Record<EducationNicheCapability, EffectiveCapabilityResult> {
    const results = {} as Record<EducationNicheCapability, EffectiveCapabilityResult>;
    
    for (const capability of capabilities) {
      results[capability] = this.resolveEffectiveCapability(context, capability);
    }
    
    return results;
  },

  /**
   * Verifica se plano permite capability específica de education
   * Plano FREE: capabilities básicas apenas
   * Plano PRO+: todas as capabilities
   */
  planAllowsEducationCapability(planTier: PlanTier, capability: EducationNicheCapability): boolean {
    // Capabilities básicas disponíveis em todos os planos
    const basicCapabilities: EducationNicheCapability[] = [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'whatsapp_cta',
      'analytics_basic',
    ];
    
    // Se é capability básica, todos os planos permitem
    if (basicCapabilities.includes(capability)) {
      return true;
    }
    
    // Capabilities avançadas requerem plano pago
    switch (planTier) {
      case PlanTier.FREE:
        return false;
      case PlanTier.BASIC:
        // Basic permite mais que free, mas não tudo
        return !this.isPremiumCapability(capability);
      case PlanTier.PRO:
      case PlanTier.DELIVERY:
      case PlanTier.ENTERPRISE:
        return true;
      default:
        return false;
    }
  },

  /**
   * Verifica se capability é considerada premium
   */
  isPremiumCapability(capability: EducationNicheCapability): boolean {
    const premiumCapabilities: EducationNicheCapability[] = [
      'document_upload_pre_enrollment',
      'guardian_portal_basic',
      'attendance_tracking',
      'gradebook',
      'transport_tracking',
      'payment_installments',
      'analytics_advanced',
    ];
    
    return premiumCapabilities.includes(capability);
  },

  /**
   * Verifica se pode criar programa considerando nicho + plano + uso atual
   */
  canCreateProgram(
    context: NicheBillingContext,
    currentProgramCount: number
  ): { allowed: boolean; reason?: string } {
    const { nicheKey } = context;
    
    // Verifica limite do nicho
    const nicheAllows = canCreateProgramNiche(nicheKey, currentProgramCount);
    if (!nicheAllows) {
      return { 
        allowed: false, 
        reason: 'Limite de programas do nicho atingido. Faça upgrade do plano ou entre em contato.' 
      };
    }
    
    return { allowed: true };
  },

  /**
   * Verifica se pode criar evento considerando nicho + uso atual
   */
  canCreateEvent(
    context: NicheBillingContext,
    currentEventCount: number
  ): { allowed: boolean; reason?: string } {
    const { nicheKey } = context;
    
    const nicheAllows = canCreateEventNiche(nicheKey, currentEventCount);
    if (!nicheAllows) {
      return { 
        allowed: false, 
        reason: 'Limite de eventos do nicho atingido. Faça upgrade do plano ou entre em contato.' 
      };
    }
    
    return { allowed: true };
  },

  /**
   * Verifica se pode receber lead considerando nicho + uso atual
   */
  canReceiveLead(
    context: NicheBillingContext,
    currentLeadsThisMonth: number
  ): { allowed: boolean; reason?: string } {
    const { nicheKey } = context;
    
    const nicheAllows = canReceiveLeadNiche(nicheKey, currentLeadsThisMonth);
    if (!nicheAllows) {
      return { 
        allowed: false, 
        reason: 'Limite mensal de leads atingido. Faça upgrade do plano.' 
      };
    }
    
    return { allowed: true };
  },

  /**
   * Retorna limites operacionais combinados
   */
  getOperationalLimits(
    context: NicheBillingContext,
    currentUsage: {
      programCount: number;
      eventCount: number;
      leadsThisMonth: number;
    }
  ): OperationalLimits {
    const { nicheKey } = context;
    const niche = getNicheOrDefault(nicheKey);
    
    return {
      programs: {
        max: niche.entitlements.maxPrograms,
        current: currentUsage.programCount,
        canCreate: canCreateProgramNiche(nicheKey, currentUsage.programCount),
      },
      events: {
        max: niche.entitlements.maxEvents,
        current: currentUsage.eventCount,
        canCreate: canCreateEventNiche(nicheKey, currentUsage.eventCount),
      },
      leads: {
        max: niche.entitlements.maxLeadsPerMonth,
        current: currentUsage.leadsThisMonth,
        canReceive: canReceiveLeadNiche(nicheKey, currentUsage.leadsThisMonth),
      },
    };
  },

  /**
   * Valida ação para nicho + plano
   */
  validateAction(
    context: NicheBillingContext,
    action: 'create_program' | 'create_event' | 'receive_lead' | 'view_analytics' | 'export_data',
    payload?: Record<string, unknown>
  ): EducationNicheValidationResult {
    const errors: string[] = [];
    
    // Validações específicas por ação
    switch (action) {
      case 'view_analytics': {
        const niche = getNicheByKey(context.nicheKey);
        if (!niche?.entitlements.allowsAnalytics) {
          errors.push('Analytics não disponível para este nicho.');
        }
        if (!EntitlementsService.canUseBasicAnalytics(context.planTier)) {
          errors.push('Plano atual não permite analytics. Faça upgrade.');
        }
        break;
      }
      
      case 'export_data': {
        const niche = getNicheByKey(context.nicheKey);
        if (!niche?.entitlements.allowsExport) {
          errors.push('Exportação não disponível para este nicho.');
        }
        if (!EntitlementsService.canExportReports(context.planTier)) {
          errors.push('Plano atual não permite exportação. Faça upgrade.');
        }
        break;
      }
      
      default:
        // Ações com verificação específica via métodos dedicados
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Retorna mensagem de upgrade apropriada
   */
  getUpgradeMessage(reason: EffectiveCapabilityResult['reason'], capability: string): string {
    switch (reason) {
      case 'niche_denied':
        return `A funcionalidade "${capability}" não está disponível para o nicho atual.`;
      case 'plan_denied':
        return `A funcionalidade "${capability}" requer um plano pago. Faça upgrade para ativar.`;
      case 'inactive':
        return `Funcionalidade temporariamente indisponível. Entre em contato com o suporte.`;
      default:
        return '';
    }
  },
};

export default EducationNicheBillingIntegration;
