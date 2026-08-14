import {
  ArrowRight,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  TerritorySectionHeading,
  TerritorySurface,
} from "@/shared/components/territory-vivo/TerritorySurface";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import type { CommunitySurfaceState } from "@/core/community-experience/policies/CommunitySurfacePolicy";

interface CommunityAvailabilityStateProps {
  state: Exclude<CommunitySurfaceState, "active">;
  territoryName: string;
  profile: TerritorialCommunityProfile | null;
  territoryHomeHref: string;
  exploreHref: string;
  activeCommunityHref: string;
  interestHref?: string;
  onRetry?: () => void;
}

export function CommunityAvailabilityState({
  state,
  territoryName,
  profile,
  territoryHomeHref,
  exploreHref,
  activeCommunityHref,
  interestHref,
  onRetry,
}: CommunityAvailabilityStateProps) {
  if (state === "loading") {
    return (
      <main
        className="mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        data-community-state="loading"
        aria-busy="true"
      >
        <div className="grid animate-pulse gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="h-64 rounded-territory-highlight bg-territory-raised" />
          <div className="h-64 rounded-territory-highlight bg-territory-raised" />
        </div>
        <span className="sr-only">
          Confirmando disponibilidade da Community…
        </span>
      </main>
    );
  }

  const isComingSoon = state === "coming_soon";
  const isError = state === "error";
  const title = isError
    ? "Não foi possível confirmar a Community agora"
    : isComingSoon
      ? profile?.hero_title?.trim() ||
        `A Community de ${territoryName} está chegando`
      : `Ainda não há uma Community válida para ${territoryName}`;
  const description = isError
    ? "O restante do Achegue-se continua disponível. Tente novamente antes de entrar no Feed ou participar."
    : isComingSoon
      ? profile?.launch_message?.trim() ||
        "A vida local deste território já pode ser explorada. A camada de participação será aberta quando o rollout comunitário estiver pronto."
      : "Não vamos criar um Feed vazio nem uma identidade artificial. Você ainda pode explorar serviços, comércio, oportunidades e informações reais deste território.";

  return (
    <main
      className="mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      data-community-state={state}
    >
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <TerritorySurface
          tone="highlight"
          className="overflow-hidden p-5 sm:p-7 lg:p-9"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-territory bg-territory-brand/14 text-territory-brand">
            {isError ? (
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            ) : isComingSoon ? (
              <Clock3 className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Users className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
            {isError
              ? "Verificação indisponível"
              : isComingSoon
                ? "Community em expansão"
                : "Território sem Community ativa"}
          </p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-[-0.035em] text-territory-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-territory-muted sm:text-base sm:leading-7">
            {description}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {isError && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Tentar novamente
              </button>
            ) : isComingSoon && interestHref ? (
              <Link
                to={interestHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
              >
                Quero ser avisado
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              to={territoryHomeHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-territory-border bg-territory-surface px-4 text-sm font-semibold text-territory-ink hover:border-territory-brand/35"
            >
              Voltar para Hoje em {territoryName}
            </Link>
            <Link
              to={exploreHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/10"
            >
              Explorar o território
            </Link>
          </div>
        </TerritorySurface>

        <TerritorySurface tone="raised" className="p-5 sm:p-6">
          <TerritorySectionHeading
            eyebrow="Primeiro cluster ativo"
            title="Complexo do Nordeste de Amaralina"
            description="Nordeste de Amaralina, Santa Cruz, Vale das Pedrinhas e Chapada participam da primeira Community oficial."
          />
          <Link
            to={activeCommunityHref}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-territory-brand/25 bg-territory-brand/10 px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/15"
          >
            Conhecer a Community ativa
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </TerritorySurface>
      </section>
    </main>
  );
}
