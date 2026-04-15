/**
 * GATE 3 - FASE 3A: Tipos para o novo modelo de favorites
 * Modelo corrigido para consistência de identidade
 */

export interface ProfileFavorite {
  id: string;
  favorited_profile_id: string; // Profile que está sendo favoritado
  favoriting_profile_id: string; // Profile que está favoritando
  created_at: string;
}

export interface CreateFavoriteData {
  favorited_profile_id: string;
  favoriting_profile_id: string;
}

export interface FavoriteQuery {
  favorited_profile_id?: string;
  favoriting_profile_id?: string;
}

// Tipos para compatibilidade durante migração
export interface LegacyProfileFavorite {
  id: string;
  profile_id: string; // Profile favoritado (legacy)
  user_id: string; // User que favoritou (legacy)
  created_at: string;
}

// Tipo para operações de favoritos
export interface FavoriteOperation {
  type: "add" | "remove";
  favorited_profile_id: string;
  favoriting_profile_id: string;
}

// Tipo para estatísticas de favoritos
export interface FavoriteStats {
  total_favorites_given: number; // Quantos profiles este profile favoritou
  total_favorites_received: number; // Quantas vezes este profile foi favoritado
}
