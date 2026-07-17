import { ProfileSavedEntityService } from '@/core/engagement/services/ProfileSavedEntityService';

export class TouristPointSavedService {
  static getSavedTouristPointIds(): Promise<string[]> {
    return ProfileSavedEntityService.getSavedEntityIds('tourist_point');
  }

  static isSaved(touristPointId: string): Promise<boolean> {
    return ProfileSavedEntityService.isSaved('tourist_point', touristPointId);
  }

  static save(touristPointId: string): Promise<void> {
    return ProfileSavedEntityService.save('tourist_point', touristPointId);
  }

  static remove(touristPointId: string): Promise<void> {
    return ProfileSavedEntityService.remove('tourist_point', touristPointId);
  }
}
