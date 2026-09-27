import { lazy, Suspense, type ComponentType } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight, BriefcaseBusiness, BusFront, CalendarDays, ChevronDown,
  Clock3, Heart, Home, Image, Info, Map, MapPin, Menu, MessageCircle,
  Navigation, Search, ShieldCheck, ShoppingCart, Store, UsersRound,
  Utensils, Wrench,
} from "lucide-react";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/app/config/launchScope";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { getPublicTerritoryLocationLabel, resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks";
import "./TerritoryPortalPage.css";

const TerritoryMap = lazy(() => import("@/app/components/territory-vivo/TerritoryEntryMap"));
const NAME = TERRITORY_CONFIG.launch.community.name;
const resolved = resolvePublicTerritoryFallback({ state: TERRITORY_CONFIG.launch.state, city: TERRITORY_CONFIG.launch.city, territorySlug: TERRITORY_CONFIG.launch.community.slug });
const city = resolvePublicTerritoryFallback({ state: TERRITORY_CONFIG.launch.state, city: TERRITORY_CONFIG.launch.city });
const cityLocation = city?.kind === "location" ? city.location : null;
const members = resolved?.kind === "group" ? resolved.group.members : [];

function BrandMark() { return <span className="pt-brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>; }

type Shortcut = { label: string; description: string; href: string; icon: ComponentType<{ className?: string }>; surface?: LaunchSurfaceKey; primary?: boolean };
const shortcuts: readonly Shortcut[] = [
  { label: "Perto de mim", description: "Ver o que tem perto", href: LAUNCH_URLS.nearby, icon: Navigation, primary: true },
  { label: "Mapa", description: "Explorar o território", href: LAUNCH_URLS.mapTerritory, icon: Map },
  { label: "Empresas", description: "Comércio e serviços", href: LAUNCH_URLS.businessTerritory, icon: Store },
  { label: "Comunidade", description: "Conversas do bairro", href: LAUNCH_URLS.community, icon: UsersRound, surface: "community" },
  { label: "Serviços", description: "Profissionais locais", href: LAUNCH_URLS.servicesTerritory, icon: Wrench, surface: "services" },
  { label: "Eventos", description: "O que está rolando", href: LAUNCH_URLS.eventsTerritory, icon: CalendarDays, surface: "events" },
];
const businesses = [
  ["Mercadinho Amaralina", "Mercado", "450 m", ShoppingCart], ["Salão Beleza Negra", "Beleza e estética", "600 m", UsersRound],
  ["Restaurante da Dona Lúcia", "Gastronomia", "850 m", Utensils], ["Oficina do Baiano", "Autopeças e serviços", "1,2 km", Wrench],
] as const;
const nearby = [
  ["Farmácias", "12 próximos", Heart], ["Mercados", "18 próximos", ShoppingCart], ["Escolas", "8 próximos", BriefcaseBusiness],
  ["Postos de saúde", "5 próximos", ShieldCheck], ["Transporte", "10 próximos", BusFront],
] as const;
const news = [
  ["Praça do bairro recebe nova iluminação", "Infraestrutura", "há 2 horas"],
  ["Projeto de futebol para jovens está com inscrições abertas", "Esporte", "há 5 horas"],
  ["Feira de empreendedores locais acontece neste sábado", "Evento", "há 1 dia"],
] as const;

export default function TerritoryPortalPage() {
  return <div className="pt-page">
    <Helmet><title>{NAME} | Achegue-se</title><meta name="description" content={`Portal local do ${NAME}.`} /></Helmet>
    <a className="pt-skip-link" href="#pt-content">Pular para o conteúdo</a>
    <header className="pt-header"><div className="pt-container pt-header-inner">
      <Link className="pt-brand" to="/"><BrandMark /><strong>achegue-se</strong></Link>
      <nav><Link to={LAUNCH_URLS.nearby}>Por perto</Link><Link to="/como-funciona">Como funciona</Link><Link to={LAUNCH_URLS.businessTerritory}>Para negócios</Link></nav>
      <form className="pt-search" action={LAUNCH_URLS.search}><Search /><input name="q" aria-label="Buscar no território" placeholder="Buscar empresas, serviços, lugares..." /></form>
      <Link className="pt-location" to={LAUNCH_URLS.mapTerritory}><MapPin /> Salvador, BA <ChevronDown /></Link>
      <Link className="pt-login" to={AUTH_PATHS.login}>Entrar <ArrowRight /></Link>
      <details className="pt-mobile-menu">
        <summary aria-label="Abrir menu"><Menu /><span>Menu</span></summary>
        <nav aria-label="Navegação mobile">
          <Link to={LAUNCH_URLS.nearby}>Por perto</Link>
          <Link to="/como-funciona">Como funciona</Link>
          <Link to={LAUNCH_URLS.businessTerritory}>Para negócios</Link>
          <Link to={LAUNCH_URLS.mapTerritory}>Mapa do território</Link>
        </nav>
      </details>
    </div></header>

    <main id="pt-content" tabIndex={-1}>
      <section className="pt-hero" aria-labelledby="pt-title">
        <img src="/images/home/achegue-se-community-hero-v1.webp" alt={`Moradores reunidos no ${NAME}`} width="1536" height="1024" fetchPriority="high" /><div className="pt-hero-shade" />
        <div className="pt-container pt-hero-content"><p className="pt-breadcrumb"><Home /> Salvador <span>›</span> {NAME}</p><h1 id="pt-title">{NAME}</h1><p className="pt-tagline">Gente, cultura, negócios e tudo que você precisa, em um só lugar.</p>
          <div className="pt-shortcuts" aria-label="Atalhos do território">{shortcuts.map(({ icon: Icon, ...item }) => { const enabled = !item.surface || isLaunchSurfaceEnabled(item.surface); const body = <><Icon /><span><strong>{item.label}</strong><small>{item.description}</small></span>{!enabled && <b>Em breve</b>}</>; return enabled ? <Link className={item.primary ? "is-primary" : ""} to={item.href} key={item.label}>{body}</Link> : <div className="is-disabled" aria-disabled="true" key={item.label}>{body}</div>; })}</div>
        </div>
      </section>

      <div className="pt-container pt-dashboard">
        <section className="pt-panel pt-map-panel"><PanelHeading icon={Map} title="Mapa do território" description="Explore ruas, comércios, serviços e pontos de interesse." href={LAUNCH_URLS.mapTerritory} label="Abrir mapa" />
          <div className="pt-map-shell"><Suspense fallback={<div className="pt-map-loading">Carregando mapa…</div>}><TerritoryMap city={cityLocation} resolvedTerritory={resolved} label={NAME} /></Suspense></div>
          <div className="pt-map-legend"><span>Todos</span><span>● Alimentação</span><span>● Comércio</span><span>● Serviços</span><span>● Saúde</span></div>
        </section>

        <section className="pt-panel pt-business-panel"><PanelHeading icon={Store} title="Empresas em destaque" description="Negócios locais que fazem a diferença." href={LAUNCH_URLS.businessTerritory} label="Ver todas" />
          <div className="pt-business-grid">{businesses.map(([name, category, distance, Icon], index) => <Link to={LAUNCH_URLS.businessTerritory} key={name}><div className={`pt-business-image crop-${index}`}><Icon /></div><strong>{name}</strong><small>{category}</small><p>{distance}</p><span>★ 4.{8 - index} <em>({128 - index * 21})</em></span></Link>)}</div>
        </section>

        <aside className="pt-panel pt-about"><PanelHeading icon={Info} title="Sobre o território" /><p>O {NAME} é uma das maiores comunidades de Salvador, com forte cultura, história e diversidade de serviços, comércios e iniciativas locais.</p>
          <dl><div><dt><MapPin /> Região</dt><dd>Salvador, BA</dd></div><div><dt><UsersRound /> Principais áreas</dt><dd>{members.map(getPublicTerritoryLocationLabel).join(", ")}</dd></div><div><dt><Store /> Características</dt><dd>Cultura, comércio local, turismo e educação</dd></div></dl>
        </aside>

        <section className="pt-panel pt-nearby"><PanelHeading icon={Navigation} title="Perto de você" description="Lugares e serviços próximos à sua localização." href={LAUNCH_URLS.nearby} label="Ver mais" />
          <div className="pt-nearby-grid">{nearby.map(([label, meta, Icon]) => <Link to={LAUNCH_URLS.nearby} key={label}><Icon /><strong>{label}</strong><small>{meta}</small></Link>)}</div>
        </section>

        <aside className="pt-panel pt-news"><PanelHeading icon={Clock3} title="Últimas do território" href={LAUNCH_URLS.community} label="Ver todas" /><div>{news.map(([title, tag, time], index) => <Link to={LAUNCH_URLS.community} key={title}><span className={`pt-news-thumb crop-${index}`} /><span><strong>{title}</strong><em>{tag}</em><small>{time} · <Heart /> {24 + index * 32} <MessageCircle /> {8 + index * 4}</small></span></Link>)}</div></aside>

        <section className="pt-panel pt-gallery"><PanelHeading icon={Image} title="Galeria do território" description="Fotos e momentos que mostram a vida daqui." href={LAUNCH_URLS.community} label="Ver mais" />
          <div className="pt-gallery-grid">{[0,1,2,3,4].map(item => <div className={`crop-${item}`} key={item} />)}<Link to={LAUNCH_URLS.community}>+12<br /><small>fotos</small></Link></div>
        </section>
      </div>
    </main>
    <footer className="pt-footer"><div className="pt-container pt-footer-inner">
      <Link className="pt-brand" to="/"><BrandMark /><strong>achegue-se</strong></Link>
      <p>Informação local para quem vive, trabalha e circula pelo território.</p>
      <nav aria-label="Links institucionais"><Link to="/como-funciona">Como funciona</Link><Link to="/sobre">Sobre</Link></nav>
    </div></footer>
  </div>;
}

function PanelHeading({ icon: Icon, title, description, href, label }: { icon: ComponentType<{ className?: string }>; title: string; description?: string; href?: string; label?: string }) {
  return <div className="pt-panel-heading"><div><Icon /><span><h2>{title}</h2>{description && <p>{description}</p>}</span></div>{href && <Link to={href}>{label} <ArrowRight /></Link>}</div>;
}
