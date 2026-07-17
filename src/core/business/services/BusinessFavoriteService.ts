import {
  BusinessFavoriteStore,
  type BusinessFavoriteRecord,
  type ListBusinessFavoritesInput,
  type PatchBusinessFavoriteInput,
} from '@/core/favorites/services/BusinessFavoriteStore';

export class BusinessFavoriteService {
  static listCurrentUserFavorites(
    input: ListBusinessFavoritesInput = {},
  ): Promise<BusinessFavoriteRecord[]> {
    return BusinessFavoriteStore.list(input);
  }

  static getFavoriteIdsForBusinesses(
    businessDataIds: string[],
  ): Promise<string[]> {
    return BusinessFavoriteStore.getFavoritedBusinessIds(businessDataIds);
  }

  static isFavorited(businessDataId: string): Promise<boolean> {
    return BusinessFavoriteStore.isFavorited(businessDataId);
  }

  static setFavorite(
    businessDataId: string,
    favorited: boolean,
  ): Promise<boolean> {
    return BusinessFavoriteStore.setFavorited(businessDataId, favorited);
  }

  static updatePreferences(
    favoriteId: string,
    input: PatchBusinessFavoriteInput,
  ): Promise<BusinessFavoriteRecord> {
    return BusinessFavoriteStore.patchPreferences(favoriteId, input);
  }

  static getFavoritesCount(businessDataId: string): Promise<number> {
    return BusinessFavoriteStore.getBusinessFavoritesCount(businessDataId);
  }
}
