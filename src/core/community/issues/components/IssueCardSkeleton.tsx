/**
 * IssueCardSkeleton — Placeholder de carregamento para IssueCard
 */

import { Skeleton } from "@/shared/components/ui/skeleton";

export function IssueCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
    </div>
  );
}
