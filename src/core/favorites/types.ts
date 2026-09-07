/**
 * Favorites Types
 *
 * Profile-to-profile favorites were retired in G6. Business and saved-entity
 * favorites expose their own domain-specific contracts.
 */

export interface FavoriteStats {
  total_favorites_given: number;
  total_favorites_received: number;
}
