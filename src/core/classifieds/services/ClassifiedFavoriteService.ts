import { ProfileSavedEntityService } from "@/core/engagement/services/ProfileSavedEntityService";

export class ClassifiedFavoriteService {
  static getFavoriteClassifiedIds(): Promise<string[]> {
    return ProfileSavedEntityService.getSavedEntityIds("classified");
  }

  static isFavorite(classifiedId: string): Promise<boolean> {
    return ProfileSavedEntityService.isSaved("classified", classifiedId);
  }

  static addFavorite(classifiedId: string): Promise<void> {
    return ProfileSavedEntityService.save("classified", classifiedId);
  }

  static removeFavorite(classifiedId: string): Promise<void> {
    return ProfileSavedEntityService.remove("classified", classifiedId);
  }
}
