import { Helmet } from "react-helmet-async";
import { Activity, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";
import { PLATFORM_BRAND } from "@/shared/config/brand";

export default function StatusPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Status da plataforma</title>
      </Helmet>

      <PublicInfoPageShell
        eyebrow="Transparência"
        title="Status da plataforma"
        description={`Informações públicas de disponibilidade do ${PLATFORM_BRAND.name}.`}
        onBack={() => navigate(-1)}
      >
        <section
          aria-labelledby="public-monitoring-title"
          className="overflow-hidden rounded-3xl border border-territory-border bg-territory-surface shadow-sm"
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-territory-border/70 p-5 sm:p-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-territory-raised text-territory-brand">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-territory-muted">
                  Disponibilidade pública
                </p>
                <h2
                  id="public-monitoring-title"
                  className="mt-1 flex items-center gap-2 text-lg font-bold text-territory-ink sm:text-xl"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" />
                  Monitoramento público
                </h2>
              </div>
            </div>

            <span className="inline-flex min-h-8 items-center rounded-full border border-territory-border bg-territory-raised px-3 text-xs font-semibold text-territory-muted">
              Não publicado
            </span>
          </header>

          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-sm leading-6 text-territory-muted sm:text-base sm:leading-7">
              O Achegue-se ainda não possui uma fonte pública dedicada para
              publicar disponibilidade, uptime ou latência em tempo real. Para
              evitar informações imprecisas, esta página não infere o estado
              da plataforma a partir de verificações internas.
            </p>
            <p className="text-sm leading-6 text-territory-muted sm:text-base sm:leading-7">
              Se você estiver com dificuldade para usar algum recurso, tente
              novamente e utilize o canal oficial de contato para relatar o
              problema.
            </p>
            <Link
              to="/contato"
              className="inline-flex min-h-11 items-center rounded-xl border border-territory-brand/30 bg-territory-raised px-4 text-sm font-semibold text-territory-brand transition-colors hover:border-territory-brand/55 hover:bg-territory-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2"
            >
              Ir para contato
            </Link>
          </div>
        </section>
      </PublicInfoPageShell>
    </>
  );
}
