/**
 * Event skeleton
 * 
 * Loading states premium para eventos
 * 
 * @version 2.0.0
 */

import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';

interface EventSkeletonProps {
  variant?: 'detail' | 'card' | 'compact';
  className?: string;
}

export function EventSkeleton({ variant = 'detail', className }: EventSkeletonProps) {
  // ============================================================================
  // DETAIL PAGE SKELETON
  // ============================================================================
  
  if (variant === 'detail') {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        {/* Hero Skeleton */}
        <div className="relative h-[500px] bg-muted animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="space-y-12">
            {/* Tickets */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CARD SKELETON
  // ============================================================================
  
  if (variant === 'card') {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
        <Skeleton className="aspect-[16/9] w-full" />
        <div className="p-5 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // COMPACT SKELETON
  // ============================================================================
  
  return (
    <div className={cn("flex gap-4 rounded-xl border border-border bg-card p-4", className)}>
      <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
