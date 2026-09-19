export {
  getCurrentUserBusinessFavorites,
  isBusinessFavorited,
} from "./favorites.queries";

export {
  addBusinessFavorite,
  removeBusinessFavorite,
  setBusinessFavorite,
} from "./favorites.mutations";

export {
  BusinessFavoriteStore,
  type BusinessFavoriteRecord,
  type ListBusinessFavoritesInput,
  type PatchBusinessFavoriteInput,
} from "./BusinessFavoriteStore";
