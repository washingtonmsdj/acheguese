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
      className="pointer-events-none absolute inset-0 z-20 isolate overflow-hidden bg-territory-surface"
      aria-hidden="true"
      data-entry-map-skeleton
    >
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(90deg, hsl(var(--territory-border) / 0.5) 1px, transparent 1px), linear-gradient(hsl(var(--territory-border) / 0.5) 1px, transparent 1px), radial-gradient(circle at 70% 24%, hsl(var(--territory-brand) / 0.16), transparent 32%), linear-gradient(145deg, hsl(var(--territory-raised)), hsl(var(--territory-surface)))",
          backgroundSize: "56px 56px, 56px 56px, 100% 100%, 100% 100%",
        }}
      />

      <div
        className="absolute inset-0 motion-safe:animate-pulse motion-reduce:animate-none"
        aria-hidden="true"
      >
        <span className="absolute left-[6%] top-[8%] h-[20%] w-[30%] rounded-2xl border border-territory-border bg-territory-raised shadow-sm lg:left-[7%] lg:top-[8%] lg:h-[18%] lg:w-[25%] lg:rounded-3xl" />
        <span className="absolute right-[7%] top-[14%] h-[24%] w-[36%] rounded-2xl border border-territory-border bg-territory-raised shadow-sm lg:right-[8%] lg:top-[11%] lg:h-[25%] lg:w-[31%] lg:rounded-3xl" />
        <span className="absolute left-[24%] top-[42%] h-[21%] w-[42%] rounded-2xl border border-territory-border bg-territory-raised shadow-sm lg:left-[31%] lg:top-[39%] lg:h-[22%] lg:w-[32%] lg:rounded-3xl" />
        <span className="absolute bottom-[12%] right-[8%] hidden h-[20%] w-[25%] rounded-3xl border border-territory-border bg-territory-raised shadow-sm lg:block" />
        <span className="absolute bottom-[11%] left-[6%] hidden h-[22%] w-[21%] rounded-3xl border border-territory-border bg-territory-raised shadow-sm xl:block" />
      </div>

      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -left-[12%] top-[31%] h-2.5 w-[78%] rotate-[7deg] rounded-full bg-territory-border/80 shadow-sm lg:h-3.5 lg:w-[72%]" />
        <span className="absolute -right-[14%] top-[55%] h-2.5 w-[80%] -rotate-[10deg] rounded-full bg-territory-border/80 shadow-sm lg:h-3.5 lg:w-[74%]" />
        <span className="absolute left-[55%] top-[-15%] h-[82%] w-2.5 rotate-[18deg] rounded-full bg-territory-border/75 shadow-sm lg:w-3.5" />
        <span className="absolute left-[17%] top-[5%] hidden h-[96%] w-2.5 -rotate-[24deg] rounded-full bg-territory-border/70 shadow-sm lg:block lg:w-3.5" />
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-territory-brand/10 motion-safe:animate-pulse motion-reduce:animate-none"
        aria-hidden="true"
      />

      <div className="absolute right-5 top-5 hidden items-center gap-2 rounded-full border border-territory-border bg-territory-surface px-3 py-2 text-xs font-semibold text-territory-muted-strong shadow-sm lg:flex">
        <span className="h-2 w-2 rounded-full bg-territory-brand" />
        Preparando mapa
      </div>

      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-territory-border bg-territory-surface px-3.5 py-3 shadow-territory-highlight sm:inset-x-4 sm:bottom-4 sm:px-4 lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[30rem] lg:max-w-[calc(100%_-_3rem)] lg:rounded-3xl lg:px-5 lg:py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-territory-border bg-territory-raised lg:h-11 lg:w-11">
            <span className="h-2.5 w-2.5 rounded-full bg-territory-brand lg:h-3 lg:w-3" />
            <span className="absolute h-7 w-7 rounded-full border border-territory-brand/40 motion-safe:animate-ping motion-reduce:animate-none lg:h-9 lg:w-9" />
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
