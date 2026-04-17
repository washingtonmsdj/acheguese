/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VAGAS HOOKS — Barrel Export
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Hooks públicos (para páginas de listagem e detalhe)
export { useVagasPublic, useVagasUrgentes, useVagasDestaque, useBairrosComVagas } from './useVagasPublic';
export { useVagaDetail } from './useVagaDetail';

// Hooks legados (mantidos para compatibilidade - serão deprecados)
export { useVagas } from './useVagas';
export { useVagasLocation } from './useVagasLocation';
