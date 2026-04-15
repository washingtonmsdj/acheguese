import React from "react";
import { useEffect, useRef } from "react";
/**
 * Componente trigger para infinite scroll
 *
 * Requirement 19: Otimizações de Performance
 * - Detectar quando usuário chega ao final da lista
 * - Disparar loadMore automaticamente
 */

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(triggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="h-20 flex items-center justify-center">
      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Loading mais posts...
        </div>
      )}
    </div>
  );
}
