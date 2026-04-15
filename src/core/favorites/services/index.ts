/**
 * ⭐ FAVORITES SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  isFavorited,
  getFavoritesByProfile,
  getFavoritersOfProfile,
  getFavoriteStats,
  getFavoritesWithProfiles,
  isBusinessFavorited,
  getUserBusinessFavorites,
} from "./favorites.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  toggleBusinessFavorite,
  addBusinessFavorite,
  removeBusinessFavorite,
} from "./favorites.mutations";

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { FavoritesFacade, FavoritesService } from "./FavoritesService";

// ============================================================
// 📦 LEGACY - Alias para compatibilidade
// ============================================================
export { FavoritesService as favoritesService } from "./FavoritesService";

// ============================================================
// 📝 TYPES - Re-exports de tipos
// ============================================================
export type {
  ProfileFavorite,
  CreateFavoriteData,
  FavoriteQuery,
  FavoriteStats,
} from "../types";
