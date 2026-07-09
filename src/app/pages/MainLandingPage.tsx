import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Home as HomeIcon,
  MapPin,
  Moon,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { LAUNCH_CITY_PATH, LAUNCH_URLS } from "@/config/territory";
import { HomeDiscoveryService } from "@/core/landing/services";
import {
  getHomeDiscoveryDocumentHref,
  getHomeDiscoveryDocumentMeta,
  withQueryParams,
} from "@/core/landing/utils/landingPresentation";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { buildCommunityAliasUrl, buildCommunityScopedUrl } from "@/core/routing/utils/territoryUrls";
import type { SearchDocument } from "@/core/search";
import { useTheme } from "@/shared/hooks/useTheme";

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

type NavItem = {
  label: string;
  href: string;
};

type Chip = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type WeatherPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

type TemperatureBadgeState = {
  label: string;
  ariaLabel: string;
  isLoading: boolean;
};

type CurrentWeatherResponse = {
  current?: {
    temperature_2m?: number;
  };
};

type VisualTone = "cyan" | "green" | "blue" | "amber" | "pink" | "red" | "neutral";

type FeaturedCommunity = {
  name: string;
  href: string;
  image: string;
  members: string;
  delta: string;
  badge?: string;
  avatarCount: number;
};

type HighlightCard = {
  label: string;
  title: string;
  meta: string;
  detail: string;
  href: string;
  image: string;
  tone: VisualTone;
  icon: LucideIcon;
};

type ModuleTile = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: VisualTone;
};

type CommunityActivity = {
  author: string;
  community: string;
  text: string;
  time: string;
  comments: number;
  avatar: string;
  image?: string;
  verified?: boolean;
};

type SponsoredItem = {
  title: string;
  community: string;
  description: string;
  href: string;
  image: string;
};

const cityPath = LAUNCH_CITY_PATH;
const searchHref = LAUNCH_URLS.search;
const weatherCacheTtlMs = 10 * 60 * 1000;
const currentWeatherCache = new Map<string, { temperatureCelsius: number; expiresAt: number }>();
const avatarImages = [personaMorador, personaComerciante, personaPrestador, personaEmprego];

const quickChips: Chip[] = [
  { label: "Restaurantes", href: LAUNCH_URLS.gastronomy },
  { label: "Mercados", href: withQueryParams(searchHref, { q: "mercados" }) },
  { label: "Salões", href: withQueryParams(searchHref, { q: "salões" }) },
  { label: "Mecânicas", href: withQueryParams(searchHref, { q: "mecânicas" }) },
  { label: "Academias", href: withQueryParams(searchHref, { q: "academias" }) },
  { label: "Pet shops", href: withQueryParams(searchHref, { q: "pet shops" }) },
  { label: "+ Mais", href: searchHref, icon: MoreHorizontal },
];

const stats = [
  { value: "+18 mil", label: "Empresas locais", icon: Building2, tone: "cyan" },
  { value: "+52 mil", label: "Membros ativos", icon: Users, tone: "cyan" },
  { value: "+9 mil", label: "Eventos realizados", icon: Calendar, tone: "cyan" },
  { value: "4,8", label: "Avaliação média", icon: Star, tone: "amber" },
  { value: "100%", label: "Ambiente seguro", icon: ShieldCheck, tone: "cyan" },
  { value: "Respostas rápidas", label: "Comunidade ativa", icon: Zap, tone: "amber" },
] as const;

