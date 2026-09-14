import {
  Check,
  Globe2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type TerritoryEntryArrivalStage = "community" | "map" | "boundary";

interface TerritoryEntryMapArrivalProps {
  label: string;
  stage?: TerritoryEntryArrivalStage;
  statusText?: string;
}

const ARRIVAL_STAGES = [
  {
    id: "community" as const,
    label: "Comunidade",
    icon: UsersRound,
    eyebrow: "Sua chegada começa aqui",
    title: "Encontrando sua comunidade",
    detail: "Preparando a casa para você se achegar.",
  },
  {
    id: "map" as const,
    label: "Mapa",
    icon: MapPinned,
    eyebrow: "Abrindo caminho",
    title: "Conectando você ao território",
    detail: "Organizando o mapa do Complexo para a sua chegada.",
  },
  {
    id: "boundary" as const,
    label: "Limite oficial",
    icon: ShieldCheck,
    eyebrow: "Quase lá",
    title: "Seu território está quase pronto",
    detail: "Conferindo o limite oficial antes de revelar o mapa.",
  },
] as const;

/**
 * Experiência premium de chegada da entrada territorial.
 *
 * O estado visual acompanha o estágio real do carregamento. Não simula mapa,
 * ruas ou fronteiras e não usa progresso artificial baseado apenas em tempo.
 */
export function TerritoryEntryMapArrival({
  label,
  stage = "community",
  statusText = "Preparando sua chegada ao território",
}: TerritoryEntryMapArrivalProps) {
  const activeStageIndex = Math.max(
    0,
    ARRIVAL_STAGES.findIndex((item) => item.id === stage),
  );
  const activeStage = ARRIVAL_STAGES[activeStageIndex];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 isolate overflow-hidden bg-territory-surface"
      aria-hidden="true"
      data-entry-arrival-loading
      data-entry-arrival-stage={stage}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 23% 50%, hsl(var(--territory-brand) / 0.18), transparent 29%), radial-gradient(circle at 88% 13%, hsl(var(--territory-sun) / 0.12), transparent 25%), radial-gradient(circle at 76% 88%, hsl(var(--territory-brand) / 0.08), transparent 31%), linear-gradient(145deg, hsl(var(--territory-raised)), hsl(var(--territory-surface)))",
        }}
      />

      <span
        className="absolute -left-12 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-territory-brand/10 md:h-60 md:w-60 lg:-left-24 lg:h-[28rem] lg:w-[28rem]"
        aria-hidden="true"
      />
      <span
        className="absolute -right-14 -top-14 h-36 w-36 rounded-full border border-territory-sun/10 md:h-56 md:w-56 lg:h-72 lg:w-72"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center px-3 py-2 sm:px-4 md:px-7 md:py-5 lg:px-10 xl:px-14">
        <div className="mx-auto grid w-full max-w-[58rem] grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-x-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-10">
          <div className="relative grid h-12 w-12 place-items-center justify-self-center md:h-20 md:w-20 lg:h-40 lg:w-40">
            <span
              className="absolute inset-[-0.25rem] rounded-full border border-territory-brand/15 motion-safe:animate-spin motion-reduce:animate-none md:inset-[-0.55rem] lg:inset-[-0.85rem]"
              style={{ animationDuration: "12s" }}
            >
              <span className="absolute left-1/2 top-[-0.2rem] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-territory-brand shadow-sm md:h-2 md:w-2 lg:h-2.5 lg:w-2.5" />
            </span>
            <span
              className="absolute inset-[-0.7rem] rounded-full border border-territory-brand/10 motion-safe:animate-spin motion-reduce:animate-none md:inset-[-1rem] lg:inset-[-1.55rem]"
              style={{ animationDuration: "18s", animationDirection: "reverse" }}
            >
              <span className="absolute right-[8%] top-[17%] h-1 w-1 rounded-full bg-territory-sun md:h-1.5 md:w-1.5 lg:h-2 lg:w-2" />
            </span>

            <span className="absolute inset-0 rounded-2xl border border-territory-border bg-territory-surface/95 shadow-territory-highlight backdrop-blur-sm md:rounded-[1.65rem] lg:rounded-[2.5rem]" />
            <Globe2
              className="relative h-6 w-6 text-territory-brand md:h-9 md:w-9 lg:h-16 lg:w-16"
              strokeWidth={1.55}
            />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-territory-border bg-territory-sun text-territory-ink shadow-sm md:h-6 md:w-6 lg:-right-2 lg:-top-2 lg:h-9 lg:w-9">
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-5 lg:w-5" />
            </span>
          </div>

          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-territory-brand motion-safe:animate-pulse motion-reduce:animate-none" />
              <p className="truncate text-[0.58rem] font-bold uppercase tracking-[0.16em] text-territory-brand sm:text-[0.62rem] md:text-[0.68rem] lg:text-xs">
                {activeStage.eyebrow}
              </p>
            </div>

            <p className="mt-1 text-balance font-heading text-sm font-bold leading-[1.12] tracking-[-0.025em] text-territory-ink sm:text-[0.95rem] md:mt-1.5 md:text-xl lg:mt-2 lg:text-[2rem]">
              {activeStage.title}
            </p>
            <p className="mt-1 line-clamp-1 text-[0.62rem] font-medium leading-4 text-territory-muted-strong sm:text-[0.68rem] md:mt-1.5 md:line-clamp-none md:text-sm lg:max-w-xl lg:text-base lg:leading-6">
              {activeStage.detail}
            </p>
            <p className="mt-1 truncate text-[0.58rem] font-semibold text-territory-muted sm:text-[0.62rem] md:mt-2 md:text-xs lg:text-sm">
              {label} · Salvador · BA
            </p>

            <div className="mt-2 flex items-center md:mt-3 lg:mt-6" data-entry-arrival-progress>
              {ARRIVAL_STAGES.map((item, index) => {
                const Icon = item.icon;
                const completed = index < activeStageIndex;
                const current = index === activeStageIndex;

                return (
                  <div
                    key={item.id}
                    className="flex min-w-0 flex-1 items-center last:flex-none"
                  >
                    <div className="flex min-w-0 flex-col items-center gap-1 md:gap-1.5">
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border transition-colors md:h-7 md:w-7 lg:h-9 lg:w-9 ${
                          completed || current
                            ? "border-territory-brand/30 bg-territory-brand/10 text-territory-brand"
                            : "border-territory-border bg-territory-raised text-territory-muted"
                        }`}
                      >
                        {completed ? (
                          <Check className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                        ) : (
                          <Icon className="h-2.5 w-2.5 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                        )}
                      </span>
                      <span
                        className={`hidden whitespace-nowrap text-[0.58rem] font-semibold min-[360px]:block md:text-[0.66rem] lg:text-xs ${
                          current
                            ? "text-territory-ink"
                            : completed
                              ? "text-territory-brand"
                              : "text-territory-muted"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {index < ARRIVAL_STAGES.length - 1 ? (
                      <span className="mx-1 h-px min-w-3 flex-1 bg-territory-border md:mx-2 lg:mx-3">
                        <span
                          className={`block h-full origin-left bg-territory-brand transition-transform duration-500 motion-reduce:transition-none ${
                            completed ? "scale-x-100" : "scale-x-0"
                          }`}
                        />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-2 hidden items-center gap-2 text-[0.65rem] font-medium text-territory-muted md:flex lg:mt-4 lg:text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-territory-brand/30 motion-safe:animate-ping motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-territory-brand" />
              </span>
              {statusText}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-territory-brand/25 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
