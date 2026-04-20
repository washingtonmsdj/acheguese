/**
 * Core Classifieds Services - Canonical barrel
 *
 * Core is the canonical import surface. Implementation still delegates
 * to stable modules services where migration is not yet finalized.
 */

export {
  ClassifiedsFacade,
  default as ClassifiedService,
  CLASSIFIED_CONDITIONS,
  CLASSIFIED_STATUSES,
} from "../../../modules/classifieds/services/ClassifiedService";

export {
  getNeighborhoodsWithClassifieds,
  getAllClassifieds,
  getClassifiedById,
  getClassifiedsByCategory,
  getUserClassifieds,
  getClassifiedsBySeller,
  getSellersWithAds,
  getTotalClassifiedsCount,
  getRecentClassifieds,
  getClassifiedsCreatedInPeriod,
} from "../../../modules/classifieds/services/classifieds.queries";

export {
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
} from "../../../modules/classifieds/services/classifieds.mutations";

export type {
  ClassifiedData,
  CreateClassifiedInput,
  UpdateClassifiedInput,
  NeighborhoodWithClassifiedCount,
  SellerWithAds,
  ClassifiedCondition,
  ClassifiedStatus,
} from "./types";

export {
  mapToClassificadoWithVendedor,
  mapToClassificadoList,
} from "./classifieds.mappers";

export { classifiedUrlService, ClassifiedUrlService } from "./ClassifiedUrlService";
export type {
  ClassifiedUrlContext,
  ResolvedClassifiedUrl,
  ClassifiedResolution,
} from "./ClassifiedUrlService";

export { classifiedReportService } from "../../../modules/classifieds/services/ClassifiedReportService";
export type {
  ClassifiedReport,
  CreateReportInput,
  ReportReason,
} from "../../../modules/classifieds/services/ClassifiedReportService";
