/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import type { CommunityPost } from "../types";
import { logger } from "@/shared/utils/logger";
import { postService } from "@/core/posts/services";

interface SearchFilters {
  query: string;
  tags?: string[];
  author?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SearchResult {
  posts: CommunityPost[];
  total: number;
  suggestions: string[];
}

type SearchPostLike = CommunityPost & { created_at?: string | null };

export function useSearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({ query: "" });
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    total: 0,
    suggestions: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const debounce = <TArgs extends unknown[]>(
    func: (...args: TArgs) => void | Promise<void>,
    wait: number,
  ): ((...args: TArgs) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: TArgs) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const performSearch = async (searchFilters: SearchFilters) => {
    if (!searchFilters.query.trim()) {
      setResults({ posts: [], total: 0, suggestions: [] });
      return;
    }

    setIsSearching(true);

    try {
      const q = searchFilters.query.trim();
      const postTypes = ["post", "alert", "help_request", "recommendation", "event"];
      const batches = await Promise.all(
        postTypes.map((type) => postService.getPostsByType(type, { search: q })),
      );
      const posts = (batches as any)
        .flat()
        .sort((a: SearchPostLike, b: SearchPostLike) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 20) as unknown as CommunityPost[];
      const hashtagCounts = new Map<string, number>();
      for (const post of posts as Array<{ content?: string | null }>) {
        const content = post.content || "";
        const tags = content.match(/#[\p{L}\p{N}_-]+/gu) || [];
        for (const tag of tags) {
          const normalized = tag.toLowerCase();
          hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1);
        }
      }

      const suggestions = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag]) => tag);

      setResults({
        posts,
        total: posts.length,
        suggestions,
      });

      setSearchHistory((prev) => {
        const newHistory = [
          searchFilters.query,
          ...prev.filter((existing) => existing !== searchFilters.query),
        ].slice(0, 5);
        localStorage.setItem("search_history", JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      logger.error("Erro na busca:", error);
      setResults({ posts: [], total: 0, suggestions: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      performSearch(searchFilters);
    }, 500),
    [],
  );

  const search = (newQuery: string) => {
    setQuery(newQuery);
    const newFilters = { ...filters, query: newQuery };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const clearSearch = () => {
    setQuery("");
    setFilters({ query: "" });
    setResults({ posts: [], total: 0, suggestions: [] });
  };

  const removeFromHistory = (item: string) => {
    setSearchHistory((prev) => {
      const newHistory = prev.filter((q) => q !== item);
      localStorage.setItem("search_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        logger.error("Error load historico:", error);
      }
    }
  }, []);

  return {
    query,
    results,
    isSearching,
    searchHistory,
    search,
    clearSearch,
    removeFromHistory,
  };
}
