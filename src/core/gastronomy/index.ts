/**
 * Contrato canonico de gastronomia para consumo cross-domain.
 */

export { CUISINE_TYPES } from "./constants/cuisine";
export type { CuisineType } from "./constants/cuisine";
export type {
  GastronomyBusiness,
  GastronomyProfile,
  Cart,
  CartItem,
} from "./types";
export { GastronomyProfileService } from "./GastronomyProfileService";
export type { ServiceResult } from "./GastronomyProfileService";

// Menu Service
export { MenuService } from "./MenuService";
export type {
  MenuCategory,
  MenuItem,
  MenuItemVariation,
  MenuItemAddon,
  MenuCombo,
  MenuComboItem,
} from "./MenuService";
