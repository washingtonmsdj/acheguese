/**
 * Favorites Types
 */

export interface ProfileFavorite {
  id: string;
  favorited_profile_id: string;
  favoriting_profile_id: string;
  created_at: string;
}

export interface CreateFavoriteData {
  favorited_profile_id: string;
  favoriting_profile_id: string;
}

export interface FavoriteQuery {
  favoriting_profile_id?: string;
  favorited_profile_id?: string;
  limit?: number;
  offset?: number;
}

export interface FavoriteStats {
  total_favorites_given: number;
  total_favorites_received: number;
}
