import {
  ProfileSavedEntityService,
  type ProfileSavedEntityConfig,
} from "@/core/engagement/services/ProfileSavedEntityService";

const CLASSIFIED_FAVORITE_CONFIG = {
  tableName: "classified_favorites",
  entityIdColumn: "classified_id",
  logLabel: "classified_favorites",
} as const satisfies ProfileSavedEntityConfig;

export class ClassifiedFavoriteService {
  static getFavoriteClassifiedIds(profileId: string): Promise<string[]> {
    return ProfileSavedEntityService.getSavedEntityIds(CLASSIFIED_FAVORITE_CONFIG, profileId);
  }

  static isFavorite(classifiedId: string, profileId: string): Promise<boolean> {
    return ProfileSavedEntityService.isSaved(CLASSIFIED_FAVORITE_CONFIG, classifiedId, profileId);
  }

  static addFavorite(classifiedId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.save(CLASSIFIED_FAVORITE_CONFIG, classifiedId, profileId);
  }

  static removeFavorite(classifiedId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.remove(CLASSIFIED_FAVORITE_CONFIG, classifiedId, profileId);
  }
}
