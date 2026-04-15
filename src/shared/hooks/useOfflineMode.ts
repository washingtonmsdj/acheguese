import { useState, useEffect, useCallback } from "react";

interface CriticalData {
  emergencyContacts?: Record<string, string>;
  importantAlerts?:
    | Array<{
        id: string;
        title: string;
        content: string;
        date: string;
        type: string;
      }>
    | string[];
  [key: string]: unknown;
}

interface UseOfflineModeReturn {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  hasCriticalData: boolean;
  cacheCriticalData: (data: CriticalData) => Promise<boolean>;
  clearCache: () => Promise<boolean>;
}

const CACHE_KEY = "offline_critical_data";

export function useOfflineMode(): UseOfflineModeReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [hasCriticalData, setHasCriticalData] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verificar se Service Worker está ativo
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => setIsServiceWorkerReady(true))
        .catch(() => setIsServiceWorkerReady(false));
    }

    // Verificar se há dados críticos em cache
    const cached = localStorage.getItem(CACHE_KEY);
    setHasCriticalData(!!cached);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const cacheCriticalData = useCallback(
    async (data: CriticalData): Promise<boolean> => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setHasCriticalData(true);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setHasCriticalData(false);

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isOnline,
    isServiceWorkerReady,
    hasCriticalData,
    cacheCriticalData,
    clearCache,
  };
}
