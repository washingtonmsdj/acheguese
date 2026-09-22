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
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
} from "@/shared/config/moduleSlugs";

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
  const nearbyUrl = buildAppModulePath(APP_MODULE_SLUGS.nearby);
  const searchUrl = buildModuleTerritoryUrl(MODULE_SLUGS.search, baseUrl);

  return (
    <>
      <Helmet>
        <title>{territoryName} | Achegue-se</title>
        <meta
          name="description"
          content={`Encontre empresas em ${territoryName}, pesquise o que precisa, explore o mapa e descubra o que está perto de você.`}
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
              Descubra empresas e lugares ao seu redor.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              O Achegue-se conecta Empresas, Busca, Mapa e Perto de mim usando o
              mesmo contexto territorial e as mesmas identidades públicas.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MvpModuleCard
              title="Empresas"
              description="Veja empresas públicas do território e abra seus detalhes canônicos."
              href={businessUrl}
              icon={Building2}
            />
            <MvpModuleCard
              title="Mapa"
              description="Visualize as empresas disponíveis diretamente no mapa do território."
              href={mapUrl}
              icon={Map}
            />
            <MvpModuleCard
              title="Perto de mim"
              description="Use sua localização quando disponível para encontrar empresas próximas sem fabricar distâncias."
              href={nearbyUrl}
              icon={Navigation}
            />
            <MvpModuleCard
              title="Busca"
              description="Pesquise empresas e resultados apenas dos módulos atualmente ativos."
              href={searchUrl}
              icon={Search}
            />
          </div>
        </section>
      </main>
    </>
  );
}
