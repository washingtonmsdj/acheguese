/**
 * ⭐ FAVORITES SERVICE - FACHADA SSOT v2.0
 *
 * ✅ Ponto único de entrada para operações de favoritos
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v2.0.0:
 * - Queries → favorites.queries.ts
 * - Mutations → favorites.mutations.ts
 * - Types → ../types.ts (SSOT)
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 📦 QUERIES - Operações de leitura
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
// ✏️ MUTATIONS - Operações de escrita
// ============================================================
export {
  addFavorite,
  removeFavorite,
  toggleFavorite,
  toggleBusinessFavorite,
  addBusinessFavorite,
  removeBusinessFavorite,
} from "./favorites.mutations";

// Re-exports de types
export type {
  ProfileFavorite,
  CreateFavoriteData,
  FavoriteQuery,
  FavoriteStats,
} from "../types";

// ============================================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================================

import * as FavoritesQueries from "./favorites.queries";
import * as FavoritesMutations from "./favorites.mutations";

/**
 * ⭐ FavoritesFacade - Interface SSOT unificada v2.0
 *
 * Uso: FavoritesFacade.queries.isFavorited(profileId, userId)
 *      FavoritesFacade.mutations.addFavorite(data)
 *      FavoritesFacade.mutations.toggleFavorite(profileId, userId)
 */
export const FavoritesFacade = {
  queries: FavoritesQueries,
  mutations: FavoritesMutations,
} as const;

/**
 * @deprecated Use FavoritesFacade ou os exports diretos dos módulos favorites.queries e favorites.mutations
 * FavoritesService como classe estática mantido para compatibilidade.
 */
export class FavoritesService {
  // ===== PROFILE FAVORITES =====
  static isFavorited = FavoritesQueries.isFavorited;
  static addFavorite = FavoritesMutations.addFavorite;
  static removeFavorite = FavoritesMutations.removeFavorite;
  static toggleFavorite = FavoritesMutations.toggleFavorite;
  static getFavoritesByProfile = FavoritesQueries.getFavoritesByProfile;
  static getFavoritersOfProfile = FavoritesQueries.getFavoritersOfProfile;
  static getFavoriteStats = FavoritesQueries.getFavoriteStats;
  static getFavoritesWithProfiles = FavoritesQueries.getFavoritesWithProfiles;

  // ===== BUSINESS FAVORITES =====
  static isBusinessFavorited = FavoritesQueries.isBusinessFavorited;
  static toggleBusinessFavorite = FavoritesMutations.toggleBusinessFavorite;
  static addBusinessFavorite = FavoritesMutations.addBusinessFavorite;
  static removeBusinessFavorite = FavoritesMutations.removeBusinessFavorite;
  static getUserBusinessFavorites = FavoritesQueries.getUserBusinessFavorites;
}
