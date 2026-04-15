/**
 * Guide Module — Public API
 *
 * Vertical: tourism
 * Exporta apenas o que é necessário para consumo externo.
 */

// Types
export type {
  TouristPoint,
  TouristPointMedia,
  CreateTouristPointInput,
  UpdateTouristPointInput,
  TouristPointQueryFilters,
  PriceType,
  TouristPointStatus,
} from './types';
export {
  PRICE_TYPE,
  PRICE_TYPE_LABELS,
  TOURIST_POINT_STATUS,
  TOURIST_POINT_STATUS_LABELS,
  generateSlug,
} from './types';

// Services
export { TouristPointQueryService } from './services/TouristPointQueryService';
export { TouristPointService } from './services/TouristPointService';

// Hooks
export { useTouristPoints, useTouristPointsCount } from './hooks/useTouristPoints';
export { useTouristPoint } from './hooks/useTouristPoint';
export { useGuideUrls, TOURIST_POINTS_SLUG } from './hooks/useGuideUrls';
export { useHasTouristPoints } from './hooks/useHasTouristPoints';
