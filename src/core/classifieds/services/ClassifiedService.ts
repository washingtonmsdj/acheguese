/**
 * ClassifiedsService - SSOT de classificados.
 *
 * Entrada publica unica para listagem, busca, publicacao e manutencao
 * de classificados. A implementacao continua separada por queries,
 * mutations e mappers para manter baixo acoplamento.
 */

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
} from "./classifieds.queries";

export {
  createClassified,
  updateClassified,
  deleteClassified,
  markAsSold,
  reactivateClassified,
} from "./classifieds.mutations";

export type {
  ClassifiedData,
  CreateClassifiedInput,
  UpdateClassifiedInput,
  NeighborhoodWithClassifiedCount,
  SellerWithAds,
  ClassifiedCondition,
  ClassifiedStatus,
} from "./types";

import * as queries from "./classifieds.queries";
import * as mutations from "./classifieds.mutations";
import { CLASSIFIED_STATUS_VALUES } from "@/core/classifieds/constants/statuses";

export const ClassifiedsService = {
  queries,
  mutations,
} as const;

export const CLASSIFIED_CONDITIONS = [
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
] as const;

export const CLASSIFIED_STATUSES = [
  ...CLASSIFIED_STATUS_VALUES,
] as const;
