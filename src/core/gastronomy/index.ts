/**
 * Contrato canonico de gastronomia para consumo cross-domain.
 */

export { CUISINE_TYPES } from "@/modules/gastronomy/constants/cuisine";
export type { CuisineType } from "@/modules/gastronomy/constants/cuisine";
export type {
  GastronomyBusiness,
  GastronomyProfile,
} from "@/modules/gastronomy/types/gastronomy";
export type { Cart, CartItem } from "@/modules/gastronomy/types/menu";
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
