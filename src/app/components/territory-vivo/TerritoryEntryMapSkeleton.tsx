interface TerritoryEntryMapSkeletonProps {
  label: string;
  statusText?: string;
}

/**
 * Skeleton responsivo compartilhado pela entrada territorial.
 *
 * Ocupa 100% da area reservada para o mapa e usa apenas formas neutras de
 * tiles/vias. Nao representa nem aproxima nenhum limite territorial.
 */
export function TerritoryEntryMapSkeleton({
  label,
  statusText = "Carregando mapa e limite territorial oficial",
}: TerritoryEntryMapSkeletonProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-territory-raised"
      aria-hidden="true"
      data-entry-map-skeleton
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--territory-border)/0.22)_1px,transparent_1px),linear-gradient(hsl(var(--territory-border)/0.22)_1px,transparent_1px),radial-gradient(circle_at_68%_30%,hsl(var(--territory-brand)/0.12),transparent_34%),linear-gradient(145deg,hsl(var(--territory-raised)),hsl(var(--territory-surface)))]"
        style={{
          backgroundSize: "64px 64px, 64px 64px, 100% 100%, 100% 100%",
        }}
      />

      <div className="absolute inset-0 opacity-90 motion-safe:animate-pulse motion-reduce:animate-none">
        <span className="absolute left-[7%] top-[10%] h-[18%] w-[28%] rounded-2xl bg-territory-surface/55 lg:left-[8%] lg:top-[9%] lg:h-[16%] lg:w-[24%] lg:rounded-3xl" />
        <span className="absolute right-[8%] top-[16%] h-[22%] w-[34%] rounded-2xl bg-territory-surface/45 lg:right-[9%] lg:top-[12%] lg:h-[24%] lg:w-[30%] lg:rounded-3xl" />
        <span className="absolute left-[28%] top-[42%] h-[19%] w-[38%] rounded-2xl bg-territory-surface/50 lg:left-[32%] lg:top-[39%] lg:h-[20%] lg:w-[31%] lg:rounded-3xl" />
        <span className="absolute bottom-[13%] right-[9%] hidden h-[18%] w-[24%] rounded-3xl bg-territory-surface/45 lg:block" />
        <span className="absolute bottom-[12%] left-[7%] hidden h-[21%] w-[20%] rounded-3xl bg-territory-surface/50 xl:block" />
      </div>

      <div className="absolute inset-0 overflow-hidden opacity-65" aria-hidden="true">
        <span className="absolute -left-[12%] top-[34%] h-2 w-[76%] rotate-[7deg] rounded-full bg-territory-surface/75 lg:h-3 lg:w-[70%]" />
        <span className="absolute -right-[14%] top-[54%] h-2 w-[78%] -rotate-[10deg] rounded-full bg-territory-surface/70 lg:h-3 lg:w-[72%]" />
        <span className="absolute left-[54%] top-[-14%] h-[78%] w-2 rotate-[18deg] rounded-full bg-territory-surface/65 lg:w-3" />
        <span className="absolute left-[17%] top-[8%] hidden h-[92%] w-2 -rotate-[24deg] rounded-full bg-territory-surface/55 lg:block lg:w-3" />
      </div>

      <div className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-territory-border bg-territory-surface/80 px-3 py-2 text-xs font-medium text-territory-muted-strong shadow-sm backdrop-blur-sm lg:flex">
        <span className="h-2 w-2 rounded-full bg-territory-brand/55 motion-safe:animate-pulse motion-reduce:animate-none" />
        Preparando visualizacao territorial
      </div>

      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-territory-border bg-territory-surface/95 px-3.5 py-3 shadow-territory-highlight backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:px-4 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[min(30rem,calc(100%-3rem))] lg:rounded-3xl lg:px-5 lg:py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-brand/10 lg:h-11 lg:w-11">
            <span className="h-2.5 w-2.5 rounded-full bg-territory-brand lg:h-3 lg:w-3" />
            <span className="absolute h-7 w-7 rounded-full border border-territory-brand/30 motion-safe:animate-ping motion-reduce:animate-none lg:h-9 lg:w-9" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm font-semibold text-territory-ink lg:text-base">
              {label}
            </strong>
            <small className="mt-0.5 block truncate text-[0.68rem] text-territory-muted-strong sm:text-xs lg:mt-1 lg:text-sm">
              Salvador · BA · {statusText}
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}
