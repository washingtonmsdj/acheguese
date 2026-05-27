/**
 * SSOT: Business Constants
 * 
 * Exports centralizados de todas as constantes de negócio.
 * 
 * REGRA SSOT:
 * - Todas as constantes relacionadas a empresas devem ser definidas aqui
 * - Nunca duplicar definições em componentes ou páginas
 * - Sempre importar deste módulo: import { FACILITIES } from '@/core/business/constants'
 */

import { BUSINESS_CATEGORY_OPTIONS } from "@/shared/taxonomy/businessCategories";

// Facilidades
export {
  FACILITIES,
  getFacilityById,
  getFacilityIcon,
  getFacilityLabel,
  getFacilityColor,
  type Facility,
  type FacilityId,
} from './facilities';

// Modos de Atendimento
export {
  SERVICE_MODES,
  getServiceModeById,
  getServiceModeLabel,
  getServiceModeIcon,
  getServiceModeColor,
  serviceModeSupportAreas,
  type ServiceMode,
  type ServiceModeId,
} from './serviceModes';

// Formas de Pagamento
export {
  PAYMENT_METHODS,
  getPaymentMethodById,
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  getPaymentMethodColor,
  getPaymentMethodLabels,
  labelToId,
  labelsToIds,
  idsToLabels,
  type PaymentMethod,
  type PaymentMethodId,
} from './paymentMethods';

// Redes Sociais
export {
  SOCIAL_PLATFORMS,
  getSocialPlatformById,
  getSocialPlatformLabel,
  getSocialPlatformIcon,
  validateSocialUsername,
  getSocialUrl,
  type SocialPlatform,
  type SocialPlatformId,
} from './socialPlatforms';

// Especialidades
export {
  SPECIALTY_SUGGESTIONS,
  getSpecialtySuggestions,
  hasSpecialtySuggestions,
  getAllCategories,
  type SpecialtyCategory,
} from './specialties';

// Categorias e Subcategorias
export {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_SUBCATEGORIES,
  BUSINESS_CATEGORY_LABELS,
  getBusinessCategoryLabel as getCategoryLabel,
  getBusinessSubcategories as getSubcategories,
  hasBusinessSubcategories as hasSubcategories,
  getBusinessSubcategoryOptions as getSubcategoriesAsOptions,
  isBusinessCategory as isValidCategory,
  isBusinessSubcategory as isValidSubcategory,
  type BusinessCategory,
} from "@/shared/taxonomy/businessCategories";

export function getCategoriesAsOptions() {
  return BUSINESS_CATEGORY_OPTIONS;
}

// Dias da Semana
export {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  WEEK_DAY_SHORT_LABELS,
  WEEKDAYS,
  WEEKEND,
  getWeekDayLabel,
  getWeekDayShortLabel,
  isWeekday,
  isWeekend,
  getWeekDaysAsOptions,
  getWeekDaysAsShortOptions,
  isValidWeekDay,
  indexToWeekDay,
  weekDayToIndex,
  type WeekDay,
} from './weekDays';

// Status de Gastronomia
export {
  GASTRONOMY_PROFILE_STATUSES,
  type GastronomyProfileStatus,
} from './gastronomyProfileStatus';

// Upload de imagens
export {
  BUSINESS_IMAGE_UPLOAD_LIMITS,
} from './imageUpload';
