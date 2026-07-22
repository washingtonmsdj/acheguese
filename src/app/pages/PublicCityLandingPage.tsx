import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Compass,
  Home as HomeIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/config/launchScope";
import { LAUNCH_CITY_PATH, LAUNCH_URLS } from "@/config/territory";
import {
  HomeDiscoveryService,
  type HomeCommunityActivity,
  type HomeCommunityCard,
  type HomeImageKey,
  type HomeSponsoredItem,
  type HomeStatCard,
} from "@/core/landing/services";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import {
  getHomeDiscoveryDocumentHref,
  getHomeDiscoveryDocumentMeta,
  withQueryParams,
} from "@/core/landing/utils/landingPresentation";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import { buildCommunityAliasUrl, buildCommunityScopedUrl } from "@/core/routing/utils/territoryUrls";
import { PublicHeaderMobileMenu } from "@/core/navigation/PublicHeaderMobileMenu";
import {
  buildPublicHeaderNavigation,
  type PublicHeaderNavItem,
  type PublicHeaderNavItemId,
} from "@/core/navigation/publicHeaderNavigation";
import type { SearchDocument } from "@/core/search";
import { useSessionContext } from "@/core/session";

import bairroChapada from "@/assets/bairro-chapada.jpg";
import bairroOndina from "@/assets/bairro-ondina.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";
import bairroSantaCruz from "@/assets/bairro-santa-cruz.jpg";
import bairroStiep from "@/assets/bairro-stiep.jpg";
import complexoComercio from "@/assets/complexo-comercio.jpg";
import complexoCultura from "@/assets/complexo-cultura.jpg";
import complexoMusica from "@/assets/complexo-musica.jpg";
import empresasHero from "@/assets/empresas-hero.jpg";
import gastronomyHero from "@/assets/gastronomy-hero-bg.jpg";
import heroImg from "@/assets/hero-landing-main.jpg";
import neighborhoodFeatured from "@/assets/neighborhood-featured.jpg";
import personaComerciante from "@/assets/persona-comerciante.jpg";
import personaEmprego from "@/assets/persona-emprego.jpg";
import personaMorador from "@/assets/persona-morador.jpg";
import personaPrestador from "@/assets/persona-prestador.jpg";
import servicosHero from "@/assets/servicos-hero.jpg";
import "./PublicCityLandingPage.css";

type NavItem = PublicHeaderNavItem & {
  mobileHeader?: "primary" | "secondary";
};

const HOME_DESKTOP_NAV_IDS = new Set<PublicHeaderNavItemId>([
  "home",
  "community",
  "business",
  "classifieds",
  "services",
  "map",
]);

type Chip = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type HeaderSessionActions = {
  isAuthenticated: boolean;
  loginHref: string;
  notificationHref: string;
  profileAvatarUrl: string | null;
  profileHref: string;
  profileName: string;
  unreadCount: number;
};

type VisualTone = "cyan" | "green" | "blue" | "amber" | "pink" | "red" | "neutral";

type HighlightCard = {
  label: string;
  title: string;
  meta: string;
  detail: string;
  href: string;
  image: string;
  tone: VisualTone;
  icon: LucideIcon;
  surface?: LaunchSurfaceKey;
};

type ModuleTile = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: VisualTone;
  surface?: LaunchSurfaceKey;
};

const cityPath = LAUNCH_CITY_PATH;
const searchHref = LAUNCH_URLS.search;
const homeDiscoveryFallback = HomeDiscoveryService.getFallbackHomeDiscovery();
const avatarImages = [personaMorador, personaComerciante, personaPrestador, personaEmprego];
const homeAvatarsByKey: Record<HomeCommunityActivity["avatarKey"], string> = {
  comerciante: personaComerciante,
  emprego: personaEmprego,
  morador: personaMorador,
  prestador: personaPrestador,
};
const homeImagesByKey: Record<HomeImageKey, string> = {
  bairroChapada,
  bairroOndina,
  bairroPituba,
  bairroRioVermelho,
  bairroSantaCruz,
  bairroStiep,
  complexoComercio,
  complexoCultura,
  complexoMusica,
  empresasHero,
  gastronomyHero,
  heroImg,
  neighborhoodFeatured,
  servicosHero,
};
const statIcons: Record<HomeStatCard["id"], LucideIcon> = {
  businesses: Building2,
  classifieds: Tag,
  events: Calendar,
  rating: Star,
  services: Wrench,
};

const quickChips: Chip[] = [
  { label: "Restaurantes", href: LAUNCH_URLS.gastronomy, icon: UtensilsCrossed },
  { label: "Empresas", href: LAUNCH_URLS.business, icon: Building2 },
  { label: "Serviços", href: LAUNCH_URLS.services, icon: Wrench },
  { label: "Eventos", href: LAUNCH_URLS.events, icon: Calendar },
  { label: "+ Mais", href: searchHref, icon: MoreHorizontal },
];

