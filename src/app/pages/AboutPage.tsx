import { Helmet } from "react-helmet-async";
import { Building2, MapPin, Search, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PublicInfoPageShell } from "@/app/components/public/PublicInfoPageShell";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";

const PLATFORM_PILLARS = [
  {
    icon: MapPin,
    title: "Navegação territorial",
    description:
      "Cidade e bairro são tratados como recortes canônicos, com rotas e contexto consistentes para descoberta local.",
  },
  {
    icon: Building2,
    title: "Empresas locais",
    description:
      "Empresas usam uma identidade pública única e aparecem no território correto sem duplicação estrutural.",
  },
  {
    icon: Search,
    title: "Descoberta no MVP",
    description:
      "Mapa, Perto de mim e Busca trabalham sobre o mesmo domínio de Empresas para manter dados e navegação coerentes.",
  },
  {
    icon: Target,
    title: "Evolução modular",
    description:
      "Outros módulos permanecem pausados até serem certificados e reintegrados individualmente, sem interferir no núcleo ativo.",
  },
] as const;

export default function AboutPage() {
  const navigate = useNavigate();
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <>
      <Helmet>
        <title>Sobre o Achegue-se</title>
      </Helmet>

      <PublicInfoPageShell
        eyebrow="Marca e produto"
        title="Sobre o Achegue-se"
        description="Plataforma territorial para descoberta e economia local."
        onBack={() => navigate(-1)}
      >
        <section className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-territory-brand/90">
              Território e descoberta local
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-territory-ink sm:text-[2rem]">
              Um produto pensado para uso territorial de verdade
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-territory-muted">
              O Achegue-se organiza empresas e descoberta local por território. No MVP, Empresas é
              o domínio de produto ativo; Mapa, Perto de mim e Busca compartilham o mesmo contexto
              territorial para oferecer uma experiência coerente, sem duplicar dados nem regras.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-territory-brand/20 bg-territory-brand/10 px-3 py-1 text-xs font-medium text-territory-brand">
              Cidade
            </span>
            <span className="rounded-full border border-territory-brand/20 bg-territory-brand/10 px-3 py-1 text-xs font-medium text-territory-brand">
              Bairro
            </span>
            <span className="rounded-full border border-territory-border/60 bg-territory-raised/70 px-3 py-1 text-xs font-medium text-territory-ink">
              SSOT territorial
            </span>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-territory-brand/20 bg-territory-brand/[0.05] p-4 shadow-sm sm:p-5">
          <p className="text-sm leading-6 text-territory-ink">
            O produto nasceu para conectar contexto local, economia de bairro e descoberta
            territorial em um fluxo coerente. A operação de referência atual parte de {launchPlace}.
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {PLATFORM_PILLARS.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                key={pillar.title}
                className="rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6"
              >
                <div className="w-fit rounded-2xl bg-territory-brand/10 p-2.5 text-territory-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-territory-ink sm:text-lg">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-territory-muted">
                  {pillar.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-territory-ink sm:text-lg">
            Como pensamos o produto
          </h3>
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-6 text-territory-muted">
              A entrada geral explica o conceito. A cidade organiza a descoberta. O bairro mantém
              o recorte territorial usado por Empresas, Mapa, Busca e Perto de mim.
            </p>
            <p className="text-sm leading-6 text-territory-muted">
              Essa separação permite crescer com menos ruído visual, menos duplicação de dados e
              mais previsibilidade de navegação entre superfícies.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-territory-border/70 bg-territory-surface/90 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-6 text-territory-muted">
              Para contato institucional, suporte ou temas regulatórios, use os canais oficiais da
              plataforma.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contato"
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Entrar em contato
              </Link>
              <Link
                to="/termos"
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Termos de uso
              </Link>
              <Link
                to="/privacidade"
                className="text-sm font-medium text-territory-brand underline-offset-4 hover:underline"
              >
                Política de privacidade
              </Link>
            </div>
          </div>
        </section>
      </PublicInfoPageShell>
    </>
  );
}
