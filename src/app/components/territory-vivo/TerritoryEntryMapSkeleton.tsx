import { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

interface TerritoryEntryMapSkeletonProps {
  label: string;
  statusText?: string;
}

const ARRIVAL_MESSAGES = [
  "Procurando sua comunidade",
  "Preparando a casa para você se achegar",
  "Buscando o mapa oficial do Complexo",
  "Tudo quase pronto para sua chegada",
] as const;

const ARRIVAL_STAGES = [
  { label: "Comunidade", icon: UsersRound },
  { label: "Mapa", icon: MapPinned },
  { label: "Limite oficial", icon: ShieldCheck },
] as const;

/**
 * Loading premium da entrada territorial.
 *
 * Ocupa 100% da area reservada para o mapa e comunica chegada/progresso sem
 * simular ruas, bairros ou limites territoriais que ainda nao foram carregados.
 */
export function TerritoryEntryMapSkeleton({
  label,
  statusText = "Carregando mapa e limite territorial oficial",
}: TerritoryEntryMapSkeletonProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % ARRIVAL_MESSAGES.length);
    }, 1700);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeStageIndex = useMemo(
    () => Math.min(messageIndex, ARRIVAL_STAGES.length - 1),
    [messageIndex],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 isolate overflow-hidden bg-territory-surface"
      aria-hidden="true"
      data-entry-map-skeleton
      data-entry-arrival-loading
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, hsl(var(--territory-brand) / 0.18), transparent 28%), radial-gradient(circle at 82% 18%, hsl(var(--territory-sun) / 0.12), transparent 24%), radial-gradient(circle at 12% 78%, hsl(var(--territory-brand) / 0.1), transparent 28%), linear-gradient(145deg, hsl(var(--territory-raised)), hsl(var(--territory-surface)))",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-territory-brand/10 sm:h-[28rem] sm:w-[28rem] lg:h-[36rem] lg:w-[36rem]"
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-territory-brand/15 sm:h-[18rem] sm:w-[18rem] lg:h-[24rem] lg:w-[24rem]"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex w-full max-w-[42rem] flex-col items-center text-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-[1.75rem] border border-territory-border bg-territory-surface shadow-territory-highlight sm:h-24 sm:w-24 sm:rounded-[2rem] lg:h-28 lg:w-28 lg:rounded-[2.25rem]">
            <div className="absolute inset-[-0.7rem] rounded-[2.15rem] border border-territory-brand/20 motion-safe:animate-pulse motion-reduce:animate-none sm:inset-[-0.85rem] sm:rounded-[2.45rem] lg:inset-[-1rem] lg:rounded-[2.8rem]" />
            <div className="absolute inset-[-1.45rem] rounded-[2.75rem] border border-territory-brand/10 sm:inset-[-1.8rem] sm:rounded-[3.25rem] lg:inset-[-2.15rem] lg:rounded-[3.8rem]" />
            <Globe2
              className="h-9 w-9 text-territory-brand sm:h-11 sm:w-11 lg:h-13 lg:w-13"
              strokeWidth={1.7}
            />
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-territory-border bg-territory-sun text-territory-ink shadow-sm sm:h-7 sm:w-7">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>

          <div className="mt-8 min-h-[5.75rem] sm:mt-10 sm:min-h-[6.5rem] lg:mt-12">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-territory-brand sm:text-xs">
              Achegue-se ao território
            </p>
            <p
              key={messageIndex}
              className="mt-2 text-balance font-heading text-xl font-bold leading-tight tracking-[-0.035em] text-territory-ink motion-safe:animate-[fade-in_320ms_ease-out] sm:text-2xl lg:text-[2rem]"
            >
              {ARRIVAL_MESSAGES[messageIndex]}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-territory-muted-strong sm:text-base sm:leading-6">
              {label} · Salvador · BA
            </p>
          </div>

          <div className="mt-5 flex max-w-full items-center gap-1.5 rounded-2xl border border-territory-border bg-territory-surface/85 p-1.5 shadow-sm backdrop-blur-sm sm:mt-6 sm:gap-2 sm:rounded-full sm:p-2 lg:mt-8">
            {ARRIVAL_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const active = index <= activeStageIndex;
              const current = index === activeStageIndex;

              return (
                <span
                  key={stage.label}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-[0.68rem] font-semibold transition-colors sm:min-h-10 sm:rounded-full sm:px-3.5 sm:text-xs ${
                    active
                      ? "bg-territory-brand/10 text-territory-brand"
                      : "text-territory-muted"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full border sm:h-6 sm:w-6 ${
                      active
                        ? "border-territory-brand/30 bg-territory-surface"
                        : "border-territory-border bg-territory-raised"
                    }`}
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span className="hidden min-[360px]:inline">{stage.label}</span>
                  {current ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-territory-brand motion-safe:animate-pulse motion-reduce:animate-none" />
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2 text-[0.68rem] font-medium text-territory-muted sm:mt-6 sm:text-xs lg:mt-7">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-territory-brand/35 motion-safe:animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-territory-brand" />
            </span>
            {statusText}
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-territory-brand/25 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
