/**
 * Re-exports de Classifieds Services - SSOT v2.0
 * 
 * NOTA: Usar ClassifiedsFacade ou imports diretos de queries/mutations.
 * Compatibilidade mantida para imports antigos.
 */

export {
  ClassifiedsFacade,
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
  getAllClassifieds,
  getClassifiedById,
  getUserClassifieds,
} from "../../../modules/classifieds/services/ClassifiedService";

export type {
  ClassifiedData,
  CreateClassifiedInput,
  UpdateClassifiedInput,
} from "../../../modules/classifieds/services/ClassifiedService";

export { classifiedUrlService, ClassifiedUrlService } from "../../../modules/classifieds/services/ClassifiedUrlService";
export type {
  ClassifiedUrlContext,
  ResolvedClassifiedUrl,
  ClassifiedResolution,
} from "../../../modules/classifieds/services/ClassifiedUrlService";

export { classifiedReportService } from "../../../modules/classifieds/services/ClassifiedReportService";
export type {
  ClassifiedReport,
  CreateReportInput,
  ReportReason,
} from "../../../modules/classifieds/services/ClassifiedReportService";
