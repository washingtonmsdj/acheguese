/**
 * 🍽️ NICHE CONFIG SERVICE
 *
 * Serviço canônico para gerenciamento de configurações de nichos gastronômicos.
 *
 * SSOT para:
 * - Leitura de configurações de nicho
 * - Validação de nichos
 * - Filtros e listagens
 * - Renderização condicional de seções
 *
 * @version 1.0.0
 */

import type {
  GastronomyNicheConfig,
  NicheFilters,
  NicheStatus,
  NicheCapability,
  AdminSection,
  NicheValidationResult,
} from '../types';

import {
  GASTRONOMY_NICHE_REGISTRY,
  getNicheByKey,
  getAllNiches,
  listNiches,
  getSelectableNiches,
  getPublicNiches,
  getAdminNiches,
  getBetaNiches,
  getFullEnabledNiches,
  getBasicEnabledNiches,
  nicheExists,
  hasCapability,
  isComplexNiche,
  shouldShowAdminSection,
  getNicheOrDefault,
  DEFAULT_NICHE_KEY,
} from '../registry';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface AdminSectionVisibility {
  section: AdminSection;
  isVisible: boolean;
  isEnabled: boolean;      // Habilitado no nicho atual
  requiresImplementation: boolean; // Precisa ser implementado
}

