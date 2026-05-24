/**
 * Categorias de empresas.
 *
 * Este arquivo existe para compatibilidade de imports antigos do modulo business,
 * mas a fonte real esta em `src/shared/taxonomy/businessCategories.ts`.
 */

import { BUSINESS_CATEGORY_OPTIONS } from "@/shared/taxonomy/businessCategories";

export {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORY_LABELS,
  BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_SUBCATEGORIES,
  getBusinessCategoryLabel as getCategoryLabel,
  getBusinessSubcategories as getSubcategories,
  getBusinessSubcategoryOptions as getSubcategoriesAsOptions,
  hasBusinessSubcategories as hasSubcategories,
  isBusinessCategory as isValidCategory,
  isBusinessSubcategory as isValidSubcategory,
  type BusinessCategory,
} from "@/shared/taxonomy/businessCategories";

export function getCategoriesAsOptions() {
  return BUSINESS_CATEGORY_OPTIONS;
}
