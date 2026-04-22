/**
 * AlertCardSkeleton — Placeholder de loading para AlertCard
 */

export function AlertCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-900 bg-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
      <div className="h-3 w-40 rounded bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded bg-muted" />
        <div className="h-7 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}
