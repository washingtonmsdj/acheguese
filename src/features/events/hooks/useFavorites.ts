/**
 * ⭐ USE FAVORITES HOOK
 * 
 * Hook para gerenciar favoritos de eventos
 * Persiste no localStorage e sincroniza entre abas
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'acheguese_event_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(new CustomEvent('favorites-updated', { detail: favorites }));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    }
  }, [favorites, isLoading]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFavorites(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Failed to sync favorites:', error);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      setFavorites(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favorites-updated', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favorites-updated', handleCustomEvent as EventListener);
    };
  }, []);

  // Check if event is favorited
  const isFavorited = useCallback((eventId: string) => {
    return favorites.includes(eventId);
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  }, []);

  // Add favorite
  const addFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      if (!prev.includes(eventId)) {
        return [...prev, eventId];
      }
      return prev;
    });
  }, []);

  // Remove favorite
  const removeFavorite = useCallback((eventId: string) => {
    setFavorites(prev => prev.filter(id => id !== eventId));
  }, []);

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

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
