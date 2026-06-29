import { Helmet } from "react-helmet-async";
import { ArrowLeft, Heart, MapPin, Target, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { TERRITORY_CONFIG } from "@/config/territory";
import { Button } from "@/shared/components/ui/button";

const PLATFORM_PILLARS = [
  {
    icon: MapPin,
    title: "Navegacao territorial",
    description:
      "Cidade, bairro e comunidade sao tratados como superficies canonicas, com rotas e contexto consistentes para descoberta local.",
  },
  {
    icon: Users,
    title: "Economia e servicos locais",
    description:
      "Empresas, profissionais, classificados e instituicoes ganham visibilidade no contexto territorial correto, sem duplicacao estrutural.",
  },
  {
    icon: Heart,
    title: "Comunidade operacional",
    description:
      "O produto combina leitura publica, confianca, verificacao e interacao orientada ao bairro, com foco em utilidade real.",
  },
  {
    icon: Target,
    title: "Escala com SSOT",
    description:
      "Cada modulo usa contratos centrais de navegacao, perfil, territorio e dados para evitar superficies paralelas e legado manual.",
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
                  Marca e produto
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Sobre o Achegue-se
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Plataforma territorial para cidade, bairro e comunidade.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Territorio, comunidade e descoberta local
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Um produto pensado para uso territorial de verdade
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                O Achegue-se organiza moradores, negocios, servicos, classificados, gastronomia,
                mapa e comunidade em uma estrutura unica. A ideia nao e criar paginas soltas, e sim
                um sistema operacional local com leitura publica e interacao contextual.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Cidade
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Bairro
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
                SSOT territorial
              </span>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-sm sm:p-5">
            <p className="text-sm leading-6 text-foreground">
              O produto nasceu para conectar contexto local, economia de bairro e vida comunitaria
              em um fluxo coerente. A operacao de referencia atual parte de {launchPlace}.
            </p>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            {PLATFORM_PILLARS.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <article
                  key={pillar.title}
                  className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6"
                >
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary w-fit">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">Como pensamos o produto</h3>
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                A home geral explica o conceito. A cidade vira descoberta operacional. O bairro vira
                contexto principal de comunidade, leitura publica e interacao verificada.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Essa separacao permite crescer com menos ruido visual, menos duplicacao de dados e
                mais previsibilidade de navegacao entre modulos.
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Para contato institucional, suporte ou temas regulatorios, use os canais oficiais da
                plataforma.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contato"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Entrar em contato
                </Link>
                <Link
                  to="/termos"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Termos de uso
                </Link>
                <Link
                  to="/privacidade"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Politica de privacidade
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
