export {
  getFavoriteStats,
  getFavoritesByProfile,
  getFavoritesWithProfiles,
  getFavoritersOfProfile,
  getCurrentUserBusinessFavorites,
  isBusinessFavorited,
  isFavorited,
} from "./favorites.queries";

export {
  addBusinessFavorite,
  addFavorite,
  removeBusinessFavorite,
  removeFavorite,
  setBusinessFavorite,
  toggleFavorite,
} from "./favorites.mutations";

export type {
  CreateFavoriteData,
  FavoriteQuery,
  FavoriteStats,
  ProfileFavorite,
} from "../types";

export {
  BusinessFavoriteStore,
  type BusinessFavoriteRecord,
  type ListBusinessFavoritesInput,
  type PatchBusinessFavoriteInput,
} from "./BusinessFavoriteStore";