const fallbackHighlights: HighlightCard[] = [
  {
    label: "Evento hoje",
    title: "Samba na Praça",
    meta: "19h - Praça da Pituba",
    detail: "Música",
    href: LAUNCH_URLS.events,
    image: complexoMusica,
    tone: "blue",
    icon: Calendar,
    surface: "events",
  },
  {
    label: "Promoção",
    title: "Rodízio de Pizza",
    meta: "Dom Salvador",
    detail: "até 30% OFF",
    href: LAUNCH_URLS.gastronomy,
    image: gastronomyHero,
    tone: "green",
    icon: UtensilsCrossed,
    surface: "coupons",
  },
  {
    label: "Nova empresa",
    title: "Academia Strong",
    meta: "Pituba",
    detail: "Aberto agora",
    href: LAUNCH_URLS.business,
    image: empresasHero,
    tone: "blue",
    icon: Building2,
    surface: "business",
  },
  {
    label: "Aviso",
    title: "Interdição na Rua dos Navegantes",
    meta: "Hoje, das 8h às 17h",
    detail: "Trânsito",
    href: buildCommunityAliasUrl("rio-vermelho", "feed"),
    image: heroImg,
    tone: "red",
    icon: Bell,
    surface: "communityAlerts",
  },
];

function formatNotificationBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function getInitials(value: string): string {
  const initials = value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "A";
}

function BrandMark() {
  return (
    <span className="home-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 38 46" role="img">
        <path
          d="M19 3.5c8.2 0 14.8 6.4 14.8 14.2 0 10.6-10.7 18-14.8 23.2C14.9 35.7 4.2 28.3 4.2 17.7 4.2 9.9 10.8 3.5 19 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinejoin="round"
        />
        <path
          d="M13.1 16.8c0-2.6 2.1-4.4 4.3-4.4 1.1 0 2.2.5 3 1.4.8-.9 1.9-1.4 3-1.4 2.2 0 4.3 1.8 4.3 4.4 0 4.1-5.4 6.8-7.3 9.1-1.9-2.3-7.3-5-7.3-9.1Z"
          fill="currentColor"
        />
        <circle cx="19" cy="32.2" r="3" fill="currentColor" />
      </svg>
    </span>
  );
}

