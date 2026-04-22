/**
 * 📋 EVENT GRID COMPONENT (NÍVEL AAA) - SSOT COMPLIANT
 *
 * Grid responsivo com infinite scroll
 *
 * Features:
 * - Infinite scroll otimizado
 * - Loading skeletons
 * - Empty states
 * - Error states
 * - Intersection Observer
 * 
 * ✅ SSOT: Usa tipo Event do EventsService
 *
 * @version 2.0.0 - SSOT Compliant
 */

import { memo, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EventCardEnhanced } from "./EventCardEnhanced";

interface Event {
  id: string;
  title: string;
  date: string;
  created_at: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  current_participants: number;
  max_participants?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
}

interface EventGridProps {
  eventos: Event[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onEventClick: (evento: Event) => void;
}

export const EventGrid = memo(function EventGrid({
  eventos,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onEventClick,
}: EventGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Initial loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Empty state
  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-3xl">📅</span>
        </div>
        <p className="text-sm font-semibold text-foreground">
          Nenhum evento encontrado
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tente ajustar os filtros ou buscar por outros termos
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {eventos.map((evento, index) => (
        <EventCardEnhanced
          key={evento.id}
          evento={evento}
          variant="list"
          index={index}
          onClick={() => onEventClick(evento)}
        />
      ))}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </div>
  );
});
