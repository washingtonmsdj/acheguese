import { Helmet } from "react-helmet-async";
import { Building2, Mail, MapPin, MessageSquare } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { SafeLink } from "@/shared/components/security";
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
  const contactEmailUrl = buildMailtoUrl(contactEmail);

  return (
    <>
      <Helmet>
        <title>Entre em contato</title>
      </Helmet>

      <PublicInfoPageShell
        eyebrow="Suporte e parcerias"
        title="Entre em contato"
        description="Canais oficiais para suporte, operação territorial e assuntos institucionais."
        onBack={() => navigate(-1)}
      >
        <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-territory-brand/90">
              Atendimento institucional
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-territory-ink sm:text-[2rem]">
              Canais para suporte, operação e crescimento do produto
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-territory-muted">
              Use esta página para tratar demandas gerais da plataforma. Para privacidade e LGPD,
              existe um fluxo específico do encarregado de dados.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-territory-brand/20 bg-territory-brand/10 px-3 py-1 text-xs font-medium text-territory-brand">
              Suporte
            </span>
            <span className="rounded-full border border-territory-brand/20 bg-territory-brand/10 px-3 py-1 text-xs font-medium text-territory-brand">
              Parcerias
            </span>
            <span className="rounded-full border border-territory-border/60 bg-territory-raised/70 px-3 py-1 text-xs font-medium text-territory-ink">
              Contexto: {territoryContext}
            </span>
          </div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
          <section className="space-y-4">
            <article className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-territory-ink sm:text-lg">Email principal</h3>
                  <p className="mt-2 text-sm leading-6 text-territory-muted">
                    Canal recomendado para suporte geral, comercial e alinhamento institucional.
                  </p>
                  {contactEmailUrl ? (
                    <SafeLink
                      href={contactEmailUrl}
                      className="mt-3 inline-flex break-all text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
                    >
                      {contactEmail}
                    </SafeLink>
                  ) : (
                    <p className="mt-3 text-sm text-territory-muted">
                      E-mail público ainda não configurado.
                    </p>
                  )}
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-territory-ink sm:text-lg">Quando usar este canal</h3>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-territory-muted">
                    {CONTACT_REASONS.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-territory-ink">Panorama operacional</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-territory-ink">Território de referência</p>
                    <p className="text-sm text-territory-muted">{territoryContext}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-territory-ink">Tipo de contato</p>
                    <p className="text-sm text-territory-muted">
                      Produto, território, operação e relacionamento institucional.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-territory-ink">Canais relacionados</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/dpo"
                  className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
                >
                  Falar com o encarregado de dados
                </Link>
                <Link
                  to="/sobre"
                  className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
                >
                  Sobre o Achegue-se
                </Link>
                <Link
                  to="/privacidade"
                  className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
                >
                  Política de privacidade
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </PublicInfoPageShell>
    </>
  );
}
