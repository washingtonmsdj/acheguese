/**
 * AlertCardSkeleton — Placeholder de loading para AlertCard.
 */

export function AlertCardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-3 rounded-2xl border-2 border-territory-error/20 bg-territory-surface p-4"
      role="status"
      aria-label="Carregando alerta"
    >
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-territory-raised" />
        <div className="h-5 w-32 rounded bg-territory-raised" />
        <div className="h-5 w-16 rounded bg-territory-raised" />
      </div>
      <div className="h-3 w-40 rounded bg-territory-raised" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-territory-raised" />
        <div className="h-3 w-4/5 rounded bg-territory-raised" />
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-20 rounded bg-territory-raised" />
        <div className="h-7 w-24 rounded bg-territory-raised" />
      </div>
    </div>
  );
}
