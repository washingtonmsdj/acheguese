import { useEffect, useState } from "react";
import { Building2, Map, MapPin, Navigation, Search } from "lucide-react";
import TerritoryEntryMap from "@/app/components/territory-vivo/TerritoryEntryMap";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import {
  getPublicTerritoryGroupPresentation,
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";
import {
  MODULE_SLUGS,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";
import { lastTerritoryStore } from "@/core/routing/stores/LastTerritoryStore";
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
} from "@/shared/config/moduleSlugs";
import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";

const LAUNCH_STATE = TERRITORY_CONFIG.launch.state;
const LAUNCH_CITY = TERRITORY_CONFIG.launch.city;
const LAUNCH_TERRITORY_SLUG = TERRITORY_CONFIG.launch.community.slug;
const LAUNCH_TERRITORY_NAME = TERRITORY_CONFIG.launch.community.name;
const ACCOUNT_PATH = "/conta";

const launchCityResolved = resolvePublicTerritoryFallback({
  state: LAUNCH_STATE,
  city: LAUNCH_CITY,
});
const launchTerritory = resolvePublicTerritoryFallback({
  state: LAUNCH_STATE,
  city: LAUNCH_CITY,
  territorySlug: LAUNCH_TERRITORY_SLUG,
});
const launchCity =
  launchCityResolved?.kind === "location" ? launchCityResolved.location : null;
const launchMembers =
  launchTerritory?.kind === "group" ? launchTerritory.group.members : [];
const launchPresentation =
  launchTerritory?.kind === "group"
    ? getPublicTerritoryGroupPresentation(launchTerritory.group)
    : { label: LAUNCH_TERRITORY_NAME, article: null };

const launchTerritoryBase = TERRITORY_CONFIG.launch.community.path;
const launchBusinessUrl = buildModuleTerritoryUrl(
  MODULE_SLUGS.business,
  launchTerritoryBase,
);
const launchMapUrl = buildModuleTerritoryUrl(
  MODULE_SLUGS.map,
  launchTerritoryBase,
);
const launchNearbyUrl = buildAppModulePath(APP_MODULE_SLUGS.nearby);
const launchSearchUrl = buildModuleTerritoryUrl(
  MODULE_SLUGS.search,
  launchTerritoryBase,
);

const MODULE_LINKS = [
  {
    label: "Empresas",
    description: "Conheça empresas e estabelecimentos deste território.",
    href: launchBusinessUrl,
    icon: Building2,
  },
  {
    label: "Mapa",
    description: "Veja as empresas disponíveis diretamente no mapa.",
    href: launchMapUrl,
    icon: Map,
  },
  {
    label: "Perto de mim",
    description: "Use sua localização para encontrar empresas próximas.",
    href: launchNearbyUrl,
    icon: Navigation,
  },
  {
    label: "Busca",
    description: "Pesquise empresas e conteúdo dos módulos ativos neste território.",
    href: launchSearchUrl,
    icon: Search,
  },
] as const;

export default function TerritoryEntryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let disposed = false;
    let authRevision = 0;
    let unsubscribe = () => undefined;

    void import("@/core/session/services/SessionService").then(
      ({ SessionService }) => {
        if (disposed) return;

        unsubscribe = SessionService.onAuthStateChange((_event, session) => {
          authRevision += 1;
          if (!disposed) setIsAuthenticated(Boolean(session?.user));
        });

        const readRevision = authRevision;
        void SessionService.getCurrentUser().then((user) => {
          if (!disposed && authRevision === readRevision) {
            setIsAuthenticated(Boolean(user));
          }
        });
      },
      () => undefined,
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const territoryLabel = launchPresentation.article
    ? `${launchPresentation.article} ${launchPresentation.label}`
    : launchPresentation.label;

  const accountHref = isAuthenticated ? ACCOUNT_PATH : AUTH_PATHS.login;
  const accountLabel = isAuthenticated ? "Minha conta" : "Entrar";

  const rememberTerritory = () => {
    lastTerritoryStore.set({
      name: LAUNCH_TERRITORY_NAME,
      baseUrl: launchTerritoryBase,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow"
      >
        Pular para o conteúdo principal
      </a>

      <header className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" className="text-xl font-semibold tracking-tight">
            achegue-se<span className="text-primary">.</span>
          </a>
          <nav className="flex items-center gap-2" aria-label="Navegação pública">
            <a
              href="/como-funciona"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Como funciona
            </a>
            <a
              href={accountHref}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              {accountLabel}
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-12">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Primeiro território
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Seu lugar, mais perto.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Encontre empresas, pesquise o que precisa, visualize o território no mapa e
              descubra o que está perto de você.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {territoryLabel}
              </div>
              {launchMembers.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {launchMembers.map((member) => (
                    <span
                      key={member.id}
                      className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {getPublicTerritoryLocationLabel(member)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MODULE_LINKS.map(({ label, description, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  onClick={rememberTerritory}
                  className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <strong className="mt-3 block text-sm">{label}</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {description}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="min-h-[24rem] overflow-hidden rounded-3xl border border-border bg-muted/20 lg:min-h-[36rem]">
            <TerritoryEntryMap
              city={launchCity}
              resolvedTerritory={launchTerritory}
              label={LAUNCH_TERRITORY_NAME}
              className="h-full min-h-[24rem] w-full lg:min-h-[36rem]"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground sm:px-6">
          <span>O Achegue-se está começando por este território.</span>
          <nav className="flex gap-4" aria-label="Links institucionais">
            <a href={PRIVACY_POLICY_PATH} className="hover:text-foreground">
              Privacidade
            </a>
            <a href="/como-funciona" className="hover:text-foreground">
              Como funciona
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
