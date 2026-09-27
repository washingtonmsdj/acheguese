import { lazy, Suspense, useEffect, useRef, type ComponentType, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Home,
  Info,
  Map,
  MapPin,
  Menu,
  Navigation,
  Search,
  Store,
  UsersRound,
} from "lucide-react";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import "./TerritoryPortalPage.css";

const TerritoryMap = lazy(
  () => import("@/app/components/territory-vivo/TerritoryEntryMap"),
);
const TerritoryMapExperience = lazy(() => import("@/app/pages/MapaPage"));
const TerritoryBusinessExperience = lazy(
  () => import("@/app/pages/EmpresasLandingPage"),
);
const TerritoryNearbyExperience = lazy(() => import("@/app/pages/NearbyPage"));
const TerritorySearchExperience = lazy(() => import("@/app/pages/BuscaPage"));

export type TerritoryPortalView =
  | "home"
  | "map"
  | "business"
  | "nearby"
  | "search";

export interface TerritoryPortalUrls {
  home: string;
  business: string;
  map: string;
  nearby: string;
  search: string;
}

export interface TerritoryPortalPageProps {
  territoryName: string;
  contextLabel: string;
  memberLabels: readonly string[];
  resolvedTerritory: ResolvedTerritory;
  activeMemberIds: string[];
  urls: TerritoryPortalUrls;
  activeView?: TerritoryPortalView;
}

