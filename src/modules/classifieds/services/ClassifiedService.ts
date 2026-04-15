/**
 * 🏆 CLASSIFIEDS SERVICE FACADE - SSOT v2.0
 *
 * Fachada unificada para operações de classificados.
 * Segrega queries, mutations e helpers em módulos separados.
 *
 * ✅ SSOT: Single Source of Truth
 * ✅ Facade Pattern: Interface unificada
 * ✅ Backward Compatibility: Classes legadas mantidas
 * ✅ Tree Shakable: Import apenas o necessário
 *
 * @version 2.0.0 - Refatoração SSOT completa
 */

// ============================================================
// 📦 QUERIES - Operações de Leitura
// ============================================================
export {
  // Listagem e busca
  getNeighborhoodsWithClassifieds,
  getAllClassifieds,
  getClassifiedById,
  getClassifiedsByCategory,
  getUserClassifieds,
  getClassifiedsBySeller,
  getSellersWithAds,
  // Estatísticas
  getTotalClassifiedsCount,
  getRecentClassifieds,
  getClassifiedsCreatedInPeriod,
} from "./classifieds.queries";

// ============================================================
// ✏️ MUTATIONS - Operações de Escrita
// ============================================================
export {
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
} from "./classifieds.mutations";

// ============================================================
// 📋 TYPES - Tipagens Canônicas
// ============================================================
export type {
  ClassifiedData,
  CreateClassifiedInput,
  UpdateClassifiedInput,
  NeighborhoodWithClassifiedCount,
  SellerWithAds,
  ClassifiedCondition,
  ClassifiedStatus,
} from "./types";

// ============================================================
// 🏛️ FACADE UNIFICADA - ClassifiedsFacade
// ============================================================

import * as queries from "./classifieds.queries";
import * as mutations from "./classifieds.mutations";

/**
 * 🎯 ClassifiedsFacade - Interface SSOT unificada
 *
 * Uso: ClassifiedsFacade.queries.getAllClassifieds()
 *      ClassifiedsFacade.mutations.createClassified(userId, input)
 */
export const ClassifiedsFacade = {
  queries,
  mutations,
} as const;

export default ClassifiedsFacade;

/**
 * @deprecated Use ClassifiedsFacade diretamente. Mantido para compatibilidade.
 */
export const classifiedService = ClassifiedsFacade;

// ============================================================
//  CONSTANTS E CONFIGURAÇÕES
// ============================================================

/**
 * Condições válidas para produtos
 */
export const CLASSIFIED_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
] as const;

/**
 * Status válidos para classificados
 */
export const CLASSIFIED_STATUSES = [
  "active",
  "inactive",
  "sold",
  "pending",
  "rejected",
] as const;