export interface NicheDashboardInfo {
  niche: GastronomyNicheConfig;
  statusLabel: string;
  statusColor: string;
  canUseNow: boolean;
  needsSetup: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const NicheConfigService = {
  // ══════════════════════════════════════════════════════════════════════════
  // LEITURA
  // ══════════════════════════════════════════════════════════════════════════

  /** Obtém config de um nicho pelo key */
  getConfig(key: string): GastronomyNicheConfig | null {
    return getNicheByKey(key);
  },

  /** Obtém config ou retorna padrão */
  getConfigOrDefault(key?: string | null): GastronomyNicheConfig {
    return getNicheOrDefault(key);
  },

  /** Verifica se um nicho existe no registro */
  exists(key: string): boolean {
    return nicheExists(key);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LISTAGEM
  // ══════════════════════════════════════════════════════════════════════════

  /** Todos os nichos */
  getAll(): GastronomyNicheConfig[] {
    return getAllNiches();
  },

  /** Nichos disponíveis para seleção pública */
  getSelectable(): GastronomyNicheConfig[] {
    return getSelectableNiches();
  },

  /** Nichos visíveis publicamente */
  getPublic(): GastronomyNicheConfig[] {
    return getPublicNiches();
  },

  /** Nichos disponíveis no admin */
  getAdminAvailable(): GastronomyNicheConfig[] {
    return getAdminNiches();
  },

  /** Nichos em beta */
  getBeta(): GastronomyNicheConfig[] {
    return getBetaNiches();
  },

  /** Nichos completos */
  getFullEnabled(): GastronomyNicheConfig[] {
    return getFullEnabledNiches();
  },

  /** Nichos básicos */
  getBasicEnabled(): GastronomyNicheConfig[] {
    return getBasicEnabledNiches();
  },

  /** Nichos filtrados */
  filter(filters?: NicheFilters): GastronomyNicheConfig[] {
    return listNiches(filters);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS E CAPACIDADES
  // ══════════════════════════════════════════════════════════════════════════

  /** Verifica se um nicho está habilitado para uso */
  isEnabled(key: string): boolean {
    const niche = getNicheByKey(key);
    if (!niche) return false;
    return niche.supportLevel === 'full_enabled' || niche.supportLevel === 'basic_enabled';
  },

  /** Verifica se um nicho é público */
  isPublic(key: string): boolean {
    const niche = getNicheByKey(key);
    if (!niche) return false;
    return niche.isPublic;
  },

  /** Verifica se um nicho é selecionável */
  isSelectable(key: string): boolean {
    const niche = getNicheByKey(key);
    if (!niche) return false;
    return niche.isSelectable;
  },

  /** Verifica se um nicho é beta */
  isBeta(key: string): boolean {
    const niche = getNicheByKey(key);
    if (!niche) return false;
    return niche.isBeta;
  },

  /** Verifica se um nicho tem uma capacidade específica */
  hasCapability(key: string, capability: NicheCapability): boolean {
    return hasCapability(key, capability);
  },

  /** Verifica se um nicho é complexo (requer implementação específica) */
  isComplex(key: string): boolean {
    return isComplexNiche(key);
  },

  /** Lista capacidades disponíveis para um nicho */
  getEnabledCapabilities(key: string): NicheCapability[] {
    const niche = getNicheByKey(key);
    return niche?.enabledCapabilities ?? [];
  },

  /** Lista capacidades planejadas para proximas evolucoes */
  getMissingCapabilities(key: string): NicheCapability[] {
    const niche = getNicheByKey(key);
    return niche?.missingCapabilities ?? [];
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN E SEÇÕES
  // ══════════════════════════════════════════════════════════════════════════

  /** Verifica se uma seção deve ser exibida no admin */
  shouldShowAdminSection(key: string, section: AdminSection): boolean {
    return shouldShowAdminSection(key, section);
  },

  /** Obtém seções visíveis para um nicho */
  getAdminSections(key: string): AdminSection[] {
    const niche = getNicheByKey(key);
    if (!niche) return [];

    // Se for nicho básico, apenas seções padrão
    if (niche.operationalType !== 'complex') {
      return [
        'basic_menu',
        'variants',
        'addons',
        'combos',
        'promotions',
        'delivery_areas',
        'operational_hours',
        'order_management',
        'analytics',
      ];
    }

    // Nichos complexos: retornar seções registradas
    return niche.adminSections;
  },

  /** Obtém visibilidade detalhada de uma seção */
  getSectionVisibility(key: string, section: AdminSection): AdminSectionVisibility {
    const niche = getNicheByKey(key);
    const isEnabled = niche?.adminSections.includes(section) ?? false;
    const isComplexSection = this.isComplexSection(section);

    return {
      section,
      isVisible: shouldShowAdminSection(key, section),
      isEnabled,
      requiresImplementation: isComplexSection && !isEnabled,
    };
  },

  /** Verifica se uma seção é específica de nichos complexos */
  isComplexSection(section: AdminSection): boolean {
    const complexSections: AdminSection[] = [
      'pizza_sizes',
      'pizza_flavors',
      'pizza_crusts',
      'pizza_pricing',
      'sushi_builder',
      'sushi_pieces',
      'acai_builder',
      'meat_cuts',
      'meat_pricing',
      'pastel_builder',
    ];
    return complexSections.includes(section);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO
  // ══════════════════════════════════════════════════════════════════════════

  /** Valida se um item pode ser criado/editado em um nicho */
  validateForNiche(key: string, item: unknown): NicheValidationResult {
    const niche = getNicheByKey(key);
    if (!niche) {
      return {
        isValid: false,
        errors: [`Nicho '${key}' não encontrado no registro.`],
        warnings: [],
        nicheKey: key,
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const rules = niche.validationRules;
    const itemData = item as Record<string, unknown>;

    // Preço mínimo
    if (rules.minPrice !== undefined && itemData.base_price !== undefined) {
      const price = Number(itemData.base_price);
      if (price < rules.minPrice) {
        errors.push(`Preço mínimo para ${niche.publicLabel} é R$ ${rules.minPrice.toFixed(2)}.`);
      }
    }

    // Preço máximo
    if (rules.maxPrice !== undefined && itemData.base_price !== undefined) {
      const price = Number(itemData.base_price);
      if (price > rules.maxPrice) {
        errors.push(`Preço máximo para ${niche.publicLabel} é R$ ${rules.maxPrice.toFixed(2)}.`);
      }
    }

    // Descrição obrigatória
    if (rules.requiresDescription && !itemData.description) {
      warnings.push(`Descrição é recomendada para ${niche.publicLabel}.`);
    }

    // Foto obrigatória
    if (rules.requiresPhoto && !itemData.image_url) {
      warnings.push(`Foto é recomendada para ${niche.publicLabel}.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      nicheKey: key,
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÕES PADRÃO
  // ══════════════════════════════════════════════════════════════════════════

  /** Obtém configurações padrão de um nicho */
  getDefaultConfig(key: string) {
    const niche = getNicheByKey(key);
    return niche?.defaultConfig ?? {};
  },

  /** Obtém categorias sugeridas para um nicho */
  getSuggestedCategories(key: string): string[] {
    const niche = getNicheByKey(key);
    return niche?.defaultConfig.suggestedCategories ?? [];
  },

  /** Obtém itens sugeridos para um nicho */
  getSuggestedItems(key: string): string[] {
    const niche = getNicheByKey(key);
    return niche?.defaultConfig.suggestedItems ?? [];
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD INFO
  // ══════════════════════════════════════════════════════════════════════════

  /** Informações para exibição no dashboard */
  getDashboardInfo(key: string): NicheDashboardInfo | null {
    const niche = getNicheByKey(key);
    if (!niche) return null;

    const statusMap: Record<NicheStatus, { label: string; color: string }> = {
      full_enabled: { label: 'Completo', color: '#22c55e' },      // green-500
      basic_enabled: { label: 'Básico', color: '#3b82f6' },       // blue-500
      beta_enabled: { label: 'Beta', color: '#f59e0b' },           // amber-500
      hidden: { label: 'Oculto', color: '#6b7280' },               // gray-500
      coming_soon: { label: 'Em Breve', color: '#a855f7' },      // purple-500
    };

    const statusInfo = statusMap[niche.supportLevel];

    return {
      niche,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      canUseNow: niche.supportLevel === 'full_enabled' || niche.supportLevel === 'basic_enabled',
      needsSetup: niche.isBeta || niche.supportLevel === 'coming_soon',
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONSTANTES
  // ══════════════════════════════════════════════════════════════════════════

  /** Key padrão quando nenhum nicho está selecionado */
  getDefaultNicheKey(): string {
    return DEFAULT_NICHE_KEY;
  },

  /** Registro completo (para casos avançados) */
  getRegistry() {
    return GASTRONOMY_NICHE_REGISTRY;
  },
};

export default NicheConfigService;
