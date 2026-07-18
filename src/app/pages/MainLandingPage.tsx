import { type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Dumbbell,
  Home as HomeIcon,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  PawPrint,
  Search,
  ShieldCheck,
  Scissors,
  Star,
  ShoppingCart,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
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
import "./MainLandingPage.css";

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
  { label: "Mercados", href: withQueryParams(searchHref, { q: "mercados" }), icon: ShoppingCart },
  { label: "Salões", href: withQueryParams(searchHref, { q: "salões" }), icon: Scissors },
  { label: "Mecânicas", href: withQueryParams(searchHref, { q: "mecânicas" }), icon: Wrench },
  { label: "Academias", href: withQueryParams(searchHref, { q: "academias" }), icon: Dumbbell },
  { label: "Pet shops", href: withQueryParams(searchHref, { q: "pet shops" }), icon: PawPrint },
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

export default function MainLandingPage() {
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
  const communityRanking = homeDiscoveryData.communityRanking;
  const featuredCommunities = homeDiscoveryData.featuredCommunities;
  const homeStats = homeDiscoveryData.stats;
  const suggestedCommunities = homeDiscoveryData.suggestedCommunities;
  const sponsoredItems = homeDiscoveryData.sponsoredItems;
  const happeningCards = toHighlightCards(activityDocuments, communityHref);

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
    <main className="home-concept">
      <div className="home-bg" aria-hidden="true">
        <img src={heroImg} alt="" />
      </div>
      <div className="home-shell">
        <HeaderNav
          navItems={enabledNavItems}
          mobileNavItems={mobileNavItems}
          sessionActions={sessionActions}
        />
        <section className="home-hero-layout" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <HeroBadges communityHref={communityHref} />
            <h1 id="home-title">
              Tudo do seu bairro,
              <br />
              em <span>um só lugar</span>
            </h1>
            <p>Conecte-se com pessoas, descubra empresas locais, participe de eventos e fortaleça sua comunidade.</p>
            <SearchPanel />
          </div>
          <FeaturedCommunitiesPanel communities={featuredCommunities} />
        </section>

        <section className="home-content-grid" aria-label="Descoberta local">
          <div className="home-main-column">
            <div className="home-dashboard-row">
              <HappeningPanel cards={happeningCards} isLoading={homeDiscovery.isLoading} />
              <CommunityActivityPanel activities={communityActivities} isLoading={homeDiscovery.isLoading} />
            </div>
            <ModuleTiles communityHref={communityHref} />
            <CommunitySuggestionsPanel communities={suggestedCommunities} />
          </div>
          <aside className="home-aside-column" aria-label="Resumo das comunidades">
            <CommunityRankingPanel communities={communityRanking} />
            <SponsoredPanel items={sponsoredItems} isLoading={homeDiscovery.isLoading} />
          </aside>
        </section>

        
      </div>
    </main>
  );
}