const featuredCommunities: FeaturedCommunity[] = [
  {
    name: "Pituba",
    href: buildCommunityAliasUrl("pituba"),
    image: bairroPituba,
    members: "12,5 mil membros",
    delta: "+8%",
    badge: "Em alta",
    avatarCount: 23,
  },
  {
    name: "Barra",
    href: buildCommunityAliasUrl("barra"),
    image: bairroOndina,
    members: "8,7 mil membros",
    delta: "+5%",
    avatarCount: 18,
  },
  {
    name: "Itapuã",
    href: buildCommunityAliasUrl("itapua"),
    image: bairroStiep,
    members: "6,2 mil membros",
    delta: "+3%",
    avatarCount: 15,
  },
  {
    name: "Rio Vermelho",
    href: buildCommunityAliasUrl("rio-vermelho"),
    image: bairroRioVermelho,
    members: "5,1 mil membros",
    delta: "+2%",
    avatarCount: 9,
  },
];

const suggestedCommunities: FeaturedCommunity[] = [
  {
    name: "Horto Florestal",
    href: buildCommunityAliasUrl("horto-florestal"),
    image: neighborhoodFeatured,
    members: "4,8 mil membros",
    delta: "+2%",
    avatarCount: 12,
  },
  {
    name: "Imbuí",
    href: buildCommunityAliasUrl("imbui"),
    image: bairroChapada,
    members: "3,9 mil membros",
    delta: "+1%",
    avatarCount: 10,
  },
  {
    name: "Graça",
    href: buildCommunityAliasUrl("graca"),
    image: complexoCultura,
    members: "5,2 mil membros",
    delta: "+4%",
    avatarCount: 13,
  },
  {
    name: "Caminho das Árvores",
    href: buildCommunityAliasUrl("caminho-das-arvores"),
    image: complexoComercio,
    members: "6,1 mil membros",
    delta: "+4%",
    avatarCount: 16,
  },
  {
    name: "Stella Maris",
    href: buildCommunityAliasUrl("stella-maris"),
    image: bairroSantaCruz,
    members: "4,3 mil membros",
    delta: "+1%",
    avatarCount: 8,
  },
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
  },
];

const communityActivities: CommunityActivity[] = [
  {
    author: "Juliana Santos",
    community: "Pituba",
    text: "Alguém sabe de um bom restaurante japonês por aqui?",
    time: "2h",
    comments: 24,
    avatar: personaMorador,
  },
  {
    author: "Prefeitura de Salvador",
    community: "Avisos oficiais",
    text: "Mutirão de limpeza neste sábado na orla da Pituba. Participe!",
    time: "4h",
    comments: 18,
    avatar: personaEmprego,
    verified: true,
  },
  {
    author: "Marcos Lima",
    community: "Barra",
    text: "Vendo bicicleta semi nova, usada poucas vezes.",
    time: "6h",
    comments: 9,
    avatar: personaComerciante,
    image: bairroRioVermelho,
  },
];

const sponsoredFallbackItems: SponsoredItem[] = [
  {
    title: "Padaria Pão Nosso",
    community: "Pituba",
    description: "Pães fresquinhos todos os dias!",
    href: LAUNCH_URLS.business,
    image: empresasHero,
  },
  {
    title: "Pet Shop Cão Feliz",
    community: "Boca do Rio",
    description: "Banho, tosa e muito carinho.",
    href: withQueryParams(searchHref, { q: "pet shop" }),
    image: bairroSantaCruz,
  },
  {
    title: "Farmácia Saúde+",
    community: "Pituba",
    description: "Descontos em medicamentos.",
    href: LAUNCH_URLS.business,
    image: bairroPituba,
  },
];

const salvadorCenter = { latitude: -12.8744, longitude: -38.5015 };

const homeSelectedTerritory: ResolvedTerritory = {
  kind: "location",
  location: {
    id: "city-salvador",
    parent_id: "state-ba",
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, BA",
    geographic_path: "/br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: {
      state_code: "BA",
      center_latitude: salvadorCenter.latitude,
      center_longitude: salvadorCenter.longitude,
    },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } satisfies Location,
};