function HeaderNav({
  navItems,
  mobileNavItems,
  sessionActions,
}: {
  navItems: NavItem[];
  mobileNavItems: PublicHeaderNavItem[];
  sessionActions: HeaderSessionActions;
}) {
  const notificationTarget = sessionActions.isAuthenticated
    ? sessionActions.notificationHref
    : sessionActions.loginHref;
  const profileTarget = sessionActions.isAuthenticated
    ? sessionActions.profileHref
    : sessionActions.loginHref;
  const notificationAriaLabel = sessionActions.isAuthenticated
    ? sessionActions.unreadCount > 0
      ? `Abrir notificações, ${sessionActions.unreadCount} não lidas`
      : "Abrir notificações"
    : "Entrar para ver notificações";
  const profileAriaLabel = sessionActions.isAuthenticated
    ? `Abrir perfil de ${sessionActions.profileName}`
    : "Entrar na conta";

  return (
    <header className="home-header" aria-label="Navegação principal">
      <Link className="home-brand" to="/">
        <BrandMark />
        <span>Achegue-se</span>
      </Link>

      <nav className="home-nav" aria-label="Seções">
        {navItems.map((item) => {
          const className = [
            item.label === "Início" ? "is-active" : null,
            item.mobileHeader === "secondary" ? "is-mobile-secondary" : null,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link key={item.label} to={item.href} className={className || undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="home-actions">
        <Link to={cityPath} className="home-action-pill home-location-pill">
          <MapPin aria-hidden="true" />
          <span>Salvador, BA</span>
          <ChevronDown aria-hidden="true" />
        </Link>
        <Link to={notificationTarget} className="home-notification-button" aria-label={notificationAriaLabel}>
          <Bell aria-hidden="true" />
          {sessionActions.isAuthenticated && sessionActions.unreadCount > 0 ? (
            <span>{formatNotificationBadgeCount(sessionActions.unreadCount)}</span>
          ) : null}
        </Link>
        <Link to={profileTarget} className="home-user-avatar" aria-label={profileAriaLabel}>
          {sessionActions.profileAvatarUrl ? (
            <img src={sessionActions.profileAvatarUrl} alt="" />
          ) : (
            <span className="home-user-avatar-fallback" aria-hidden="true">
              {getInitials(sessionActions.profileName)}
            </span>
          )}
          <ChevronDown aria-hidden="true" />
        </Link>
        <PublicHeaderMobileMenu items={mobileNavItems} className="home-mobile-menu" />
      </div>
    </header>
  );
}

function HeroBadges({ communityHref }: { communityHref: string }) {
  return (
    <div className="home-hero-badges" aria-label="Local e comunidade">
      <Link to={cityPath} className="home-glass-badge">
        <MapPin aria-hidden="true" />
        <span>Salvador, BA</span>
      </Link>
      <Link to={communityHref} className="home-glass-badge">
        <Users aria-hidden="true" />
        <span>Comunidade em alta</span>
      </Link>
    </div>
  );
}

function SearchPanel() {
  const navigate = useNavigate();
  const searchPlaceholder = isLaunchSurfaceEnabled("events")
    ? "Buscar comunidades, empresas, eventos, servicos..."
    : "Buscar comunidades, empresas, servicos...";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    const target = query ? withQueryParams(searchHref, { q: query }) : searchHref;
    navigate(target);
  };

  return (
    <form className="home-search-panel" onSubmit={handleSubmit} role="search">
      <label className="home-search-field">
        <span className="sr-only">Buscar no Achegue-se</span>
        <input
          name="q"
          type="search"
          autoComplete="off"
          placeholder={searchPlaceholder}
        />
      </label>
      <button type="submit" className="home-search-submit" aria-label="Buscar">
        <Search aria-hidden="true" />
      </button>
      <div className="home-chip-row" aria-label="Buscas rápidas">
        {quickChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <Link key={chip.label} to={chip.href} className="home-chip">
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </form>
  );
}

function AvatarStack({ count }: { count: number }) {
  return (
    <span className="home-avatar-stack" aria-label={`${count} membros recentes`}>
      {avatarImages.map((avatar, index) => (
        <img key={avatar} src={avatar} alt="" style={{ zIndex: avatarImages.length - index }} />
      ))}
      <span>+{count}</span>
    </span>
  );
}

function FeaturedCommunitiesPanel({ communities }: { communities: HomeCommunityCard[] }) {
  return (
    <section className="home-featured-communities" aria-labelledby="featured-communities-title">
      <div className="home-section-heading">
        <h2 id="featured-communities-title">Comunidades em destaque</h2>
        <Link to={LAUNCH_URLS.community}>Ver todas</Link>
      </div>
      <div className="home-featured-community-grid">
        {communities.map((community) => (
          <Link key={community.id} to={community.href} className="home-community-card">
            <img src={homeImagesByKey[community.imageKey]} alt="" />
            <span className="home-community-card-shade" aria-hidden="true" />
            {community.badge ? <span className="home-community-badge">{community.badge}</span> : null}
            <span className="home-community-card-copy">
              <strong>{community.name}</strong>
              <small>{community.membersLabel}</small>
              <AvatarStack count={community.avatarCount} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function resolveDocumentLabel(document: SearchDocument): Pick<HighlightCard, "label" | "tone" | "icon"> {
  switch (document.type) {
    case "business":
      return { label: "Nova empresa", tone: "blue", icon: Building2 };
    case "professional":
      return { label: "Serviço", tone: "amber", icon: Wrench };
    case "opportunity":
      return { label: "Vaga", tone: "blue", icon: Briefcase };
    case "classified":
      return { label: "Classificado", tone: "pink", icon: Tag };
    case "event":
      return { label: "Evento hoje", tone: "blue", icon: Calendar };
    case "community":
    case "post":
      return { label: "Comunidade", tone: "green", icon: Users };
    default:
      return { label: "Destaque", tone: "cyan", icon: Bell };
  }
}

function getFallbackImageForDocument(document: SearchDocument, index: number): string {
  if (document.imageUrl) return document.imageUrl;

  const fallbackImages = [complexoMusica, gastronomyHero, empresasHero, heroImg, servicosHero];
  return fallbackImages[index % fallbackImages.length];
}

function toHighlightCards(documents: SearchDocument[], communityHref: string): HighlightCard[] {
  const dynamicCards = documents.slice(0, 4).map((document, index) => {
    const label = resolveDocumentLabel(document);
    const meta = getHomeDiscoveryDocumentMeta(document) || document.subtitle || "Salvador, BA";
    const detail = document.description && document.description !== document.title ? document.description : meta;

    return {
      ...label,
      title: document.title,
      meta,
      detail,
      href: getHomeDiscoveryDocumentHref(document, communityHref),
      image: getFallbackImageForDocument(document, index),
    };
  });
  const enabledFallbacks = fallbackHighlights.filter(
    (card) => !card.surface || isLaunchSurfaceEnabled(card.surface),
  );

  return [...dynamicCards, ...enabledFallbacks].slice(0, 4);
}

function HappeningCard({ card }: { card: HighlightCard }) {
  const Icon = card.icon;

  return (
    <Link to={card.href} className="home-happening-card">
      <img src={card.image} alt="" loading="lazy" />
      <span className="home-happening-shade" aria-hidden="true" />
      <span className={`home-card-label is-${card.tone}`}>
        <Icon aria-hidden="true" />
        {card.label}
      </span>
      <span className="home-happening-copy">
        <strong>{card.title}</strong>
        <small>{card.meta}</small>
        <em>{card.detail}</em>
      </span>
    </Link>
  );
}

function HappeningSkeleton() {
  return (
    <div className="home-happening-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="home-happening-card is-skeleton">
          <span className="home-skel home-skel-cover" />
          <span className="home-happening-skel-copy">
            <span className="home-skel home-skel-line" style={{ width: "68%" }} />
            <span className="home-skel home-skel-line" style={{ width: "42%" }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function HappeningPanel({
  cards,
  isLoading,
}: {
  cards: HighlightCard[];
  isLoading?: boolean;
}) {
  return (
    <section className="home-panel home-happening-panel" aria-labelledby="happening-title">
      <div className="home-panel-heading">
        <h2 id="happening-title">O que está acontecendo perto de você</h2>
        <Link to={LAUNCH_URLS.community}>Ver tudo</Link>
      </div>
      {isLoading && cards.length === 0 ? (
        <HappeningSkeleton />
      ) : (
        <div className="home-happening-grid">
          {cards.map((card) => (
            <HappeningCard key={`${card.label}-${card.title}`} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}

function ModuleTiles({ communityHref }: { communityHref: string }) {
  const tiles: ModuleTile[] = [
    { label: "Empresas", description: "Comércios locais", href: LAUNCH_URLS.business, icon: Building2, tone: "green" },
    { label: "Eventos", description: "Na sua região", href: LAUNCH_URLS.events, icon: Calendar, tone: "red", surface: "events" },
    { label: "Classificados", description: "Compre e venda", href: LAUNCH_URLS.classifieds, icon: Tag, tone: "blue" },
    { label: "Serviços", description: "Profissionais", href: LAUNCH_URLS.services, icon: Wrench, tone: "amber" },
    { label: "Grupos", description: "Interesses", href: buildCommunityScopedUrl(communityHref, "grupos"), icon: Users, tone: "blue" },
    {
      label: "Imóveis",
      description: "Aluguel e venda",
      href: withQueryParams(LAUNCH_URLS.classifieds, { q: "imóveis" }),
      icon: HomeIcon,
      tone: "cyan",
    },
    { label: "Vagas", description: "Oportunidades", href: LAUNCH_URLS.jobs, icon: Briefcase, tone: "blue", surface: "jobs" },
    { label: "Mais", description: "Ver tudo", href: searchHref, icon: MoreHorizontal, tone: "neutral" },
  ];
  const enabledTiles = tiles.filter(
    (tile) => !tile.surface || isLaunchSurfaceEnabled(tile.surface),
  );

  return (
    <section className="home-panel home-modules-panel" aria-labelledby="modules-title">
      <div className="home-panel-heading">
        <h2 id="modules-title">Encontre o que precisa na sua comunidade</h2>
        <Link to={searchHref}>Ver todas</Link>
      </div>
      <div className="home-module-tile-grid">
        {enabledTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.label} to={tile.href} className="home-module-tile">
              <span className={`home-module-icon is-${tile.tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <span>
                <strong>{tile.label}</strong>
                <small>{tile.description}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <div className="home-community-activity-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="home-community-activity-item is-skeleton">
          <span className="home-skel home-community-activity-avatar" />
          <div className="home-community-activity-copy">
            <span className="home-skel home-skel-line" style={{ width: "58%" }} />
            <span className="home-skel home-skel-line" style={{ width: "92%" }} />
            <span className="home-skel home-skel-line" style={{ width: "72%" }} />
          </div>
          <span className="home-skel home-community-activity-meta-skel" />
        </div>
      ))}
    </div>
  );
}

function ActivityEmptyState() {
  return (
    <div className="home-community-activity-empty" role="status">
      <span className="home-community-activity-empty-icon" aria-hidden="true">
        <Users />
      </span>
      <strong>Nenhuma atividade por aqui ainda</strong>
      <p>Assim que os vizinhos publicarem, comentarem ou reagirem, tudo aparece aqui em tempo real.</p>
      <Link to={LAUNCH_URLS.community} className="home-community-activity-empty-cta">
        Explorar comunidades
      </Link>
    </div>
  );
}

function CommunityActivityPanel({
  activities,
  isLoading,
}: {
  activities: HomeCommunityActivity[];
  isLoading?: boolean;
}) {
  const showSkeleton = isLoading && activities.length === 0;
  const showEmpty = !isLoading && activities.length === 0;

  return (
    <section className="home-panel home-activity-panel" aria-labelledby="activity-title">
      <div className="home-panel-heading">
        <h2 id="activity-title">Atividades nas comunidades</h2>
        <Link to={LAUNCH_URLS.community} aria-label="Ver todas as atividades nas comunidades">
          Ver todas
        </Link>
      </div>

      {showSkeleton ? <ActivitySkeleton /> : null}
      {showEmpty ? <ActivityEmptyState /> : null}

      {!showSkeleton && !showEmpty ? (
        <ul className="home-community-activity-list" role="list" aria-label="Atividades recentes">
          {activities.map((activity) => (
            <li key={activity.id} className="home-community-activity-item">
              <img
                className="home-community-activity-avatar"
                src={homeAvatarsByKey[activity.avatarKey]}
                alt=""
                loading="lazy"
                decoding="async"
                width={40}
                height={40}
              />
              <div className="home-community-activity-copy">
                <strong>
                  <span className="home-community-activity-author">{activity.author}</span>
                  <small aria-label={`Comunidade ${activity.community}`}>{activity.community}</small>
                  {activity.verified ? (
                    <ShieldCheck aria-label={`${activity.author} é um perfil verificado`} role="img" />
                  ) : null}
                </strong>
                <p>{activity.text}</p>
              </div>
              {activity.imageKey ? (
                <img
                  className="home-community-activity-preview"
                  src={homeImagesByKey[activity.imageKey]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="home-community-activity-meta">
                <time dateTime={activity.time}>{activity.time}</time>
                <span aria-label={`${activity.comments} comentários`}>
                  <MessageCircle aria-hidden="true" focusable="false" />
                  <span aria-hidden="true">{activity.comments}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CommunityRankingPanel({ communities }: { communities: HomeCommunityCard[] }) {
  return (
    <section className="home-panel home-ranking-panel" aria-labelledby="ranking-title">
      <div className="home-panel-heading">
        <h2 id="ranking-title">Ranking das comunidades</h2>
        <Link to={LAUNCH_URLS.community}>Ver ranking</Link>
      </div>
      <div className="home-community-ranking-list">
        {communities.map((community, index) => (
          <Link key={community.id} to={community.href} className="home-community-ranking-item">
            <span>{index + 1}</span>
            <img src={homeImagesByKey[community.imageKey]} alt="" />
            <strong>
              {community.name}
              <small>{community.membersLabel}</small>
            </strong>
            <em>{community.deltaLabel}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function SponsoredSkeleton() {
  return (
    <div className="home-sponsored-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="home-sponsored-item is-skeleton">
          <span className="home-skel home-skel-thumb" />
          <span className="home-sponsored-skel-copy">
            <span className="home-skel home-skel-line" style={{ width: "72%" }} />
            <span className="home-skel home-skel-line" style={{ width: "48%" }} />
            <span className="home-skel home-skel-line" style={{ width: "88%" }} />
          </span>
          <span className="home-skel home-skel-badge" />
        </div>
      ))}
    </div>
  );
}

function SponsoredPanel({
  items,
  isLoading,
}: {
  items: HomeSponsoredItem[];
  isLoading?: boolean;
}) {
  return (
    <section className="home-panel home-sponsored-panel" aria-labelledby="sponsored-title">
      <div className="home-panel-heading">
        <h2 id="sponsored-title">Anúncios de empresas locais</h2>
        <Link to={LAUNCH_URLS.business}>Ver todos</Link>
      </div>
      {isLoading ? (
        <SponsoredSkeleton />
      ) : items.length === 0 ? (
        <div className="home-sponsored-empty">
          <span className="home-sponsored-empty-icon" aria-hidden="true">
            <Megaphone />
          </span>
          <strong>Sem anúncios ativos</strong>
          <small>Campanhas aprovadas aparecem aqui assim que forem publicadas.</small>
          <Link to={LAUNCH_URLS.business} className="home-sponsored-empty-cta">
            Anunciar meu negócio
          </Link>
        </div>
      ) : (
        <div className="home-sponsored-list">
          {items.map((item) => {
            const content = (
              <>
                <img src={item.imageUrl || homeImagesByKey[item.imageKey]} alt="" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.community}</small>
                  <em>{item.description}</em>
                </span>
                <b>Patrocinado</b>
              </>
            );

            return isExternalHref(item.href) ? (
              <a
                key={item.id}
                href={item.href}
                className="home-sponsored-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <Link key={item.id} to={item.href} className="home-sponsored-item">
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CommunitySuggestionsPanel({ communities }: { communities: HomeCommunityCard[] }) {
  return (
    <section className="home-panel home-suggestions-panel" aria-labelledby="suggestions-title">
      <div className="home-panel-heading">
        <h2 id="suggestions-title">Sugestões para você participar</h2>
        <Link to={LAUNCH_URLS.community}>Ver todas</Link>
      </div>
      <div className="home-suggestion-list">
        {communities.map((community) => (
          <Link key={community.id} to={community.href} className="home-suggestion-card">
            <img src={homeImagesByKey[community.imageKey]} alt="" loading="lazy" />
            <span className="home-suggestion-shade" aria-hidden="true" />
            <span>
              <strong>{community.name}</strong>
              <small>{community.membersLabel}</small>
              <em>Participar</em>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatsBar({ stats }: { stats: HomeStatCard[] }) {
  return (
    <section className="home-stats" aria-label="Indicadores da comunidade">
      {stats.map((stat) => {
        const Icon = statIcons[stat.id];
        return (
          <div key={stat.id} className="home-stat-item">
            <Icon className={`is-${stat.tone}`} aria-hidden="true" />
            <span>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </span>
          </div>
        );
      })}
    </section>
  );
}

/* ============================================================
 * HOME 1.0 — Bairro digital
 * Território → Busca → Hoje no bairro → Ações rápidas
 *   → Destaques (timeline) → Explorar → FAB
 * Apenas layout/hierarquia; nenhuma nova regra de negócio.
 * ============================================================ */

function TerritoryBlock({ communityHref }: { communityHref: string }) {
  return (
    <section className="home1-territory" aria-label="Seu território">
      <div className="home1-territory-marker" aria-hidden="true">
        <MapPin />
      </div>
      <div className="home1-territory-copy">
        <span className="home1-territory-eyebrow">Você está em</span>
        <h1>Salvador, BA</h1>
        <p>Seu bairro digital — pessoas, negócios e o que acontece agora.</p>
      </div>
      <Link to={communityHref} className="home1-territory-switch">
        Trocar bairro
        <ChevronDown aria-hidden="true" />
      </Link>
    </section>
  );
}

function HomeSearchBar() {
  const navigate = useNavigate();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    navigate(query ? withQueryParams(searchHref, { q: query }) : searchHref);
  };
  return (
    <form className="home1-search" onSubmit={handleSubmit} role="search">
      <Search className="home1-search-icon" aria-hidden="true" />
      <label className="sr-only" htmlFor="home1-search-input">
        Buscar no bairro
      </label>
      <input
        id="home1-search-input"
        name="q"
        type="search"
        autoComplete="off"
        placeholder="O que você procura no bairro?"
      />
      <button type="submit" className="home1-search-submit" aria-label="Buscar">
        <Search aria-hidden="true" />
      </button>
    </form>
  );
}

function TodayInNeighborhood({
  cards,
  isLoading,
}: {
  cards: HighlightCard[];
  isLoading?: boolean;
}) {
  const items = cards.slice(0, 3);
  return (
    <section className="home1-today" aria-labelledby="home1-today-title">
      <div className="home1-section-heading">
        <div>
          <h2 id="home1-today-title">Hoje no bairro</h2>
          <p>O que está acontecendo agora perto de você.</p>
        </div>
      </div>
      {isLoading && items.length === 0 ? (
        <div className="home1-today-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="home1-today-card is-skeleton">
              <span className="home-skel home-skel-cover" />
              <span className="home-skel home-skel-line" style={{ width: "70%" }} />
              <span className="home-skel home-skel-line" style={{ width: "45%" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="home1-today-grid">
          {items.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={`${card.label}-${card.title}`} to={card.href} className="home1-today-card">
                <img src={card.image} alt="" loading="lazy" />
                <span className="home1-today-shade" aria-hidden="true" />
                <span className={`home1-today-badge is-${card.tone}`}>
                  <Icon aria-hidden="true" />
                  {card.label}
                </span>
                <span className="home1-today-copy">
                  <strong>{card.title}</strong>
                  <small>{card.meta}</small>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

type QuickAction = { label: string; href: string; icon: LucideIcon };

function QuickActions() {
  const actions: QuickAction[] = [
    { label: "Buscar", href: searchHref, icon: Search },
    { label: "Perto de mim", href: LAUNCH_URLS.map, icon: Navigation },
    { label: "Comer agora", href: LAUNCH_URLS.gastronomy, icon: UtensilsCrossed },
    { label: "Mobilidade", href: withQueryParams(searchHref, { q: "mobilidade" }), icon: Compass },
  ];
  return (
    <nav className="home1-quick" aria-label="Ações rápidas">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} to={action.href} className="home1-quick-item">
            <span className="home1-quick-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>{action.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

type FeedItem = {
  id: string;
  kind: "post" | "business" | "event" | "alert" | "promo" | "classified";
  title: string;
  excerpt: string;
  meta: string;
  href: string;
  image?: string;
  author?: string;
  avatar?: string;
};

function buildFeedItems(
  activities: HomeCommunityActivity[],
  highlights: HighlightCard[],
  sponsored: HomeSponsoredItem[],
): FeedItem[] {
  const posts: FeedItem[] = activities.slice(0, 4).map((a) => ({
    id: `post-${a.id}`,
    kind: "post",
    title: a.author,
    excerpt: a.text,
    meta: `${a.community} · ${a.time}`,
    href: LAUNCH_URLS.community,
    image: a.imageKey ? homeImagesByKey[a.imageKey] : undefined,
    author: a.author,
    avatar: homeAvatarsByKey[a.avatarKey],
  }));
  const cards: FeedItem[] = highlights.slice(0, 3).map((h, idx) => ({
    id: `hl-${idx}-${h.title}`,
    kind: h.label.toLowerCase().includes("aviso") || h.label.toLowerCase().includes("alerta")
      ? "alert"
      : h.label.toLowerCase().includes("evento")
        ? "event"
        : h.label.toLowerCase().includes("promo")
          ? "promo"
          : "business",
    title: h.title,
    excerpt: h.detail,
    meta: h.meta,
    href: h.href,
    image: h.image,
  }));
  const ads: FeedItem[] = sponsored.slice(0, 2).map((s) => ({
    id: `sp-${s.id}`,
    kind: "business",
    title: s.title,
    excerpt: s.description,
    meta: s.community,
    href: s.href,
    image: s.imageUrl || homeImagesByKey[s.imageKey],
  }));
  // Interleave to avoid perceived module grouping
  const merged: FeedItem[] = [];
  const queues = [posts, cards, ads];
  let i = 0;
  while (queues.some((q) => q.length)) {
    const q = queues[i % queues.length];
    if (q.length) merged.push(q.shift()!);
    i++;
  }
  return merged.slice(0, 8);
}

function DestaquesTimeline({ items, isLoading }: { items: FeedItem[]; isLoading?: boolean }) {
  return (
    <section className="home1-feed" aria-labelledby="home1-feed-title">
      <div className="home1-section-heading">
        <div>
          <h2 id="home1-feed-title">Destaques</h2>
          <p>O que vale a pena ver por aqui.</p>
        </div>
        <Link to={LAUNCH_URLS.community} className="home1-section-link">
          Ver tudo
        </Link>
      </div>
      {isLoading && items.length === 0 ? (
        <div className="home1-feed-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="home1-feed-item is-skeleton">
              <span className="home-skel home-skel-thumb" />
              <span className="home-skel home-skel-line" style={{ width: "60%" }} />
              <span className="home-skel home-skel-line" style={{ width: "90%" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="home1-feed-list">
          {items.map((item) => (
            <Link key={item.id} to={item.href} className="home1-feed-item">
              {item.avatar ? (
                <img className="home1-feed-avatar" src={item.avatar} alt="" loading="lazy" />
              ) : item.image ? (
                <img className="home1-feed-thumb" src={item.image} alt="" loading="lazy" />
              ) : (
                <span className="home1-feed-thumb home1-feed-thumb-placeholder" aria-hidden="true">
                  <MapPin />
                </span>
              )}
              <span className="home1-feed-copy">
                <strong>{item.title}</strong>
                <p>{item.excerpt}</p>
                <small>{item.meta}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type ExploreEntry = {
  label: string;
  emoji: string;
  href: string;
  surface?: LaunchSurfaceKey;
};

function ExploreBlock() {
  const entries: ExploreEntry[] = [
    { label: "Gastronomia", emoji: "🍔", href: LAUNCH_URLS.gastronomy },
    { label: "Mobilidade", emoji: "🚗", href: withQueryParams(searchHref, { q: "mobilidade" }) },
    { label: "Empresas", emoji: "🏪", href: LAUNCH_URLS.business },
    { label: "Serviços", emoji: "🧑‍🔧", href: LAUNCH_URLS.services },
    { label: "Imóveis", emoji: "🏡", href: withQueryParams(LAUNCH_URLS.classifieds, { q: "imóveis" }) },
    { label: "Vagas", emoji: "💼", href: LAUNCH_URLS.jobs, surface: "jobs" },
    { label: "Classificados", emoji: "📦", href: LAUNCH_URLS.classifieds },
    { label: "Eventos", emoji: "🎭", href: LAUNCH_URLS.events, surface: "events" },
  ];
  const enabled = entries.filter((e) => !e.surface || isLaunchSurfaceEnabled(e.surface));
  return (
    <section className="home1-explore" aria-labelledby="home1-explore-title">
      <div className="home1-section-heading">
        <div>
          <h2 id="home1-explore-title">Explore mais do seu bairro</h2>
          <p>Universos especializados para descobrir com calma.</p>
        </div>
      </div>
      <div className="home1-explore-grid">
        {enabled.map((entry) => (
          <Link key={entry.label} to={entry.href} className="home1-explore-tile">
            <span className="home1-explore-emoji" aria-hidden="true">
              {entry.emoji}
            </span>
            <span>{entry.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

type FabAction = { label: string; href: string; icon: LucideIcon };

function ComposeFab({ communityHref }: { communityHref: string }) {
  const [open, setOpen] = useState(false);
  const actions: FabAction[] = [
    { label: "Publicar", href: "/novo-post", icon: MessageCircle },
    { label: "Perguntar", href: withQueryParams("/novo-post", { tipo: "pergunta" }), icon: MessageCircle },
    { label: "Criar alerta", href: withQueryParams("/novo-post", { tipo: "alerta" }), icon: Bell },
    { label: "Criar evento", href: LAUNCH_URLS.events, icon: Calendar },
    { label: "Cadastrar empresa", href: LAUNCH_URLS.business, icon: Building2 },
    { label: "Criar anúncio", href: LAUNCH_URLS.classifieds, icon: Megaphone },
  ];
  void communityHref;

  return (
    <div className={`home1-fab ${open ? "is-open" : ""}`}>
      {open ? (
        <button
          type="button"
          className="home1-fab-backdrop"
          aria-label="Fechar menu de criação"
          onClick={() => setOpen(false)}
        />
      ) : null}
      {open ? (
        <div className="home1-fab-menu" role="menu" aria-label="Criar conteúdo">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                role="menuitem"
                className="home1-fab-menu-item"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">
                  <Icon />
                </span>
                {action.label}
              </Link>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        className="home1-fab-button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Fechar menu de criação" : "Abrir menu de criação"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
      </button>
    </div>
  );
}

export default function PublicCityLandingPage() {
  const appUrls = useAppUrls();
  const communityHref = useHomeCommunityHref();
  const { activeProfile, user } = useSessionContext();
  const { unreadCount } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
    filters: { limit: 1 },
  });
  const homeDiscovery = useQuery({
    queryKey: ["home", "launch-discovery", cityPath],
    queryFn: () => HomeDiscoveryService.getLaunchHomeDiscovery(),
    staleTime: 5 * 60 * 1000,
  });
  const homeDiscoveryData = homeDiscovery.data ?? homeDiscoveryFallback;
  const activityDocuments = homeDiscoveryData.activityDocuments;
  const communityActivities = homeDiscoveryData.communityActivities;
  const sponsoredItems = homeDiscoveryData.sponsoredItems;
  const happeningCards = toHighlightCards(activityDocuments, communityHref);
  const feedItems = buildFeedItems(communityActivities, happeningCards, sponsoredItems);

  const mobileNavItems = buildPublicHeaderNavigation({
    home: "/",
    community: communityHref,
    business: LAUNCH_URLS.business,
    gastronomy: LAUNCH_URLS.gastronomy,
    services: LAUNCH_URLS.services,
    classifieds: LAUNCH_URLS.classifieds,
    map: LAUNCH_URLS.map,
    search: LAUNCH_URLS.search,
  });
  const enabledNavItems: NavItem[] = mobileNavItems
    .filter((item) => HOME_DESKTOP_NAV_IDS.has(item.id))
    .map((item) => ({
      ...item,
      mobileHeader:
        item.id === "home" || item.id === "community" || item.id === "business"
          ? "primary"
          : "secondary",
    }));
  const sessionActions: HeaderSessionActions = {
    isAuthenticated: Boolean(user),
    loginHref: appUrls.auth.login,
    notificationHref: appUrls.notifications,
    profileAvatarUrl: activeProfile?.avatarUrl ?? null,
    profileHref: appUrls.profile.home,
    profileName: activeProfile?.displayName ?? user?.email ?? "Conta",
    unreadCount,
  };

  return (
    <main className="home-concept home1">
      <div className="home-shell home1-shell">
        <HeaderNav
          navItems={enabledNavItems}
          mobileNavItems={mobileNavItems}
          sessionActions={sessionActions}
        />

        <TerritoryBlock communityHref={communityHref} />

        <HomeSearchBar />

        <TodayInNeighborhood cards={happeningCards} isLoading={homeDiscovery.isLoading} />

        <QuickActions />

        <DestaquesTimeline items={feedItems} isLoading={homeDiscovery.isLoading} />

        <ExploreBlock />
      </div>

      <ComposeFab communityHref={communityHref} />
    </main>
  );
}
