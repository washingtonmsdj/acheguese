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
  BUSINESS_SUBCATEGORIES,
  BUSINESS_CATEGORY_LABELS,
  getCategoryLabel,
  getSubcategories,
  hasSubcategories,
  getCategoriesAsOptions,
  getSubcategoriesAsOptions,
  isValidCategory,
  isValidSubcategory,
  type BusinessCategory,
} from './categories';

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
