import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Map,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
} from "@/shared/config/moduleSlugs";

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const MODULES: readonly ModuleCardProps[] = [
  {
    title: "Empresas",
    description:
      "Encontre empresas do território e veja informações, contatos e localização.",
    href: LAUNCH_URLS.business,
    icon: Building2,
  },
  {
    title: "Mapa",
    description:
      "Veja onde ficam as empresas disponíveis e explore o território pelo mapa.",
    href: LAUNCH_URLS.map,
    icon: Map,
  },
  {
    title: "Perto de mim",
    description:
      "Com sua permissão, use a localização do aparelho para encontrar empresas próximas.",
    href: buildAppModulePath(APP_MODULE_SLUGS.nearby),
    icon: Navigation,
  },
  {
    title: "Busca",
    description:
      "Procure empresas e resultados disponíveis no território.",
    href: LAUNCH_URLS.search,
    icon: Search,
  },
] as const;

function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
}: ModuleCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-3xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30 sm:p-6"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Abrir
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

export default function ComoFuncionaPage() {
  const launchName = TERRITORY_CONFIG.launch.community.name;

  return (
    <>
      <Helmet>
        <title>Como funciona | Achegue-se</title>
        <meta
          name="description"
          content="Entenda como Empresas, Busca, Mapa e Perto de mim ajudam você a encontrar o que precisa no seu território."
        />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/70 bg-background/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              achegue-se<span className="text-primary">.</span>
            </Link>
            <nav className="flex items-center gap-2" aria-label="Navegação institucional">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Criar conta
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {launchName}
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Quatro caminhos para encontrar o que importa por perto.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Nesta primeira versão, o Achegue-se ajuda você a encontrar empresas,
                procurar o que precisa, ver no mapa e descobrir o que está próximo.
                Tudo parte do mesmo território.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {MODULES.map((module) => (
                <ModuleCard key={module.title} {...module} />
              ))}
            </div>
          </section>

          <section className="border-y border-border/70 bg-muted/20">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
              <div>
                <span className="text-sm font-semibold text-primary">1</span>
                <h2 className="mt-2 font-semibold">Escolha o território</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Escolha o bairro ou território onde você quer procurar e mantenha esse
                  contexto enquanto navega.
                </p>
              </div>
              <div>
                <span className="text-sm font-semibold text-primary">2</span>
                <h2 className="mt-2 font-semibold">Explore empresas</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Veja informações, contatos e localização de cada empresa antes de
                  decidir onde ir.
                </p>
              </div>
              <div>
                <span className="text-sm font-semibold text-primary">3</span>
                <h2 className="mt-2 font-semibold">Descubra o que está perto</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Com sua permissão, usamos a localização do aparelho para mostrar o que
                  está realmente próximo de você.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex max-w-3xl items-start gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Começando pelo essencial</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Nesta primeira versão, o Achegue-se foca em empresas e descoberta local.
                  Novas áreas entram aos poucos, quando estiverem prontas para oferecer uma
                  experiência útil e confiável.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground sm:px-6">
            <span>Achegue-se</span>
            <nav className="flex gap-4" aria-label="Links institucionais">
              <Link to="/privacidade" className="hover:text-foreground">
                Privacidade
              </Link>
              <Link to="/termos" className="hover:text-foreground">
                Termos
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