function toFiniteCoordinate(value: unknown): number | null {
  const numericValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getTerritoryWeatherPoint(resolved: ResolvedTerritory): WeatherPoint {
  if (resolved?.kind === "location") {
    const latitude = toFiniteCoordinate(resolved.location.metadata.center_latitude);
    const longitude = toFiniteCoordinate(resolved.location.metadata.center_longitude);

    if (latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
        label: resolved.location.full_name || resolved.location.name,
      };
    }
  }

  return {
    ...salvadorCenter,
    label: "Salvador, BA",
  };
}

function getWeatherCacheKey(point: WeatherPoint): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}

function formatTemperatureLabel(temperatureCelsius: number): string {
  return `${Math.round(temperatureCelsius)}°C`;
}

async function fetchCurrentTemperature(point: WeatherPoint, signal: AbortSignal): Promise<number> {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    current: "temperature_2m",
    temperature_unit: "celsius",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  const data = (await response.json()) as CurrentWeatherResponse;
  const temperature = data.current?.temperature_2m;

  if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
    throw new Error("Weather response missing current temperature.");
  }

  return temperature;
}

function useCurrentTerritoryTemperature(resolved: ResolvedTerritory): TemperatureBadgeState {
  const point = useMemo(() => getTerritoryWeatherPoint(resolved), [resolved]);
  const [temperatureCelsius, setTemperatureCelsius] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cacheKey = getWeatherCacheKey(point);
    const cached = currentWeatherCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      setTemperatureCelsius(cached.temperatureCelsius);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    setIsLoading(true);

    fetchCurrentTemperature(point, controller.signal)
      .then((temperature) => {
        if (!isActive) return;
        currentWeatherCache.set(cacheKey, {
          temperatureCelsius: temperature,
          expiresAt: Date.now() + weatherCacheTtlMs,
        });
        setTemperatureCelsius(temperature);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTemperatureCelsius(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [point]);

  if (temperatureCelsius !== null) {
    const label = formatTemperatureLabel(temperatureCelsius);
    return {
      label,
      ariaLabel: `Temperatura atual em ${point.label}: ${label}`,
      isLoading,
    };
  }

  return {
    label: "--°C",
    ariaLabel: isLoading ? `Atualizando temperatura em ${point.label}` : `Temperatura indisponível em ${point.label}`,
    isLoading,
  };
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

function HeaderNav({ navItems, temperature }: { navItems: NavItem[]; temperature: TemperatureBadgeState }) {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="home-header" aria-label="Navegação principal">
      <Link className="home-brand" to="/">
        <BrandMark />
        <span>Achegue-se</span>
      </Link>

      <nav className="home-nav" aria-label="Seções">
        {navItems.map((item) => (
          <Link key={item.label} to={item.href} className={item.label === "Início" ? "is-active" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="home-actions">
        <Link to={cityPath} className="home-action-pill home-location-pill">
          <MapPin aria-hidden="true" />
          <span>Salvador, BA</span>
          <ChevronDown aria-hidden="true" />
        </Link>
        <span className="home-action-pill home-weather-pill" aria-label={temperature.ariaLabel} aria-live="polite">
          <Sun aria-hidden="true" />
          <span>{temperature.label}</span>
        </span>
        <button type="button" className="home-icon-button" onClick={toggleTheme} aria-label="Alternar tema">
          <ThemeIcon aria-hidden="true" />
        </button>
        <Link to="/notifications" className="home-notification-button" aria-label="Abrir notificações">
          <Bell aria-hidden="true" />
          <span>3</span>
        </Link>
        <Link to="/login" className="home-user-avatar" aria-label="Entrar na conta">
          <img src={personaMorador} alt="" />
          <ChevronDown aria-hidden="true" />
        </Link>
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
          placeholder="Buscar comunidades, empresas, eventos, serviços..."
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

function FeaturedCommunitiesPanel() {
  return (
    <section className="home-featured-communities" aria-labelledby="featured-communities-title">
      <div className="home-section-heading">
        <h2 id="featured-communities-title">Comunidades em destaque</h2>
        <Link to={LAUNCH_URLS.community}>Ver todas</Link>
      </div>
      <div className="home-featured-community-grid">
        {featuredCommunities.map((community) => (
          <Link key={community.name} to={community.href} className="home-community-card">
            <img src={community.image} alt="" />
            <span className="home-community-card-shade" aria-hidden="true" />
            {community.badge ? <span className="home-community-badge">{community.badge}</span> : null}
            <span className="home-community-card-copy">
              <strong>{community.name}</strong>
              <small>{community.members}</small>
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

  return [...dynamicCards, ...fallbackHighlights].slice(0, 4);
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

function HappeningPanel({ cards }: { cards: HighlightCard[] }) {
  return (
    <section className="home-panel home-happening-panel" aria-labelledby="happening-title">
      <div className="home-panel-heading">
        <h2 id="happening-title">O que está acontecendo perto de você</h2>
        <Link to={LAUNCH_URLS.community}>Ver tudo</Link>
      </div>
      <div className="home-happening-grid">
        {cards.map((card) => (
          <HappeningCard key={`${card.label}-${card.title}`} card={card} />
        ))}
      </div>
    </section>
  );
}

function ModuleTiles({ communityHref }: { communityHref: string }) {
  const tiles: ModuleTile[] = [
    { label: "Empresas", description: "Comércios locais", href: LAUNCH_URLS.business, icon: Building2, tone: "green" },
    { label: "Eventos", description: "Na sua região", href: LAUNCH_URLS.events, icon: Calendar, tone: "red" },
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
    { label: "Vagas", description: "Oportunidades", href: LAUNCH_URLS.jobs, icon: Briefcase, tone: "blue" },
    { label: "Mais", description: "Ver tudo", href: searchHref, icon: MoreHorizontal, tone: "neutral" },
  ];

  return (
    <section className="home-panel home-modules-panel" aria-labelledby="modules-title">
      <div className="home-panel-heading">
        <h2 id="modules-title">Encontre o que precisa na sua comunidade</h2>
        <Link to={searchHref}>Ver todas</Link>
      </div>
      <div className="home-module-tile-grid">
        {tiles.map((tile) => {
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

function CommunityActivityPanel() {
  return (
    <section className="home-panel home-activity-panel" aria-labelledby="activity-title">
      <div className="home-panel-heading">
        <h2 id="activity-title">Atividades nas comunidades</h2>
        <Link to={LAUNCH_URLS.community}>Ver todas</Link>
      </div>
      <div className="home-community-activity-list">
        {communityActivities.map((activity) => (
          <article key={`${activity.author}-${activity.time}`} className="home-community-activity-item">
            <img src={activity.avatar} alt="" />
            <span className="home-community-activity-copy">
              <strong>
                {activity.author}
                <small>{activity.community}</small>
                {activity.verified ? <ShieldCheck aria-label="Perfil verificado" /> : null}
              </strong>
              <span>{activity.text}</span>
            </span>
            <span className="home-community-activity-meta">
              <small>{activity.time}</small>
              <span>{activity.comments}</span>
            </span>
            {activity.image ? <img className="home-community-activity-preview" src={activity.image} alt="" /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CommunityRankingPanel() {
  return (
    <section className="home-panel home-ranking-panel" aria-labelledby="ranking-title">
      <div className="home-panel-heading">
        <h2 id="ranking-title">Ranking das comunidades</h2>
        <Link to={LAUNCH_URLS.community}>Ver ranking</Link>
      </div>
      <div className="home-community-ranking-list">
        {featuredCommunities.concat(suggestedCommunities.slice(0, 1)).map((community, index) => (
          <Link key={community.name} to={community.href} className="home-community-ranking-item">
            <span>{index + 1}</span>
            <img src={community.image} alt="" />
            <strong>
              {community.name}
              <small>{community.members}</small>
            </strong>
            <em>{community.delta}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SponsoredPanel({ documents }: { documents: SearchDocument[] }) {
  const sponsoredItems: SponsoredItem[] = [
    ...documents.slice(0, 3).map((document, index) => ({
      title: document.title,
      community: getHomeDiscoveryDocumentMeta(document) || "Salvador, BA",
      description: document.description || document.subtitle || "Destaque local da comunidade.",
      href: getHomeDiscoveryDocumentHref(document, LAUNCH_URLS.business),
      image: getFallbackImageForDocument(document, index + 2),
    })),
    ...sponsoredFallbackItems,
  ].slice(0, 3);

  return (
    <section className="home-panel home-sponsored-panel" aria-labelledby="sponsored-title">
      <div className="home-panel-heading">
        <h2 id="sponsored-title">Anúncios de empresas locais</h2>
        <Link to={LAUNCH_URLS.business}>Ver todos</Link>
      </div>
      <div className="home-sponsored-list">
        {sponsoredItems.map((item) => (
          <Link key={item.title} to={item.href} className="home-sponsored-item">
            <img src={item.image} alt="" />
            <span>
              <strong>{item.title}</strong>
              <small>{item.community}</small>
              <em>{item.description}</em>
            </span>
            <b>Patrocinado</b>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CommunitySuggestionsPanel() {
  return (
    <section className="home-panel home-suggestions-panel" aria-labelledby="suggestions-title">
      <div className="home-panel-heading">
        <h2 id="suggestions-title">Sugestões para você participar</h2>
        <Link to={LAUNCH_URLS.community}>Ver todas</Link>
      </div>
      <div className="home-suggestion-list">
        {suggestedCommunities.map((community) => (
          <Link key={community.name} to={community.href} className="home-suggestion-card">
            <img src={community.image} alt="" loading="lazy" />
            <span className="home-suggestion-shade" aria-hidden="true" />
            <span>
              <strong>{community.name}</strong>
              <small>{community.members}</small>
              <em>Participar</em>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="home-stats" aria-label="Indicadores da comunidade">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="home-stat-item">
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
  const communityHref = useHomeCommunityHref();
  const temperature = useCurrentTerritoryTemperature(homeSelectedTerritory);
  const homeDiscovery = useQuery({
    queryKey: ["home", "launch-discovery", cityPath],
    queryFn: () => HomeDiscoveryService.getLaunchHomeDiscovery(),
    staleTime: 5 * 60 * 1000,
  });
  const activityDocuments = homeDiscovery.data?.activityDocuments ?? [];
  const trustDocuments = homeDiscovery.data?.trustDocuments ?? [];
  const happeningCards = toHighlightCards(activityDocuments, communityHref);

  const navItems: NavItem[] = [
    { label: "Início", href: "/" },
    { label: "Comunidades", href: communityHref },
    { label: "Empresas", href: LAUNCH_URLS.business },
    { label: "Eventos", href: LAUNCH_URLS.events },
    { label: "Classificados", href: LAUNCH_URLS.classifieds },
    { label: "Serviços", href: LAUNCH_URLS.services },
    { label: "Mapa", href: LAUNCH_URLS.map },
  ];

  return (
    <main className="home-concept">
      <div className="home-bg" aria-hidden="true">
        <img src={heroImg} alt="" />
      </div>
      <div className="home-shell">
        <HeaderNav navItems={navItems} temperature={temperature} />
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
          <FeaturedCommunitiesPanel />
        </section>

        <section className="home-content-grid" aria-label="Descoberta local">
          <div className="home-main-column">
            <div className="home-dashboard-row">
              <HappeningPanel cards={happeningCards} />
              <CommunityActivityPanel />
            </div>
            <ModuleTiles communityHref={communityHref} />
            <CommunitySuggestionsPanel />
          </div>
          <aside className="home-aside-column" aria-label="Resumo das comunidades">
            <CommunityRankingPanel />
            <SponsoredPanel documents={trustDocuments} />
          </aside>
        </section>

        <StatsBar />
      </div>
    </main>
  );
}
