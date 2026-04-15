/**
 * 📦 CLASSIFIEDS SERVICES - Barrel Export
 *
 * SSOT para todos os serviços de classificados.
 * Organizado em queries, mutations, helpers e serviços especializados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 FACADE PRINCIPAL (Recomendado)
// ============================================================
export {
  ClassifiedsFacade,
  default as ClassifiedService,
} from "./ClassifiedService";

// ============================================================
// 📦 QUERIES - Operações de Leitura (SSOT)
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
// ✏️ MUTATIONS - Operações de Escrita (SSOT)
// ============================================================
export {
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
} from "./classifieds.mutations";

// ============================================================
// 📋 TYPES - Tipagens Canônicas (SSOT)
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
// 🔄 MAPPERS - Transformação de Dados (SSOT)
// ============================================================
export {
  mapToClassificadoWithVendedor,
  mapToClassificadoList,
} from "./classifieds.mappers";

// ============================================================
// 🌐 SERVIÇOS ESPECIALIZADOS
// ============================================================
export { classifiedUrlService } from "./ClassifiedUrlService";
export { classifiedReportService } from "./ClassifiedReportService";

// ============================================================
// 🌍 GEOGRAPHIC FOUNDATION INTEGRATION
// ============================================================
export {
  classifiedsLocationService,
  ClassifiedsLocationService,
} from "./ClassifiedsLocationService";
export {
  classifiedsRolloutService,
  ClassifiedsRolloutService,
} from "./ClassifiedsRolloutService";

// ============================================================
// 📊 CONSTANTS E CONFIGURAÇÕES
// ============================================================
export {
  CLASSIFIED_CONDITIONS,
  CLASSIFIED_STATUSES,
} from "./ClassifiedService";
