import { lazy, Suspense, type ComponentType } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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

export type TerritoryPortalView = "home" | "map";

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
  view: TerritoryPortalView | "nearby" | "business" | "search";
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
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
  const shortcuts: readonly Shortcut[] = [
    {
      view: "home",
      label: "Inicial",
      description: "Visão geral",
      href: urls.home,
      icon: Home,
    },
    {
      view: "nearby",
      label: "Perto de mim",
      description: "Ver o que está perto",
      href: urls.nearby,
      icon: Navigation,
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
      view: "search",
      label: "Busca",
      description: "Procurar no território",
      href: urls.search,
      icon: Search,
    },
  ];

  return (
    <div className="pt-page">
      <Helmet>
        <title>
          {activeView === "map" ? `Mapa de ${territoryName}` : territoryName} | Achegue-se
        </title>
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

          <form className="pt-search" action={urls.search}>
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
        <section className="pt-hero" aria-labelledby="pt-title">
          <img
            src="/images/home/achegue-se-community-hero-v1.webp"
            alt={`Vista e moradores de ${territoryName}`}
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <div className="pt-hero-shade" />

          <div className="pt-container pt-hero-content">
            <p className="pt-breadcrumb">
              <Home /> {contextLabel} <span>›</span> {territoryName}
            </p>
            <h1 id="pt-title">{territoryName}</h1>
            <p className="pt-tagline">
              Empresas, mapa, busca e o que está perto de você, em um só lugar.
            </p>

            <div className="pt-shortcuts" aria-label="Atalhos do território">
              {shortcuts.map(({ icon: Icon, ...item }) => (
                <Link
                  className={item.view === activeView ? "is-primary" : ""}
                  to={item.href}
                  key={item.label}
                  aria-current={item.view === activeView ? "page" : undefined}
                >
                  <Icon />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {activeView === "map" ? (
          <section
            className="pt-module-view"
            aria-label={`Mapa de ${territoryName}`}
          >
            <Suspense
              fallback={<div className="pt-module-loading">Carregando mapa…</div>}
            >
              <TerritoryMapExperience
                resolved={resolvedTerritory}
                activeMemberIds={activeMemberIds}
              />
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
