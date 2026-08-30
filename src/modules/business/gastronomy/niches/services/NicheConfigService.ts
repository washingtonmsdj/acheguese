import type {
  AdminSection,
  GastronomyNicheConfig,
  NicheCapability,
  NicheFilters,
  NicheStatus,
  NicheValidationResult,
} from '@/core/business/niches/types';
import {
  DEFAULT_NICHE_KEY,
  GASTRONOMY_NICHE_REGISTRY,
  getAdminNiches,
  getAllNiches,
  getBasicEnabledNiches,
  getBetaNiches,
  getFullEnabledNiches,
  getNicheByKey,
  getNicheOrDefault,
  getPublicNiches,
  getSelectableNiches,
  hasCapability,
  isComplexNiche,
  listNiches,
  nicheExists,
  shouldShowAdminSection,
} from '../registry';
import { formatBrl } from '../../utils/currency';

export interface AdminSectionVisibility {
  section: AdminSection;
  isVisible: boolean;
  isEnabled: boolean;
  requiresImplementation: boolean;
}

export interface NicheDashboardInfo {
  niche: GastronomyNicheConfig;
  statusLabel: string;
  statusColor: string;
  canUseNow: boolean;
  needsSetup: boolean;
}

const BASIC_ADMIN_SECTIONS: AdminSection[] = [
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

const COMPLEX_ADMIN_SECTIONS: AdminSection[] = [
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

const STATUS_INFO: Record<NicheStatus, { label: string; color: string }> = {
  full_enabled: { label: 'Completo', color: '#22c55e' },
  basic_enabled: { label: 'Básico', color: '#3b82f6' },
  beta_enabled: { label: 'Beta', color: '#f59e0b' },
  hidden: { label: 'Oculto', color: '#6b7280' },
  coming_soon: { label: 'Em Breve', color: '#a855f7' },
};

export const NicheConfigService = {
  getConfig(key: string): GastronomyNicheConfig | null {
    return getNicheByKey(key);
  },

  getConfigOrDefault(key?: string | null): GastronomyNicheConfig {
    return getNicheOrDefault(key);
  },

  exists(key: string): boolean {
    return nicheExists(key);
  },

  getAll(): GastronomyNicheConfig[] {
    return getAllNiches();
  },

  getSelectable(): GastronomyNicheConfig[] {
    return getSelectableNiches();
  },

  getPublic(): GastronomyNicheConfig[] {
    return getPublicNiches();
  },

  getAdminAvailable(): GastronomyNicheConfig[] {
    return getAdminNiches();
  },

  getBeta(): GastronomyNicheConfig[] {
    return getBetaNiches();
  },

  getFullEnabled(): GastronomyNicheConfig[] {
    return getFullEnabledNiches();
  },

  getBasicEnabled(): GastronomyNicheConfig[] {
    return getBasicEnabledNiches();
  },

  filter(filters?: NicheFilters): GastronomyNicheConfig[] {
    return listNiches(filters);
  },

  isEnabled(key: string): boolean {
    const niche = getNicheByKey(key);
    return Boolean(
      niche &&
        (niche.supportLevel === 'full_enabled' || niche.supportLevel === 'basic_enabled'),
    );
  },

  isPublic(key: string): boolean {
    return getNicheByKey(key)?.isPublic ?? false;
  },

  isSelectable(key: string): boolean {
    return getNicheByKey(key)?.isSelectable ?? false;
  },

  isBeta(key: string): boolean {
    return getNicheByKey(key)?.isBeta ?? false;
  },

  hasCapability(key: string, capability: NicheCapability): boolean {
    return hasCapability(key, capability);
  },

  isComplex(key: string): boolean {
    return isComplexNiche(key);
  },

  getEnabledCapabilities(key: string): NicheCapability[] {
    return getNicheByKey(key)?.enabledCapabilities ?? [];
  },

  getMissingCapabilities(key: string): NicheCapability[] {
    return getNicheByKey(key)?.missingCapabilities ?? [];
  },

  shouldShowAdminSection(key: string, section: AdminSection): boolean {
    return shouldShowAdminSection(key, section);
  },

  getAdminSections(key: string): AdminSection[] {
    const niche = getNicheByKey(key);
    if (!niche) return [];
    return niche.operationalType === 'complex' ? niche.adminSections : BASIC_ADMIN_SECTIONS;
  },

  getSectionVisibility(key: string, section: AdminSection): AdminSectionVisibility {
    const niche = getNicheByKey(key);
    const isEnabled = niche?.adminSections.includes(section) ?? false;
    const requiresImplementation = COMPLEX_ADMIN_SECTIONS.includes(section) && !isEnabled;

    return {
      section,
      isVisible: shouldShowAdminSection(key, section),
      isEnabled,
      requiresImplementation,
    };
  },

  isComplexSection(section: AdminSection): boolean {
    return COMPLEX_ADMIN_SECTIONS.includes(section);
  },

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
    const itemData = item as Record<string, unknown>;
    const rules = niche.validationRules;

    if (rules.minPrice !== undefined && itemData.base_price !== undefined) {
      const price = Number(itemData.base_price);
      if (price < rules.minPrice) {
        errors.push(`Preço mínimo para ${niche.publicLabel} é ${formatBrl(rules.minPrice)}.`);
      }
    }

    if (rules.maxPrice !== undefined && itemData.base_price !== undefined) {
      const price = Number(itemData.base_price);
      if (price > rules.maxPrice) {
        errors.push(`Preço máximo para ${niche.publicLabel} é ${formatBrl(rules.maxPrice)}.`);
      }
    }

    if (rules.requiresDescription && !itemData.description) {
      warnings.push(`Descrição é recomendada para ${niche.publicLabel}.`);
    }

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

  getDefaultConfig(key: string) {
    return getNicheByKey(key)?.defaultConfig ?? {};
  },

  getSuggestedCategories(key: string): string[] {
    return getNicheByKey(key)?.defaultConfig.suggestedCategories ?? [];
  },

  getSuggestedItems(key: string): string[] {
    return getNicheByKey(key)?.defaultConfig.suggestedItems ?? [];
  },

  getDashboardInfo(key: string): NicheDashboardInfo | null {
    const niche = getNicheByKey(key);
    if (!niche) return null;

    const statusInfo = STATUS_INFO[niche.supportLevel];
    return {
      niche,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      canUseNow:
        niche.supportLevel === 'full_enabled' || niche.supportLevel === 'basic_enabled',
      needsSetup: niche.isBeta || niche.supportLevel === 'coming_soon',
    };
  },

  getDefaultNicheKey(): string {
    return DEFAULT_NICHE_KEY;
  },

  getRegistry() {
    return GASTRONOMY_NICHE_REGISTRY;
  },
};

export default NicheConfigService;
