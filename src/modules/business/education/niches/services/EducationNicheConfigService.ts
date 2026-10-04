/**
 * EducationNicheConfigService
 *
 * Serviço para leitura e validação de configuração de nichos.
 * Sem acesso direto à UI, sem dependência de componente.
 */

import type {
  EducationNicheConfig,
  EducationNicheCapability,
  EducationAdminSection,
  EducationNicheValidationResult,
} from '../types';
import {
  getNicheByKey,
  getNicheOrDefault,
  hasCapability,
  shouldShowAdminSection,
  listNiches,
} from '../registry';

export const EducationNicheConfigService = {
  /** Lê configuração de nicho por chave. */
  getConfig(nicheKey: string): EducationNicheConfig {
    return getNicheOrDefault(nicheKey);
  },

  /** Lista nichos com filtros opcionais. */
  listNiches(filters?: Parameters<typeof listNiches>[0]) {
    return listNiches(filters);
  },

  /** Verifica se o nicho possui o recurso. */
  hasCapability(
    nicheKey: string,
    capability: EducationNicheCapability,
  ): boolean {
    return hasCapability(nicheKey, capability);
  },

  /** Verifica se a seção administrativa deve ser exibida. */
  shouldShowSection(
    nicheKey: string,
    section: EducationAdminSection,
  ): boolean {
    return shouldShowAdminSection(nicheKey, section);
  },

  /** Valida payload para um nicho específico. */
  validateForNiche(
    nicheKey: string,
    payload: Record<string, unknown>,
  ): EducationNicheValidationResult {
    const niche = getNicheByKey(nicheKey);
    const errors: string[] = [];

    if (!niche) {
      errors.push(`Nicho '${nicheKey}' não existe`);
    }

    // Validações específicas por nicho podem ser adicionadas aqui.
    void payload;

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Resolve recursos efetivos considerando nicho + entitlements.
   * Os entitlements são verificados via Billing no hook/componente.
   */
  getEffectiveCapabilities(nicheKey: string): EducationNicheCapability[] {
    const niche = getNicheByKey(nicheKey);
    if (!niche) return [];
    return niche.enabledCapabilities;
  },

  /** Verifica se o nicho está habilitado para uso. */
  isEnabled(nicheKey: string): boolean {
    const niche = getNicheByKey(nicheKey);
    if (!niche) return false;
    return ['full_enabled', 'basic_enabled'].includes(niche.supportLevel);
  },
};
