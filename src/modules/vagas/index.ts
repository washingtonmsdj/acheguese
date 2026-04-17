/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MÓDULO VAGAS — Barrel Export (SSOT Nível AAA)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Domínio completo de vagas de emprego:
 * - Listagem territorial pública
 * - Detalhe canônico por slug
 * - Candidatura tipada
 * - SEO e performance
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════════════════════

export { default as VagasListingPage } from './pages/VagasListingPage';
export { default as VagaDetailPage } from './pages/VagaDetailPage';
export { default as PublicarVagaPage } from './pages/PublicarVagaPage';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export { VagaCardEnhanced } from './components/VagaCardEnhanced';
export { VagaCardEnhanced as VagaCard } from './components/VagaCardEnhanced';
export { VagasFilters } from './components/VagasFilters';
export { VagasLoading, VagasEmpty, VagasError } from './components/VagasStates';

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// Hooks novos (recomendados)
export { useVagasPublic, useVagasUrgentes, useVagasDestaque, useBairrosComVagas } from './hooks/useVagasPublic';
export { useVagaDetail } from './hooks/useVagaDetail';

// Hooks legados (mantidos para compatibilidade)
export { useVagas } from './hooks/useVagas';
export { useVagasLocation } from './hooks/useVagasLocation';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

export { VagasService, vagasService } from './services/VagasService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Vaga,
  VagaRow,
  VagaCategoria,
  VagaFilters,
  VagaSortOption,
  VagasQueryParams,
  VagasPaginatedResult,
  Candidatura,
} from './types/vagas.types';

export type {
  VagaStatus,
  VagaContrato,
  VagaModalidade,
  VagaNivel,
  VagaUrgencia,
  VagaApplicationChannel,
  VagaSalaryMode,
  VagaHighlightType,
} from './types/vagas.types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VAGA_CATEGORIAS,
  VAGA_STATUS_LABELS,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  URGENCIA_LABELS,
  APPLICATION_CHANNEL_LABELS,
  HIGHLIGHT_TYPE_LABELS,
  SORT_OPTIONS,
  formatSalary,
  isVagaActive,
  canApplyToVaga,
} from './types/vagas.types';
