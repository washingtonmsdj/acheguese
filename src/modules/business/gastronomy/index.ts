/**
 * Módulo de Gastronomia - Vertical Especializada
 * 
 * SSOT: Gastronomia é uma extensão do módulo Business.
 * GastronomyBusiness = Business + GastronomyProfile.
 * Dados base vêm de BusinessService (SSOT), perfil gastronômico é adição.
 * 
 * Exports públicos do módulo
 */

// Types
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
// Menu types
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

// Services
export * from './services';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

// Constants (runtime values - SSOT)
export { CUISINE_TYPES, getCuisineLabel, type CuisineType } from './constants';

// Components
export {
  GastronomyHero,
  GastronomyCard,
  GastronomyCard as GastronomyBusinessCardEnhanced, // Alias publico estavel
  GastronomyCTA,
  GastronomyCategoryCards,
  GastronomyFilters,
  FoodItemCard,
  FoodSectionCarousel,
  BusinessSectionCarousel,
  MenuCategoryTabs,
  MenuItemCard,
  MenuItemDetailDrawer,
  GastronomyCheckoutSheet,
  GastronomyDeliveryDestinationPanel,
  StickyOrderBar,
  DeliveryInfoCard,
  OpeningStatusBadge,
} from './components';

// Pages
export * from './pages';

// Nichos Gastronômicos (Especializações Internas)
// SSOT: modules/business/gastronomy/niches/
export * from './niches';
