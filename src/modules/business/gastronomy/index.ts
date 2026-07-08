/**
 * Public contract for the Gastronomy module.
 *
 * Routes import pages directly from pages/. Keep this barrel focused on
 * domain types, services, hooks, utilities and reusable runtime components.
 */

export type {
  GastronomyProfile,
  GastronomyBusiness,
  GastronomyStatus,
  PriceRange,
  OpeningStatus,
  DeliveryInfo,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
  GastronomyBusinessFilters,
} from './types';

export type {
  Menu,
  MenuCategory,
  MenuItem,
  MenuItemVariant,
  MenuItemAddon,
  MenuItemAvailability,
  MenuPromotion,
  MenuItemWithRelations,
  MenuWithCategories,
  PublicGastronomyFoodItem,
  MenuItemFilters,
  CartItem,
  Cart,
} from './types/menu';

export * from './cart';
export * from './services';
export * from './hooks';
export * from './utils';

export { CUISINE_TYPES, getCuisineLabel, type CuisineType } from './constants';

export {
  GastronomyCard,
  FoodItemCard,
  FoodSectionCarousel,
  BusinessSectionCarousel,
  MenuItemCard,
  MenuItemDetailDrawer,
  GastronomyCheckoutSheet,
  GastronomyDeliveryDestinationPanel,
  StickyOrderBar,
} from './components';

export * from './niches';
