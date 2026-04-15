import { useState, useCallback, useEffect } from "react";
import { useSessionContext } from "@/core/session";
import { useProfileLocation } from '@/core/profiles/hooks/useProfileLocation';
import type {
  ProfileStats,
  Business,
  Profile,
} from "@/core/profiles/services/types";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";
import { FavoritesService } from "@/core/favorites/services/FavoritesService";
import { postService } from "@/core/posts/services";

/**
 * ✅ SSOT COMPLIANT - Hook useProfile
 * @deprecated Migrar consumidores para useSessionContext diretamente
 */
export function useProfile() {
  const {
    user,
    activeProfile,
    isLoading: activeProfileLoading,
    profiles,
  } = useSessionContext();
  const { location, loading: locationLoading } = useProfileLocation();

  const [stats, setStats] = useState<ProfileStats>({
    posts: 0,
    likes: 0,
    favorites: 0,
    businesses: 0,
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Converter activeProfile para formato Profile do SSOT
  const profile: Profile | null = activeProfile
    ? {
        id: activeProfile.id,
        user_id: activeProfile.userId || user?.id || "",
        // eslint-disable-next-line session-context/no-permission-inference
        profile_type: (activeProfile.profileType as any) || "personal",
        name: activeProfile.name || activeProfile.displayName || "",
        display_name: activeProfile.displayName || "",
        username: activeProfile.username || "",
        bio: activeProfile.bio || "",
        city: activeProfile.city || location?.city || "",
        neighborhood: activeProfile.neighborhood || location?.neighborhood || "",
        state: activeProfile.state || location?.state || "",
        telefone: activeProfile.telefone || "",
        whatsapp: activeProfile.whatsapp || "",
        location_id: activeProfile.locationId || "",
        verified: activeProfile.verified ?? false,
        reputation: 0,
        // eslint-disable-next-line session-context/no-permission-inference
        is_active: activeProfile.isActive ?? true,
        is_suspended: false,
        created_at: activeProfile.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  const loadStats = useCallback(async () => {
    if (!profile?.id || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        rolesResult,
        postsResult,
        likesResult,
        businessesResult,
        favoritesResult,
      ] = await Promise.all([
        profileService.getUserRoles(user.id),
        postService.getPostsCountByProfile(profile.id),
        profileService.getUserLikesCount(profile.id),
        profileService.getUserBusinessesByProfiles(profiles.map((p) => p.id)),
        profileService
          .getActiveProfile(user.id)
          .then((activeProfile) =>
            activeProfile
              ? FavoritesService.getFavoriteStats(activeProfile.id)
              : { total_favorites_given: 0, total_favorites_received: 0 },
          )
          .then((stats) => ({ count: stats.total_favorites_given })),
      ]);

      setRoles(rolesResult);

      const mappedBusinesses: Business[] = businessesResult.map((b: any) => ({
        id: b.profile_id,
        name: b.business_name,
        logo: "",
        category: b.category,
        rating: 0,
        neighborhood: location?.neighborhood || "",
        city: location?.city || "",
        verified: b.is_verified || false,
        slug: "",
        is_premium: b.is_premium || false,
        aberto: true,
        nicho: b.category,
      }));

      setMyBusinesses(mappedBusinesses);

      setStats({
        posts: postsResult || 0,
        likes: likesResult || 0,
        favorites: favoritesResult.count || 0,
        businesses: mappedBusinesses.length,
      });
    } catch (err: any) {
      logger.error("Error loading profile stats:", err);
      setError(err.message || "Error loading profile stats");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, user?.id, profiles, location]);

  useEffect(() => {
    if (!locationLoading) {
      loadStats();
    }
  }, [loadStats, locationLoading]);

  return {
    profile,
    currentProfile: profile,
    stats,
    roles,
    myBusinesses,
    loading: activeProfileLoading || locationLoading || loading,
    error,
    refetch: loadStats,
    setProfile: () => {
      logger.warn(
        "setProfile is deprecated. Use switchProfile from useSessionContext instead.",
      );
    },
  };
}
