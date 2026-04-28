/**
 * useEducationNiche Hook
 * 
 * Hook para acesso a configuracao de nicho em componentes React.
 */

import { useMemo } from 'react';
import type { 
  EducationNicheConfig, 
  EducationNicheCapability,
  EducationAdminSection,
  EducationNicheValidationResult 
} from '../types';
import { EducationNicheConfigService } from '../services/EducationNicheConfigService';

interface UseEducationNicheReturn {
  config: EducationNicheConfig | null;
  hasCapability: (capability: EducationNicheCapability) => boolean;
  adminSections: EducationAdminSection[];
  shouldShowSection: (section: EducationAdminSection) => boolean;
  validateForNiche: (payload: Record<string, unknown>) => EducationNicheValidationResult;
  isEnabled: boolean;
  isPublic: boolean;
  isBeta: boolean;
  canUseNow: boolean;
}

export function useEducationNiche(nicheKey: string | null | undefined): UseEducationNicheReturn {
  const config = useMemo(() => {
    if (!nicheKey) return null;
    return EducationNicheConfigService.getConfig(nicheKey);
  }, [nicheKey]);

  const hasCapability = useMemo(() => {
    return (capability: EducationNicheCapability): boolean => {
      if (!nicheKey) return false;
      return EducationNicheConfigService.hasCapability(nicheKey, capability);
    };
  }, [nicheKey]);

  const shouldShowSection = useMemo(() => {
    return (section: EducationAdminSection): boolean => {
      if (!nicheKey) return false;
      return EducationNicheConfigService.shouldShowSection(nicheKey, section);
    };
  }, [nicheKey]);

  const validateForNiche = useMemo(() => {
    return (payload: Record<string, unknown>): EducationNicheValidationResult => {
      if (!nicheKey) {
        return { isValid: false, errors: ['Nicho nao especificado'] };
      }
      return EducationNicheConfigService.validateForNiche(nicheKey, payload);
    };
  }, [nicheKey]);

  return {
    config,
    hasCapability,
    adminSections: config?.adminSections ?? [],
    shouldShowSection,
    validateForNiche,
    isEnabled: config ? ['full_enabled', 'basic_enabled'].includes(config.supportLevel) : false,
    isPublic: config?.isPublic ?? false,
    isBeta: config?.isBeta ?? false,
    canUseNow: config ? ['full_enabled', 'basic_enabled'].includes(config.supportLevel) && config.isPublic : false,
  };
}
