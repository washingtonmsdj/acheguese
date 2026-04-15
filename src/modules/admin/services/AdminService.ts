/**
 * AdminService - Fachada SSOT v2.0
 * 
 * Ponto único de entrada para operações administrativas.
 * Exporta queries, mutations e types organizados.
 * 
 * @example
 * import { createAdminUser, getRealtimeMetrics } from '@/modules/admin/services/AdminService';
 * import type { AdminUserConfig, RealtimeMetrics } from '@/modules/admin/services/AdminService';
 */

// ============================================================
// QUERIES - Operações de Leitura
// ============================================================
export {
  getRealtimeMetrics,
  getReputationStats,
  subscribeToMetrics,
  getOperationalOverview,
} from './admin.queries';

// ============================================================
// MUTATIONS - Operações de Escrita
// ============================================================
export {
  createAdminUser,
} from './admin.mutations';

// ============================================================
// TYPES
// ============================================================
export type {
  AdminUserConfig,
  AdminUserResult,
  RealtimeMetrics,
  ActiveRide,
  OnlineDriver,
  ReputationStats,
  AdminOperationalHealth,
  AdminModuleCoverage,
  AdminOperationalOverview,
} from './types';

// ============================================================
// FACADE UNIFICADA (compatibilidade legada)
// ============================================================
import * as adminQueries from './admin.queries';
import * as adminMutations from './admin.mutations';

/**
 * AdminFacade - Fachada unificada para operações administrativas
 * @deprecated Use funções individuais de admin.queries ou admin.mutations
 */
export const AdminFacade = {
  queries: adminQueries,
  mutations: adminMutations,
} as const;

/**
 * AdminService - compatibilidade para hooks legados
 * Mantém uma API estável enquanto a base migra para imports nomeados.
 */
export const AdminService = {
  getRealtimeMetrics: adminQueries.getRealtimeMetrics,
  getReputationStats: adminQueries.getReputationStats,
  subscribeToMetrics: adminQueries.subscribeToMetrics,
  getOperationalOverview: adminQueries.getOperationalOverview,
  createAdminUser: adminMutations.createAdminUser,
} as const;
