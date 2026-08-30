/**
 * Public contract for Gastronomy niches.
 *
 * Keep this barrel limited to domain contracts used by runtime code. Generic
 * niche UI/hooks were removed until they have real product consumers.
 */

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
} from '@/core/business/niches/types';

export { NICHE_KEYS, NICHE_STATUS_PRIORITY } from '@/core/business/niches/types';

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

export { NicheConfigService } from './services/NicheConfigService';
export type {
  AdminSectionVisibility,
  NicheDashboardInfo,
} from './services/NicheConfigService';

export { createNichePreset } from './presets/base';
export { pizzaNicheConfig } from './presets/pizza';
export { hamburguerNicheConfig } from './presets/hamburguer';
export { lanchesNicheConfig } from './presets/lanches';
export { brasileiraNicheConfig } from './presets/brasileira';
export { sushiNicheConfig } from './presets/sushi';

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

export const COMPLEX_NICHE_KEYS = [
  'sushi',
  'acai',
  'pastel',
  'churrascaria',
  'bares',
] as const;

export const NICHE_PUBLIC_LABELS: Record<string, string> = {
  lanches: 'Lanches',
  brasileira: 'Brasileira',
  arabe: '\u00c1rabe',
  saudavel: 'Saud\u00e1vel',
  salgados: 'Salgados',
  padaria: 'Padaria',
  doces: 'Doces & Bolos',
  cafes: 'Caf\u00e9s',
  hamburguer: 'Hamb\u00farguer',
  pizza: 'Pizzaria',
  sushi: 'Japonesa / Sushi',
  acai: 'A\u00e7a\u00ed & Sorvete',
  pastel: 'Pastel',
  churrascaria: 'Carnes & Churrascaria',
  bares: 'Bares & Pubs',
};

export * from './versioning';
export * from './pizzaria';
