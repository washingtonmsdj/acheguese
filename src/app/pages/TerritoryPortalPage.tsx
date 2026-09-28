import { lazy, Suspense, useMemo, type ComponentType, type FormEvent } from "react";
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
  Star,
  Store,
  UsersRound,
} from "lucide-react";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { TerritorialModuleHero, type TerritorialHeroBreadcrumb, type TerritoryModuleNavItem, type TerritoryModuleNavMoreItem } from "@/app/components/territorial";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { getBusinessUrl, normalizeRealBusinessEntry } from "@/app/features/business-landing/utils";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import type { MapMarker } from "@/core/maps/types/core";

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
  const businessUrls = useBusinessUrls(resolvedTerritory);
  const {
    businesses: territoryBusinesses,
    isLoading: businessesLoading,
    isError: businessesError,
  } = useBusinessList({
    enabled: activeView === "home",
    pageSize: 4,
    routeResolved: resolvedTerritory,
    activeMemberIds,
  });
  const businessPreview = useMemo(
    () => territoryBusinesses.slice(0, 4).map(normalizeRealBusinessEntry),
    [territoryBusinesses],
  );
  const businessMapMarkers = useMemo<MapMarker[]>(
    () => businessPreview.flatMap((business) => {
      const { lat, lng } = business.coords;
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 || lat > 90 ||
        lng < -180 || lng > 180 ||
        (lat === 0 && lng === 0)
      ) return [];

      return [{
        id: business.id,
        type: "business",
        coordinates: { latitude: lat, longitude: lng },
        title: business.name,
        status: "active",
        url: getBusinessUrl(business, urls.business, businessUrls.canonical),
        metadata: {
          category: getBusinessCategoryLabel(business.category),
          rating: business.rating || undefined,
          is_verified: business.is_verified,
        },
      }];
    }),
    [businessPreview, businessUrls.canonical, urls.business],
  );
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

  const moduleNavItems: readonly TerritoryModuleNavItem[] = [
    {
      id: "home",
      label: "Visão geral",
      description: "Sobre o território",
      href: urls.home,
      icon: Home,
    },
    {
      id: "map",
      label: "Mapa",
      description: "Explorar o território",
      href: urls.map,
      icon: Map,
    },
    {
      id: "business",
      label: "Empresas",
      description: "Comércio e negócios",
      href: urls.business,
      icon: Store,
    },
    {
      id: "nearby",
      label: "Perto de mim",
      description: "Ver o que está perto",
      href: urls.nearby,
      icon: Navigation,
    },
    {
      id: "community",
      label: "Comunidade",
      description: "Conexões do bairro",
      icon: UsersRound,
      disabled: true,
    },
    {
      id: "search",
      label: "Busca",
      description: "Procurar no território",
      href: urls.search,
      icon: Search,
    },
  ];

  const moreNavItems: readonly TerritoryModuleNavMoreItem[] = [
    { label: "Visão geral", href: urls.home },
    { label: "Busca", href: urls.search },
    { label: "Comunidade", disabled: true },
    { label: "Serviços", disabled: true },
    { label: "Eventos", disabled: true },
  ];

  const heroBreadcrumbs: readonly TerritorialHeroBreadcrumb[] = [
    { label: contextLabel, icon: Home },
    { label: territoryName },
    ...(activeView === "business" ? [{ label: "Empresas" }] : []),
    ...(activeView === "nearby" ? [{ label: "Perto de mim" }] : []),
    ...(activeView === "map" ? [{ label: "Mapa" }] : []),
    ...(activeView === "search" ? [{ label: "Busca" }] : []),
  ];

  const heroTitle = {
    home: territoryName,
    business: "Empresas",
    nearby: "Perto de mim",
    map: "Mapa",
    search: "Busca",
  }[activeView];
  const heroDescription = activeView === "business"
    ? "Comércio, serviços e negócios locais, em um só lugar."
    : activeView === "nearby"
      ? "Encontre comércios, serviços e lugares próximos de você."
      : activeView === "map"
        ? "Explore ruas, lugares e pontos importantes do território."
        : activeView === "search"
          ? "Encontre empresas, serviços e lugares do território."
          : "Empresas, mapa, busca e o que está perto de você, em um só lugar.";
  const heroIcon = activeView === "business"
    ? Store
    : activeView === "nearby"
      ? Navigation
      : activeView === "map"
        ? Map
        : activeView === "search"
          ? Search
          : undefined;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(query ? `${urls.search}?q=${encodeURIComponent(query)}` : urls.search);
  };

  return (
    <div className={`pt-page${activeView === "home" ? " pt-page-home" : ""}`}>
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
        <TerritorialModuleHero
          territory={territoryName}
          module={activeView}
          activeModule={activeView}
          eyebrow={undefined}
          icon={heroIcon}
          iconPlacement="title"
          title={heroTitle}
          description={heroDescription}
          breadcrumbs={heroBreadcrumbs}
          backgroundImage={heroImage}
          navItems={moduleNavItems}
          moreNavItems={moreNavItems}
        />

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
          <div className="pt-container pt-home-dashboard">
            <div className="pt-home-overview">
              <section className="pt-panel pt-home-map">
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
                      markers={businessMapMarkers}
                      showTerritoryReference
                    />
                  </Suspense>
                </div>
              </section>

              <aside className="pt-panel pt-home-about">
                <PanelHeading icon={Info} title="Sobre o território" />
                <dl>
                  <div>
                    <dt><MapPin /> Localização</dt>
                    <dd>{contextLabel}</dd>
                  </div>
                  {memberLabels.length > 0 ? (
                    <div>
                      <dt><UsersRound /> Áreas do território</dt>
                      <dd>{memberLabels.join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
              </aside>
            </div>

            <section className="pt-panel pt-home-businesses">
              <PanelHeading
                icon={Store}
                title="Empresas no território"
                description="Conheça negócios e serviços disponíveis nesta região."
                href={urls.business}
                label="Ver todas as empresas"
              />

              {businessesLoading ? (
                <div className="pt-business-preview-state">Carregando empresas…</div>
              ) : businessesError ? (
                <div className="pt-business-preview-empty">
                  Não foi possível carregar empresas agora.
                </div>
              ) : businessPreview.length > 0 ? (
                <div className="pt-business-preview-grid">
                  {businessPreview.map((business) => {
                    const href = getBusinessUrl(
                      business,
                      urls.business,
                      businessUrls.canonical,
                    );
                    const status = business.isOpen
                      ? "Aberto agora"
                      : business.statusText?.toLowerCase().includes("inform") || !business.statusText
                        ? "Horário não informado"
                        : "Fechado agora";

                    return (
                      <Link className="pt-business-preview-card" to={href} key={business.id}>
                        <div className="pt-business-preview-media">
                          <span aria-hidden="true"><Store /></span>
                          {business.logoUrl ? (
                            <img
                              src={business.logoUrl}
                              alt=""
                              loading="lazy"
                              onError={(event) => { event.currentTarget.hidden = true; }}
                            />
                          ) : null}
                        </div>
                        <div className="pt-business-preview-copy">
                          <small>{getBusinessCategoryLabel(business.category)}</small>
                          <h3>{business.name}</h3>
                          <p><MapPin /> {territoryName}</p>
                          <div>
                            <span className={business.isOpen ? "is-open" : ""}>{status}</span>
                            {business.rating > 0 ? (
                              <b><Star /> {business.rating.toFixed(1).replace(".", ",")}</b>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-business-preview-empty">
                  Ainda não há empresas publicadas neste território.
                </div>
              )}
            </section>

            <div className="pt-home-actions">
              <section className="pt-panel pt-home-nearby">
                <Navigation />
                <div>
                  <h2>Descubra o que está perto de você</h2>
                  <p>Informe sua localização para encontrar lugares próximos de verdade.</p>
                  <Link to={urls.nearby}>Abrir Perto de mim <ArrowRight /></Link>
                </div>
              </section>

              <section className="pt-panel pt-home-search-cta">
                <Search />
                <div>
                  <h2>O que você procura?</h2>
                  <p>Busque empresas, serviços e lugares neste território.</p>
                  <form action={urls.search} onSubmit={handleSearchSubmit}>
                    <Search />
                    <input name="q" aria-label="Buscar neste território" placeholder="Buscar neste território..." />
                    <button type="submit">Buscar <ArrowRight /></button>
                  </form>
                </div>
              </section>
            </div>
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
