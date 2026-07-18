/**
 * Classifieds services - canonical barrel.
 */

export {
  ClassifiedsService,
  CLASSIFIED_CONDITIONS,
  CLASSIFIED_STATUSES,
} from "@/core/classifieds/services/ClassifiedService";

export { ClassifiedLinkEligibilityService } from "@/core/classifieds/services/ClassifiedLinkEligibilityService";

export {
  getNeighborhoodsWithClassifieds,
  getAllClassifieds,
  searchClassifieds,
  getClassifiedById,
  getClassifiedsByCategory,
  getUserClassifieds,
  getClassifiedsBySeller,
  getSellersWithAds,
  getTotalClassifiedsCount,
  getRecentClassifieds,
  getClassifiedsCreatedInPeriod,
} from "@/core/classifieds/services/classifieds.queries";

export {
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
} from "@/core/classifieds/services/classifieds.mutations";

export type {
  ClassifiedData,
  ClassifiedTerritory,
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
  ClassifiedPublicUrlInput,
  ResolvedClassifiedUrl,
  ClassifiedResolution,
} from "./ClassifiedUrlService";

export {
  CLASSIFIED_REPORT_REASON_OPTIONS,
  classifiedReportService,
  isClassifiedReportReason,
} from "@/core/classifieds/services/ClassifiedReportService";
export type {
  ClassifiedReport,
  CreateReportInput,
  ReportReason,
} from "@/core/classifieds/services/ClassifiedReportService";

export { ClassifiedFavoriteService } from "./ClassifiedFavoriteService";

export { classifiedCommentService } from "./ClassifiedCommentService";
export type { ClassifiedComment } from "./ClassifiedCommentService";

export {
  classifiedsLocationService,
  ClassifiedsLocationService,
} from "./ClassifiedsLocationService";

export {
  classifiedsRolloutService,
  ClassifiedsRolloutService,
} from "./ClassifiedsRolloutService";

export { ClassifiedTrustService } from "./ClassifiedTrustService";
