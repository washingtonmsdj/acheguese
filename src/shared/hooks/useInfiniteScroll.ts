import { useEffect, useRef, useCallback, useState } from "react";
interface UseInfiniteScrollOptions {
  /** Number of items per page */
  pageSize?: number;
  /** Whether there's more date to load */
  hasMore: boolean;
  /** Whether currently loading */
  loading: boolean;
  /** Callback to load next page */
  onLoadMore: () => void;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadTriggeredRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      loadTriggeredRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !loadTriggeredRef.current
        ) {
          loadTriggeredRef.current = true;
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, rootMargin]);

  return { sentinelRef };
}

const PAGE_SIZE = 20;

export function usePaginatedState<T>() {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const appendItems = useCallback((newItems: T[], isFirstPage: boolean) => {
    if (isFirstPage) {
      setItems(newItems);
    } else {
      setItems((prev) => [...prev, ...newItems]);
    }
    setHasMore(newItems.length >= PAGE_SIZE);
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
  }, []);

  return {
    items,
    page,
    hasMore,
    loading,
    initialLoading,
    setLoading,
    setInitialLoading,
    appendItems,
    nextPage,
    reset,
    PAGE_SIZE,
  };
}