function BrandMark() {
  return (
    <span className="pt-brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

type Shortcut = {
  view?: TerritoryPortalView;
  label: string;
  description: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export default function TerritoryPortalPage({
  territoryName,
  contextLabel,
  memberLabels,
  resolvedTerritory,
  activeMemberIds,
  urls,
  activeView = "home",
}: TerritoryPortalPageProps) {
  const navigate = useNavigate();
  const shortcutRef = useRef<HTMLDivElement>(null);
  const heroSlug =
    resolvedTerritory?.kind === "group"
      ? resolvedTerritory.group.slug
      : resolvedTerritory?.kind === "location"
        ? resolvedTerritory.location.geographic_path?.split("/").filter(Boolean).at(-1)
        : null;
  const heroImage = heroSlug
    ? `/territory/heroes/${heroSlug}.jpg`
    : "/images/home/achegue-se-community-hero-v1.webp";
  const activeViewLabel = {
    home: territoryName,
    map: `Mapa de ${territoryName}`,
    business: `Empresas de ${territoryName}`,
    nearby: `Perto de mim em ${territoryName}`,
    search: `Busca em ${territoryName}`,
  }[activeView];

  const shortcuts: readonly Shortcut[] = [
    {
      view: "home",
      label: "Visão geral",
      description: "Sobre o território",
      href: urls.home,
      icon: Home,
    },
    {
      view: "map",
      label: "Mapa",
      description: "Explorar o território",
      href: urls.map,
      icon: Map,
    },
    {
      view: "business",
      label: "Empresas",
      description: "Comércio e negócios",
      href: urls.business,
      icon: Store,
    },
    {
      view: "nearby",
      label: "Perto de mim",
      description: "Ver o que está perto",
      href: urls.nearby,
      icon: Navigation,
    },
    {
      label: "Comunidade",
      description: "Conexões do bairro",
      icon: UsersRound,
      disabled: true,
    },
    {
      view: "search",
      label: "Busca",
      description: "Procurar no território",
      href: urls.search,
      icon: Search,
    },
  ];

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(query ? `${urls.search}?q=${encodeURIComponent(query)}` : urls.search);
  };

  useEffect(() => {
    const navigation = shortcutRef.current;
    const activeShortcut = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!navigation || !activeShortcut || navigation.scrollWidth <= navigation.clientWidth) return;
    const left = activeShortcut.offsetLeft - (navigation.clientWidth - activeShortcut.offsetWidth) / 2;
    navigation.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [activeView]);

  return (
    <div className="pt-page">
      <Helmet>
        <title>{activeViewLabel} | Achegue-se</title>
        <meta
          name="description"
          content={`Explore empresas, mapa, busca e o que está perto de você em ${territoryName}.`}
        />
      </Helmet>

      <a className="pt-skip-link" href="#pt-content">
        Pular para o conteúdo
      </a>

      <header className="pt-header">
        <div className="pt-container pt-header-inner">
          <Link className="pt-brand" to="/">
            <BrandMark />
            <strong>achegue-se</strong>
          </Link>

          <nav>
            <Link to={urls.nearby}>Por perto</Link>
            <Link to="/como-funciona">Como funciona</Link>
            <Link to={urls.business}>Para negócios</Link>
          </nav>

          <form
            className="pt-search"
            action={urls.search}
            onSubmit={handleSearchSubmit}
          >
            <Search />
            <input
              name="q"
              aria-label="Buscar no território"
              placeholder="Buscar empresas e lugares..."
            />
          </form>

          <Link className="pt-location" to={urls.map}>
            <MapPin /> {contextLabel} <ChevronDown />
          </Link>

          <Link className="pt-login" to={AUTH_PATHS.login}>
            Entrar <ArrowRight />
          </Link>

          <details className="pt-mobile-menu">
            <summary aria-label="Abrir menu">
              <Menu />
              <span>Menu</span>
            </summary>
            <nav aria-label="Navegação mobile">
              <Link to={urls.nearby}>Por perto</Link>
              <Link to="/como-funciona">Como funciona</Link>
              <Link to={urls.business}>Empresas</Link>
              <Link to={urls.map}>Mapa do território</Link>
              <Link to={urls.search}>Busca</Link>
            </nav>
          </details>
        </div>
      </header>

      <main id="pt-content" tabIndex={-1}>
        <section
          className={`pt-hero ${activeView === "business" ? "pt-hero--business" : ""} ${activeView === "nearby" ? "pt-hero--nearby" : ""}`}
          aria-labelledby="pt-title"
        >
          <img
            src={heroImage}
            alt={`Vista e moradores de ${territoryName}`}
            width="1536"
            height="1024"
          />
          <div className="pt-hero-shade" />

          <div className="pt-container pt-hero-content">
            <p className="pt-breadcrumb">
              <Home /> {contextLabel} <span>›</span> {territoryName}
              {activeView === "business" ? <><span>›</span> Empresas</> : null}
              {activeView === "nearby" ? <><span>›</span> Perto de mim</> : null}
            </p>
            {activeView === "business" ? (
              <p className="pt-view-kicker"><Store /> Empresas</p>
            ) : null}
            {activeView === "nearby" ? (
              <p className="pt-view-kicker"><Navigation /> Perto de mim</p>
            ) : null}
            <h1 id="pt-title">{activeView === "nearby" ? "Perto de mim" : territoryName}</h1>
            {activeView === "nearby" ? <p className="pt-view-territory">{territoryName}</p> : null}
            <p className="pt-tagline">
              {activeView === "business"
                ? "Comércio, serviços e negócios locais, em um só lugar."
                : activeView === "nearby"
                  ? "Encontre comércios, serviços e lugares próximos de você."
                : "Empresas, mapa, busca e o que está perto de você, em um só lugar."}
            </p>

            <div className="pt-shortcuts" aria-label="Atalhos do território" ref={shortcutRef}>
              {shortcuts.map(({ icon: Icon, ...item }) => {
                const content = (
                  <>
                    <Icon />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    {item.disabled ? <b>Em breve</b> : null}
                  </>
                );

                return item.disabled || !item.href ? (
                  <div className="is-disabled" aria-disabled="true" key={item.label}>
                    {content}
                  </div>
                ) : (
                  <Link
                    className={item.view === activeView ? "is-primary" : ""}
                    to={item.href}
                    key={item.label}
                    aria-current={item.view === activeView ? "page" : undefined}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {activeView !== "home" ? (
          <section
            className="pt-module-view"
            aria-label={activeViewLabel}
          >
            <Suspense
              fallback={<div className="pt-module-loading">Carregando conteúdo…</div>}
            >
              {activeView === "map" ? (
                <TerritoryMapExperience
                  resolved={resolvedTerritory}
                  activeMemberIds={activeMemberIds}
                />
              ) : null}
              {activeView === "business" ? (
                <TerritoryBusinessExperience embedded />
              ) : null}
              {activeView === "nearby" ? (
                <TerritoryNearbyExperience />
              ) : null}
              {activeView === "search" ? (
                <TerritorySearchExperience embedded />
              ) : null}
            </Suspense>
          </section>
        ) : (
          <div className="pt-container pt-dashboard">
            <section className="pt-panel pt-map-panel">
            <PanelHeading
              icon={Map}
              title="Mapa do território"
              description="Explore empresas e pontos úteis dentro do território."
              href={urls.map}
              label="Abrir mapa"
            />
            <div className="pt-map-shell">
              <Suspense
                fallback={<div className="pt-map-loading">Carregando mapa…</div>}
              >
                <TerritoryMap
                  city={null}
                  resolvedTerritory={resolvedTerritory}
                  label={territoryName}
                />
              </Suspense>
            </div>
          </section>

          <section className="pt-panel pt-business-panel">
            <PanelHeading
              icon={Store}
              title="Empresas"
              description="Veja os negócios disponíveis neste território."
              href={urls.business}
              label="Ver empresas"
            />
            <div className="pt-business-grid">
              <Link to={urls.business}>
                <div className="pt-business-image">
                  <Store />
                </div>
                <strong>Explorar empresas</strong>
                <small>{territoryName}</small>
                <p>Abrir catálogo do território</p>
                <span>
                  Abrir <ArrowRight />
                </span>
              </Link>
            </div>
          </section>

          <aside className="pt-panel pt-about">
            <PanelHeading icon={Info} title="Sobre o território" />
            <p>
              Este portal reúne as superfícies públicas ativas do Achegue-se para
              {territoryName}.
            </p>
            <dl>
              <div>
                <dt>
                  <MapPin /> Região
                </dt>
                <dd>{contextLabel}</dd>
              </div>
              {memberLabels.length > 0 ? (
                <div>
                  <dt>
                    <UsersRound /> Áreas do território
                  </dt>
                  <dd>{memberLabels.join(", ")}</dd>
                </div>
              ) : null}
              <div>
                <dt>
                  <Store /> Disponível agora
                </dt>
                <dd>Empresas, Mapa, Perto de mim e Busca</dd>
              </div>
            </dl>
          </aside>

          <section className="pt-panel pt-nearby">
            <PanelHeading
              icon={Navigation}
              title="Perto de você"
              description="Use sua localização para descobrir empresas próximas."
              href={urls.nearby}
              label="Abrir"
            />
            <div className="pt-nearby-grid">
              <Link to={urls.nearby}>
                <Navigation />
                <strong>Abrir Perto de mim</strong>
                <small>Resultados calculados pela sua localização</small>
              </Link>
              <Link to={urls.search}>
                <Search />
                <strong>Buscar no território</strong>
                <small>Procure pelo que precisa</small>
              </Link>
            </div>
            </section>
          </div>
        )}
      </main>

      <footer className="pt-footer">
        <div className="pt-container pt-footer-inner">
          <Link className="pt-brand" to="/">
            <BrandMark />
            <strong>achegue-se</strong>
          </Link>
          <p>
            Informação local para quem vive, trabalha e circula pelo território.
          </p>
          <nav aria-label="Links institucionais">
            <Link to="/como-funciona">Como funciona</Link>
            <Link to="/sobre">Sobre</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function PanelHeading({
  icon: Icon,
  title,
  description,
  href,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="pt-panel-heading">
      <div>
        <Icon />
        <span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </span>
      </div>
      {href ? (
        <Link to={href}>
          {label} <ArrowRight />
        </Link>
      ) : null}
    </div>
  );
}
