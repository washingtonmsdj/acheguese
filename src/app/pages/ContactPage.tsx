import { Helmet } from "react-helmet-async";
import { ArrowLeft, Building2, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { Button } from "@/shared/components/ui/button";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL ?? "";

const CONTACT_REASONS = [
  "Suporte sobre funcionamento da plataforma.",
  "Parcerias comerciais ou institucionais.",
  "Expansão para novos territórios.",
  "Dúvidas operacionais sobre módulos locais.",
] as const;

export default function ContactPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedCity = searchParams.get("cidade")?.trim();
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;
  const territoryContext = requestedCity ? `${requestedCity}, contexto territorial solicitado` : launchPlace;

  return (
    <>
      <Helmet>
        <title>Entre em contato</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.26))]">
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 focus:outline-none sm:px-6 sm:pt-6 lg:px-8"
        >
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Suporte e parcerias
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Entre em contato
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Canais oficiais para suporte, operação territorial e assuntos institucionais.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Atendimento institucional
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Canais para suporte, operação e crescimento do produto
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Use esta página para tratar demandas gerais da plataforma. Para privacidade e LGPD,
                existe um fluxo específico do encarregado de dados.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Suporte
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Parcerias
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                Contexto: {territoryContext}
              </span>
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
            <section className="space-y-4">
              <article className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">Email principal</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Canal recomendado para suporte geral, comercial e alinhamento institucional.
                    </p>
                    {contactEmail ? (
                      <a
                        href={buildMailtoUrl(contactEmail) ?? undefined}
                        className="mt-3 inline-flex break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {contactEmail}
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        E-mail público ainda não configurado.
                      </p>
                    )}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">Quando usar este canal</h3>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                      {CONTACT_REASONS.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </section>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Panorama operacional</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Território de referência</p>
                      <p className="text-sm text-muted-foreground">{territoryContext}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Tipo de contato</p>
                      <p className="text-sm text-muted-foreground">
                        Produto, território, operação e relacionamento institucional.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Tempo de resposta</p>
                      <p className="text-sm text-muted-foreground">Até 48 horas úteis.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Canais relacionados</h3>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to="/dpo"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Falar com o encarregado de dados
                  </Link>
                  <Link
                    to="/sobre"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sobre o Achegue-se
                  </Link>
                  <Link
                    to="/privacidade"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Política de privacidade
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
