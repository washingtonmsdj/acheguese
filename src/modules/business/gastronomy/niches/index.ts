/**
 * 🍽️ GASTRONOMY NICHES MODULE
 *
 * Módulo de nichos gastronômicos - especializações internas do módulo Gastronomia.
 *
 * Este módulo fornece:
 * - Definições de tipos para nichos
 * - Registro canônico de nichos
 * - Configurações por nicho
 * - Serviços e hooks para acesso
 *
 * @version 1.0.0
 * @module gastronomy/niches
 */

// ═════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════════════════

export type {
  NicheStatus,
  NicheCapability,
  AdminSection,
  GastronomyNicheConfig,
  NicheDefaultConfig,
  NicheValidationRules,
  SelectedNiche,
  NicheRegistry,
  NicheFilters,
  NicheValidationResult,
  NicheKey,
} from './types';

export { NICHE_KEYS, NICHE_STATUS_PRIORITY } from './types';

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

export {
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
} from './registry';

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═════════════════════════════════════════════════════════════════════════════

export { NicheConfigService } from './services/NicheConfigService';
export type {
  AdminSectionVisibility,
  NicheDashboardInfo,
} from './services/NicheConfigService';

// ═════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═════════════════════════════════════════════════════════════════════════════

export {
  useGastronomyNiche,
  useNicheList,
  useSelectableNiches,
  useAdminSectionVisibility,
  useNicheValidation,
} from './hooks/useGastronomyNiche';

export type {
  UseGastronomyNicheOptions,
  UseGastronomyNicheReturn,
} from './hooks/useGastronomyNiche';

// ═════════════════════════════════════════════════════════════════════════════
// PRESETS (exportação seletiva para casos avançados)
// ═════════════════════════════════════════════════════════════════════════════

// Base
export { createNichePreset } from './presets/base';

// Presets individuais (para casos de uso específicos)
export { pizzaNicheConfig } from './presets/pizza';
export { hamburguerNicheConfig } from './presets/hamburguer';
export { lanchesNicheConfig } from './presets/lanches';
export { brasileiraNicheConfig } from './presets/brasileira';
export { sushiNicheConfig } from './presets/sushi';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTES ÚTEIS
// ═════════════════════════════════════════════════════════════════════════════

/** Nichos disponíveis para seleção pública */
export const SELECTABLE_NICHE_KEYS = [
  'pizza',
  'lanches',
  'brasileira',
  'arabe',
  'saudavel',
  'salgados',
  'padaria',
  'doces',
  'cafes',
  'hamburguer',
] as const;

/** Nichos complexos (em desenvolvimento) */
export const COMPLEX_NICHE_KEYS = [
  'sushi',
  'acai',
  'pastel',
  'churrascaria',
  'bares',
] as const;

/** Mapeamento de labels públicos */
export const NICHE_PUBLIC_LABELS: Record<string, string> = {
  lanches: 'Lanches',
  brasileira: 'Brasileira',
  arabe: 'Árabe',
  saudavel: 'Saudável',
  salgados: 'Salgados',
  padaria: 'Padaria',
  doces: 'Doces & Bolos',
  cafes: 'Cafés',
  hamburguer: 'Hambúrguer',
  pizza: 'Pizzaria',
  sushi: 'Japonesa / Sushi',
  acai: 'Açaí & Sorvete',
  pastel: 'Pastel',
  churrascaria: 'Carnes & Churrascaria',
  bares: 'Bares & Pubs',
};

// ═════════════════════════════════════════════════════════════════════════════
// VERSIONING (SISTEMA DE EVOLUÇÃO DE NICHOS)
// ═════════════════════════════════════════════════════════════════════════════

export * from './versioning';

// ═════════════════════════════════════════════════════════════════════════════
// PIZZARIA (NICHO COMPLETO)
// ═════════════════════════════════════════════════════════════════════════════

export * from './pizzaria';
