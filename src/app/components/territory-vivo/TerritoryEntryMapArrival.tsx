export type TerritoryEntryArrivalStage = "community" | "map" | "boundary";

interface TerritoryEntryMapArrivalProps {
  label: string;
  stage?: TerritoryEntryArrivalStage;
  statusText?: string;
  leaving?: boolean;
}

const ARRIVAL_COPY: Record<
  TerritoryEntryArrivalStage,
  { eyebrow: string; title: string; detail: string }
> = {
  community: {
    eyebrow: "Sua chegada começa aqui",
    title: "Preparando sua chegada",
    detail: "Reconhecendo a comunidade enquanto o mapa já começa a carregar.",
  },
  map: {
    eyebrow: "Abrindo caminho",
    title: "Abrindo o mapa do Complexo",
    detail: "Conectando o território para você se achegar.",
  },
  boundary: {
    eyebrow: "Quase lá",
    title: "Finalizando o território",
    detail: "Aplicando o limite oficial do Complexo.",
  },
};

/**
 * Placeholder visual ultraleve da entrada territorial.
 *
 * Regras:
 * - não importa ícones, SVGs, mapa ou bibliotecas de animação;
 * - não possui timer nem controla o carregamento do MapLibre;
 * - só ocupa a área visual enquanto runtime, style e boundary carregam em paralelo;
 * - deixa o canvas aparecer progressivamente por baixo, sem funcionar como cortina;
 * - animação única e opcional, desativada por prefers-reduced-motion.
 */
export function TerritoryEntryMapArrival({
  label,
  stage = "community",
  statusText = "Preparando sua chegada ao território",
  leaving = false,
}: TerritoryEntryMapArrivalProps) {
  const copy = ARRIVAL_COPY[stage];
  const stageIndex = stage === "community" ? 0 : stage === "map" ? 1 : 2;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-150 motion-reduce:transition-none ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
      data-entry-arrival-loading
      data-entry-arrival-stage={stage}
      data-entry-arrival-leaving={leaving ? "true" : "false"}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 52%, hsl(var(--territory-brand) / 0.12), transparent 30%), radial-gradient(circle at 88% 15%, hsl(var(--territory-sun) / 0.10), transparent 26%), linear-gradient(145deg, hsl(var(--territory-raised) / 0.84), hsl(var(--territory-surface) / 0.88))",
        }}
      />

      <div className="absolute inset-0 flex items-center px-4 py-3 sm:px-5 md:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-[54rem] grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-7 lg:grid-cols-[8rem_minmax(0,1fr)] lg:gap-10">
          <div
            className="relative grid h-14 w-14 place-items-center justify-self-center rounded-full border border-territory-brand/20 bg-territory-surface/90 shadow-sm md:h-20 md:w-20 lg:h-28 lg:w-28"
            data-entry-arrival-signal
          >
            <span className="absolute inset-[14%] rounded-full border border-territory-brand/20" />
            <span className="absolute left-1/2 top-[14%] h-[72%] w-px -translate-x-1/2 bg-territory-brand/18" />
            <span className="absolute left-[14%] top-1/2 h-px w-[72%] -translate-y-1/2 bg-territory-brand/18" />
            <span className="absolute left-[24%] top-[18%] h-[64%] w-[52%] rounded-[50%] border-x border-territory-brand/18" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-territory-brand shadow-[0_0_0_5px_hsl(var(--territory-brand)/0.10)] motion-safe:animate-pulse motion-reduce:animate-none md:h-3 md:w-3" />
            <span className="absolute -right-0.5 top-2 h-2.5 w-2.5 rounded-full bg-territory-sun ring-2 ring-territory-surface md:right-0 md:top-3 md:h-3 md:w-3" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-territory-brand" />
              <p className="truncate text-[0.6rem] font-bold uppercase tracking-[0.16em] text-territory-brand md:text-[0.68rem] lg:text-xs">
                {copy.eyebrow}
              </p>
            </div>

            <p className="mt-1 font-heading text-base font-bold leading-[1.12] tracking-[-0.025em] text-territory-ink md:mt-1.5 md:text-xl lg:text-[1.75rem]">
              {copy.title}
            </p>
            <p className="mt-1 max-w-xl text-[0.68rem] font-medium leading-4 text-territory-muted-strong md:text-sm md:leading-5 lg:text-[0.95rem]">
              {copy.detail}
            </p>
            <p className="mt-1 truncate text-[0.6rem] font-semibold text-territory-muted md:mt-2 md:text-xs lg:text-sm">
              {label} · Salvador · BA
            </p>

            <div className="mt-2.5 flex items-center gap-2 md:mt-3" data-entry-arrival-progress>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-150 motion-reduce:transition-none ${
                    index === stageIndex
                      ? "w-6 bg-territory-brand"
                      : index < stageIndex
                        ? "w-2.5 bg-territory-brand/55"
                        : "w-2.5 bg-territory-border"
                  }`}
                />
              ))}
              <span className="ml-1 hidden truncate text-[0.65rem] font-medium text-territory-muted md:block lg:text-xs">
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
