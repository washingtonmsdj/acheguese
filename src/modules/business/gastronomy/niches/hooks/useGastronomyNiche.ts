/**
 * 🍽️ useGastronomyNiche HOOK
 *
 * Hook para acesso a configurações de nichos gastronômicos em componentes React.
 *
 * @version 1.0.0
 */

import { useMemo, useCallback } from 'react';
import type {
  GastronomyNicheConfig,
  NicheCapability,
  AdminSection,
  NicheFilters,
} from '../types';
import { NicheConfigService } from '../services/NicheConfigService';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface UseGastronomyNicheOptions {
  /** Key do nicho selecionado */
  nicheKey?: string | null;
  /** Habilitar logs de debug */
  debug?: boolean;
}

export interface UseGastronomyNicheReturn {
  // Configuração atual
  config: GastronomyNicheConfig;
  isLoading: boolean;
  error: Error | null;

  // Status
  isEnabled: boolean;
  isPublic: boolean;
  isSelectable: boolean;
  isBeta: boolean;
  isComplex: boolean;
  canUseNow: boolean;

  // Capacidades
  capabilities: NicheCapability[];
  hasCapability: (capability: NicheCapability) => boolean;
  missingCapabilities: NicheCapability[];

  // Admin
  adminSections: AdminSection[];
  shouldShowSection: (section: AdminSection) => boolean;
  sectionVisibility: (section: AdminSection) => {
    isVisible: boolean;
    isEnabled: boolean;
    requiresImplementation: boolean;
  };

  // Configurações
  defaultConfig: Record<string, unknown>;
  suggestedCategories: string[];
  suggestedItems: string[];

  // Helpers
  validateItem: (item: unknown) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook principal para acesso a configurações de nicho.
 *
 * Exemplo de uso:
 * ```tsx
 * const { config, hasCapability, shouldShowSection } = useGastronomyNiche({
 *   nicheKey: 'pizza',
 * });
 *
 * if (hasCapability('pizza_half_half')) {
 *   // Mostrar seletor de meio a meio
 * }
 * ```
 */
export function useGastronomyNiche(
  options: UseGastronomyNicheOptions = {},
): UseGastronomyNicheReturn {
  const { nicheKey, debug = false } = options;

  // Memoizar configuração para evitar re-renders desnecessários
  const config = useMemo(() => {
    if (debug) {
      console.log('[useGastronomyNiche] Carregando config para:', nicheKey);
    }
    return NicheConfigService.getConfigOrDefault(nicheKey);
  }, [nicheKey, debug]);

  // Status memoizados
  const status = useMemo(() => ({
    isEnabled: NicheConfigService.isEnabled(config.nicheKey),
    isPublic: config.isPublic,
    isSelectable: config.isSelectable,
    isBeta: config.isBeta,
    isComplex: NicheConfigService.isComplex(config.nicheKey),
    canUseNow: config.supportLevel === 'full_enabled' || config.supportLevel === 'basic_enabled',
  }), [config]);

  // Seções de admin memoizadas
  const adminSections = useMemo(() => NicheConfigService.getAdminSections(config.nicheKey), [config]);

  // Configurações padrão memoizadas
  const defaultConfigs = useMemo(() => ({
    config: NicheConfigService.getDefaultConfig(config.nicheKey),
    categories: NicheConfigService.getSuggestedCategories(config.nicheKey),
    items: NicheConfigService.getSuggestedItems(config.nicheKey),
  }), [config]);

  // Função de validação memoizada
  const validateItem = useCallback(
    (item: unknown) => {
      const result = NicheConfigService.validateForNiche(config.nicheKey, item);
      return {
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
      };
    },
    [config],
  );

  // Verificação de capacidade - memoizada
  const hasCapability = useCallback(
    (capability: NicheCapability) => NicheConfigService.hasCapability(config.nicheKey, capability),
    [config],
  );

  // Verificação de seção admin - memoizada
  const shouldShowSection = useCallback(
    (section: AdminSection) => NicheConfigService.shouldShowAdminSection(config.nicheKey, section),
    [config],
  );

  // Visibilidade de seção - memoizada
  const sectionVisibility = useCallback(
    (section: AdminSection) => NicheConfigService.getSectionVisibility(config.nicheKey, section),
    [config],
  );

  return {
    // Config
    config,
    isLoading: false,
    error: null,

    // Status
    isEnabled: status.isEnabled,
    isPublic: status.isPublic,
    isSelectable: status.isSelectable,
    isBeta: status.isBeta,
    isComplex: status.isComplex,
    canUseNow: status.canUseNow,

    // Capabilities
    capabilities: config.enabledCapabilities,
    hasCapability,
    missingCapabilities: config.missingCapabilities,

    // Admin
    adminSections,
    shouldShowSection,
    sectionVisibility,

    // Configs
    defaultConfig: defaultConfigs.config,
    suggestedCategories: defaultConfigs.categories,
    suggestedItems: defaultConfigs.items,

    // Validation
    validateItem,
  };
}

// ── Hooks Especializados ──────────────────────────────────────────────────────

/**
 * Hook para listar nichos disponíveis.
 */
export function useNicheList(filters?: NicheFilters) {
  return useMemo(() => NicheConfigService.filter(filters), [filters]);
}

/**
 * Hook para listar nichos selecionáveis (públicos).
 */
export function useSelectableNiches() {
  return useMemo(() => NicheConfigService.getSelectable(), []);
}

/**
 * Hook para verificar se uma seção específica deve ser exibida.
 */
export function useAdminSectionVisibility(nicheKey: string, section: AdminSection) {
  return useMemo(
    () => NicheConfigService.getSectionVisibility(nicheKey, section),
    [nicheKey, section],
  );
}

/**
 * Hook para validar itens contra regras do nicho.
 */
export function useNicheValidation(nicheKey: string) {
  return useCallback(
    (item: unknown) => NicheConfigService.validateForNiche(nicheKey, item),
    [nicheKey],
  );
}
