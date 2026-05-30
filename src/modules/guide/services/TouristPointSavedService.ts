import {
  ProfileSavedEntityService,
  type ProfileSavedEntityConfig,
} from '@/core/engagement/services/ProfileSavedEntityService';

const TOURIST_POINT_SAVED_CONFIG = {
  tableName: 'tourist_point_saved_items',
  entityIdColumn: 'tourist_point_id',
  logLabel: 'tourist_point_saved_items',
} as const satisfies ProfileSavedEntityConfig;

export class TouristPointSavedService {
  static getSavedTouristPointIds(profileId: string): Promise<string[]> {
    return ProfileSavedEntityService.getSavedEntityIds(TOURIST_POINT_SAVED_CONFIG, profileId);
  }

  static isSaved(touristPointId: string, profileId: string): Promise<boolean> {
    return ProfileSavedEntityService.isSaved(
      TOURIST_POINT_SAVED_CONFIG,
      touristPointId,
      profileId,
    );
  }

  static save(touristPointId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.save(
      TOURIST_POINT_SAVED_CONFIG,
      touristPointId,
      profileId,
    );
  }

  static remove(touristPointId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.remove(
      TOURIST_POINT_SAVED_CONFIG,
      touristPointId,
      profileId,
    );
  }
}
