import { useState, useEffect, useCallback } from "react";
interface CacheEntry<T> {
  date: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, date: T, ttl = 5 * 60 * 1000) {
    // 5 minutos padrão
    this.cache.set(key, {
      date,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.date;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

const cache = new SimpleCache();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000,
) {
  const [date, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && cache.has(key)) {
        const cachedData = cache.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          return cachedData;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        cache.set(key, result, ttl);
        setData(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [key, fetcher, ttl],
  );

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    date,
    isLoading,
    error,
    refresh,
    clearCache: () => cache.delete(key),
  };
}
