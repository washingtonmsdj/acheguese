/**
 * EducationNicheConfigService
 * 
 * Service para leitura e validacao de configuracao de nichos.
 * Sem acesso direto a UI, sem dependencia de componente.
 */

import type { 
  EducationNicheConfig, 
  EducationNicheCapability,
  EducationAdminSection,
  EducationNicheValidationResult 
} from '../types';
import { 
  getNicheByKey, 
  getNicheOrDefault, 
  hasCapability, 
  shouldShowAdminSection,
  listNiches 
} from '../registry';

export const EducationNicheConfigService = {
  /**
   * Le configuracao de nicho por key
   */
  getConfig(nicheKey: string): EducationNicheConfig {
    return getNicheOrDefault(nicheKey);
  },

  /**
   * Lista nichos com filtros opcionais
   */
  listNiches(filters?: Parameters<typeof listNiches>[0]) {
    return listNiches(filters);
  },

  /**
   * Verifica se nicho possui capability
   */
  hasCapability(nicheKey: string, capability: EducationNicheCapability): boolean {
    return hasCapability(nicheKey, capability);
  },

  /**
   * Verifica se secao admin deve ser exibida
   */
  shouldShowSection(nicheKey: string, section: EducationAdminSection): boolean {
    return shouldShowAdminSection(nicheKey, section);
  },

  /**
   * Valida payload para nicho especifico
   */
  validateForNiche(
    nicheKey: string, 
    payload: Record<string, unknown>
  ): EducationNicheValidationResult {
    const niche = getNicheByKey(nicheKey);
    const errors: string[] = [];

    if (!niche) {
      errors.push(`Nicho '${nicheKey}' nao existe`);
    }

    // Validacoes especificas por nicho podem ser adicionadas aqui
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Resolve capabilities efetivas considerando nicho + entitlements
   * (entitlements serao verificados via billing no hook/component)
   */
  getEffectiveCapabilities(nicheKey: string): EducationNicheCapability[] {
    const niche = getNicheByKey(nicheKey);
    if (!niche) return [];
    return niche.enabledCapabilities;
  },

  /**
   * Verifica se nicho esta habilitado para uso
   */
  isEnabled(nicheKey: string): boolean {
    const niche = getNicheByKey(nicheKey);
    if (!niche) return false;
    return ['full_enabled', 'basic_enabled'].includes(niche.supportLevel);
  },
};
