// Compatibility type surface for Gastronomy module consumers.
// Shared domain contracts are owned by src/core/business/types/gastronomy.
export type {
  PriceRange,
  GastronomyStatus,
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
  GastronomyBusiness,
  GastronomyBusinessFilters,
  OpeningStatus,
  DeliveryInfo,
  ActivityType,
  GastronomyActivity,
  GastronomyActivityFilters,
} from '@/core/business/types/gastronomy';

// CuisineType remains a product taxonomy contract of the Gastronomy module.
export type { CuisineType } from '../../constants/cuisine';
