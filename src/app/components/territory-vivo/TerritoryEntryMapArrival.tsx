import { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

interface TerritoryEntryMapArrivalProps {
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
 * Experiencia de chegada da entrada territorial.
 *
 * Ocupa toda a area reservada para o mapa enquanto dados, geometria e MapLibre
 * ficam prontos. O visual e abstrato e nao simula ruas, bairros ou fronteiras.
 */
export function TerritoryEntryMapArrival({
  label,
  statusText = "Preparando mapa e limite territorial oficial",
}: TerritoryEntryMapArrivalProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let fadeTimeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setMessageVisible(false);
      fadeTimeoutId = window.setTimeout(() => {
        setMessageIndex((current) => (current + 1) % ARRIVAL_MESSAGES.length);
        setMessageVisible(true);
      }, 180);
    }, 2100);

    return () => {
      window.clearInterval(intervalId);
      if (fadeTimeoutId !== null) window.clearTimeout(fadeTimeoutId);
    };
  }, []);

  const activeStageIndex = useMemo(
    () => Math.min(messageIndex, ARRIVAL_STAGES.length - 1),
    [messageIndex],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 isolate overflow-hidden bg-territory-surface"
      aria-hidden="true"
      data-entry-arrival-loading
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 44%, hsl(var(--territory-brand) / 0.2), transparent 30%), radial-gradient(circle at 84% 16%, hsl(var(--territory-sun) / 0.13), transparent 25%), radial-gradient(circle at 10% 82%, hsl(var(--territory-brand) / 0.1), transparent 28%), linear-gradient(145deg, hsl(var(--territory-raised)), hsl(var(--territory-surface)))",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 h-[13rem] w-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-territory-brand/10 md:h-[23rem] md:w-[23rem] lg:h-[34rem] lg:w-[34rem]"
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-1/2 h-[8.5rem] w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-territory-brand/15 md:h-[15rem] md:w-[15rem] lg:h-[22rem] lg:w-[22rem]"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center px-3 py-2 md:px-7 md:py-4 lg:px-10 lg:py-7">
        <div className="flex w-full max-w-[44rem] flex-col items-center text-center">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-territory-border bg-territory-surface shadow-territory-highlight md:h-[4.5rem] md:w-[4.5rem] md:rounded-[1.65rem] lg:h-24 lg:w-24 lg:rounded-[2rem]">
            <div className="absolute inset-[-0.45rem] rounded-[1.35rem] border border-territory-brand/20 motion-safe:animate-pulse motion-reduce:animate-none md:inset-[-0.65rem] md:rounded-[2rem] lg:inset-[-0.85rem] lg:rounded-[2.55rem]" />
            <Globe2
              className="h-6 w-6 text-territory-brand md:h-8 md:w-8 lg:h-10 lg:w-10"
              strokeWidth={1.7}
            />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-territory-border bg-territory-sun text-territory-ink shadow-sm md:h-6 md:w-6 lg:h-7 lg:w-7">
              <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
            </span>
          </div>

          <div className="mt-3 min-h-[2.75rem] w-full md:mt-5 md:min-h-[4rem] lg:mt-7 lg:min-h-[5.25rem]">
            <p className="hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] text-territory-brand md:block lg:text-xs">
              Achegue-se ao território
            </p>
            <p
              className={`mx-auto max-w-[34rem] text-balance font-heading text-base font-bold leading-[1.15] tracking-[-0.025em] text-territory-ink transition-opacity duration-200 motion-reduce:transition-none md:mt-1.5 md:text-xl lg:mt-2 lg:text-[1.75rem] ${
                messageVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {ARRIVAL_MESSAGES[messageIndex]}
            </p>
            <p className="mx-auto mt-1 max-w-[92%] truncate text-[0.64rem] font-medium text-territory-muted-strong md:mt-1.5 md:text-xs lg:mt-2 lg:text-sm">
              {label} · Salvador · BA
            </p>
          </div>

          <div className="mt-2 flex max-w-full items-center gap-1 rounded-xl border border-territory-border bg-territory-surface/85 p-1 shadow-sm backdrop-blur-sm md:mt-3 md:gap-1.5 md:rounded-full md:p-1.5 lg:mt-5">
            {ARRIVAL_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const active = index <= activeStageIndex;
              const current = index === activeStageIndex;

              return (
                <span
                  key={stage.label}
                  className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-1.5 text-[0.6rem] font-semibold transition-colors md:min-h-8 md:rounded-full md:px-2.5 md:text-[0.68rem] lg:min-h-9 lg:px-3 lg:text-xs ${
                    active
                      ? "bg-territory-brand/10 text-territory-brand"
                      : "text-territory-muted"
                  }`}
                >
                  <span
                    className={`grid h-4.5 w-4.5 place-items-center rounded-full border md:h-5 md:w-5 lg:h-6 lg:w-6 ${
                      active
                        ? "border-territory-brand/30 bg-territory-surface"
                        : "border-territory-border bg-territory-raised"
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5" />
                  </span>
                  <span className="hidden min-[360px]:inline">{stage.label}</span>
                  {current ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-territory-brand motion-safe:animate-pulse motion-reduce:animate-none" />
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="mt-2 hidden items-center gap-2 text-[0.66rem] font-medium text-territory-muted md:flex lg:mt-4 lg:text-xs">
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
