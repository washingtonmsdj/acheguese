export {
  getFavoriteStats,
  getFavoritesByProfile,
  getFavoritesWithProfiles,
  getFavoritersOfProfile,
  getUserBusinessFavorites,
  isBusinessFavorited,
  isFavorited,
} from "./favorites.queries";

export {
  addBusinessFavorite,
  addFavorite,
  removeBusinessFavorite,
  removeFavorite,
  toggleBusinessFavorite,
  toggleFavorite,
} from "./favorites.mutations";

export type {
  CreateFavoriteData,
  FavoriteQuery,
  FavoriteStats,
  ProfileFavorite,
} from "../types";
