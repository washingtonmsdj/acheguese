import { useCallback, useEffect, useState } from "react";
import { useSessionContext } from "@/core/session";
import { EventEngagementService } from "@/core/events";
import { logger } from "@/shared/utils/logger";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProfile } = useSessionContext();

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      if (!activeProfile?.id) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const favoriteEventIds = await EventEngagementService.getFavoriteEventIds();
      if (mounted) {
        setFavorites(favoriteEventIds);
        setIsLoading(false);
      }
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [activeProfile?.id]);

  const isFavorited = useCallback((eventId: string) => favorites.includes(eventId), [favorites]);

  const addFavorite = useCallback(async (eventId: string) => {
    if (!activeProfile?.id || favorites.includes(eventId)) return;

    setFavorites((prev) => [...prev, eventId]);
    try {
      await EventEngagementService.addFavorite(eventId);
    } catch (error) {
      setFavorites((prev) => prev.filter((id) => id !== eventId));
      logger.error("useFavorites.addFavorite", error);
    }
  }, [activeProfile?.id, favorites]);

  const removeFavorite = useCallback(async (eventId: string) => {
    if (!activeProfile?.id) return;

    const previousFavorites = favorites;
    setFavorites((prev) => prev.filter((id) => id !== eventId));
    try {
      await EventEngagementService.removeFavorite(eventId);
    } catch (error) {
      setFavorites(previousFavorites);
      logger.error("useFavorites.removeFavorite", error);
    }
  }, [activeProfile?.id, favorites]);

  const toggleFavorite = useCallback(async (eventId: string) => {
    if (favorites.includes(eventId)) {
      await removeFavorite(eventId);
      return;
    }

    await addFavorite(eventId);
  }, [addFavorite, favorites, removeFavorite]);

  const clearFavorites = useCallback(async () => {
    if (!activeProfile?.id) return;

    const previousFavorites = favorites;
    setFavorites([]);
    try {
      await EventEngagementService.clearFavorites();
    } catch (error) {
      setFavorites(previousFavorites);
      logger.error("useFavorites.clearFavorites", error);
    }
  }, [activeProfile?.id, favorites]);

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
