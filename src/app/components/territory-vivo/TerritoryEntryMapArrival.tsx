export type TerritoryEntryArrivalStage = "community" | "map" | "boundary";

interface TerritoryEntryMapArrivalProps {
  label: string;
  stage?: TerritoryEntryArrivalStage;
  statusText?: string;
  leaving?: boolean;
}

const STAGE_LABEL: Record<TerritoryEntryArrivalStage, string> = {
  community: "Preparando comunidade",
  map: "Abrindo mapa",
  boundary: "Finalizando limite oficial",
};

/**
 * Skeleton visual da entrada territorial.
 *
 * Segue o mesmo princípio de skeletons de feeds sociais: representa a
 * composição final com superfícies neutras, sem inventar ruas, fronteiras ou
 * geografia. É CSS-only, não controla MapLibre e deixa o canvas carregar por
 * baixo desde o primeiro frame disponível.
 */
export function TerritoryEntryMapArrival({
  label,
  stage = "community",
  statusText = "Carregando território",
  leaving = false,
}: TerritoryEntryMapArrivalProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden bg-[hsl(var(--territory-surface)/0.88)] transition-opacity duration-150 motion-reduce:transition-none ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
      data-entry-arrival-loading
      data-entry-arrival-stage={stage}
      data-entry-arrival-leaving={leaving ? "true" : "false"}
      data-entry-skeleton
    >
      <div className="absolute inset-0 p-3 sm:p-4 md:p-5 lg:p-6">
        <div
          className="grid h-full w-full grid-cols-2 grid-rows-3 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4 lg:gap-4"
          data-entry-skeleton-grid
        >
          <span className="col-span-1 row-span-2 rounded-2xl bg-territory-raised/90 md:rounded-3xl" />
          <span className="rounded-2xl bg-territory-raised/70 md:rounded-3xl" />
          <span className="rounded-2xl bg-territory-raised/80 md:row-span-2 md:rounded-3xl" />
          <span className="hidden rounded-3xl bg-territory-raised/60 lg:block" />
          <span className="rounded-2xl bg-territory-raised/75 md:rounded-3xl" />
          <span className="rounded-2xl bg-territory-raised/60 md:rounded-3xl" />
          <span className="hidden rounded-3xl bg-territory-raised/75 lg:block" />
        </div>
      </div>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-territory-border/80 bg-territory-surface/90 px-3 py-2 shadow-sm md:left-5 md:top-5 lg:left-6 lg:top-6">
        <span className="h-2 w-2 rounded-full bg-territory-brand" />
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-territory-muted-strong md:text-[0.68rem]">
          {STAGE_LABEL[stage]}
        </span>
      </div>

      <div
        className="absolute bottom-4 left-4 z-10 flex max-w-[calc(100%_-_2rem)] items-center gap-3 rounded-2xl border border-territory-border/80 bg-territory-surface/95 px-3 py-2.5 shadow-sm md:bottom-5 md:left-5 md:max-w-sm md:px-4 md:py-3 lg:bottom-6 lg:left-6"
        data-entry-skeleton-card
      >
        <span className="h-9 w-9 shrink-0 rounded-full bg-territory-raised md:h-10 md:w-10" />
        <span className="min-w-0 flex-1">
          <span className="block h-2.5 w-28 max-w-full rounded-full bg-territory-raised md:w-36" />
          <span className="mt-2 block h-2 w-20 max-w-[72%] rounded-full bg-territory-raised/80 md:w-24" />
        </span>
        <span className="hidden max-w-40 truncate text-[0.65rem] font-medium text-territory-muted md:block">
          {statusText}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 hidden max-w-[46%] rounded-full border border-territory-border/70 bg-territory-surface/90 px-3 py-2 text-[0.65rem] font-semibold text-territory-muted-strong md:block lg:bottom-6 lg:right-6">
        <span className="block truncate">{label}</span>
      </div>

      <span
        className="animate-shimmer absolute inset-0 bg-[linear-gradient(100deg,transparent_20%,hsl(var(--territory-surface)/0.52)_48%,transparent_76%)] bg-[length:55rem_100%] opacity-70 motion-reduce:animate-none"
        aria-hidden="true"
        data-entry-skeleton-shimmer
      />
    </div>
  );
}
