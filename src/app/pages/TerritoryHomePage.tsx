import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Map,
  MapPin,
  Navigation,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import {
  MODULE_SLUGS,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";

interface MvpModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

function MvpModuleCard({
  title,
  description,
  href,
  icon: Icon,
}: MvpModuleCardProps) {
  return (
    <Link
      to={href}
      className="group flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30 sm:p-6"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="mt-8">
        <span className="block text-xl font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Abrir
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </span>
    </Link>
  );
}

export default function TerritoryHomePage() {
  const { resolved, baseUrl } = useTerritorialContext();
  const territoryName =
    resolved.kind === "group" ? resolved.group.name : resolved.location.name;

  const businessUrl = buildModuleTerritoryUrl(MODULE_SLUGS.business, baseUrl);
  const mapUrl = buildModuleTerritoryUrl(MODULE_SLUGS.map, baseUrl);
  const nearbyUrl = buildModuleTerritoryUrl(MODULE_SLUGS.nearby, baseUrl);
  const searchUrl = buildModuleTerritoryUrl(MODULE_SLUGS.search, baseUrl);

  return (
    <>
      <Helmet>
        <title>{territoryName} | Achegue-se</title>
        <meta
          name="description"
          content={`Encontre empresas em ${territoryName}, procure o que precisa, veja no mapa e descubra o que está perto de você.`}
        />
      </Helmet>

      <main className="min-h-screen bg-background">
        <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
          <div className="rounded-[2rem] border border-border bg-card px-5 py-8 shadow-sm sm:px-8 sm:py-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {territoryName}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Encontre o que você precisa por aqui.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Empresas, mapa e lugares perto de você, sempre dentro de
              {` ${territoryName}`}.
            </p>

            <Link
              to={searchUrl}
              aria-label={`Procurar algo em ${territoryName}`}
              className="group mt-7 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30 sm:px-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Procurar no bairro
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  mercado, farmácia, oficina, empresa...
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              O que você quer fazer agora?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha um caminho e continue em {territoryName}.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MvpModuleCard
              title="Empresas"
              description={`Veja empresas de ${territoryName}, contatos e informações para decidir onde ir.`}
              href={businessUrl}
              icon={Building2}
            />
            <MvpModuleCard
              title="Mapa"
              description={`Veja onde ficam as empresas disponíveis em ${territoryName}.`}
              href={mapUrl}
              icon={Map}
            />
            <MvpModuleCard
              title="Perto de mim"
              description="Use sua localização, quando disponível, para descobrir empresas próximas."
              href={nearbyUrl}
              icon={Navigation}
            />
            <MvpModuleCard
              title="Procurar"
              description={`Digite o que precisa e procure entre as empresas disponíveis em ${territoryName}.`}
              href={searchUrl}
              icon={Search}
            />
          </div>
        </section>
      </main>
    </>
  );
}
