import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Flame,
  Map as MapIcon,
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
  getHomeDiscoveryDocumentRating,
  getHomeDiscoveryDocumentTone,
} from "@/core/landing/utils/landingPresentation";
import {
  DEFAULT_TILE_STYLE,
  MapLibreAdapter,
  mapEntityProjection,
  useTerritoryPolygon,
  type MapEntityType,
  type MapMarker,
  type TerritoryPolygon,
} from "@/core/maps";
import { LocationStatus, LocationType, type Location } from "@/core/location/types";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { SearchDocument } from "@/core/search";
import { useTheme } from "@/shared/hooks/useTheme";

import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";
import empresasHero from "@/assets/empresas-hero.jpg";
import gastronomyHero from "@/assets/gastronomy-hero-bg.jpg";
import heroImg from "@/assets/hero-landing-main.jpg";
import neighborhoodFeatured from "@/assets/neighborhood-featured.jpg";
import servicosHero from "@/assets/servicos-hero.jpg";
import "./MainLandingPage.css";

type NavItem = {
  label: string;
  href: string;
};

type ModuleCard = {
  label: string;
  href: string;
  icon: LucideIcon;
  image: string;
  accent: "cyan" | "amber" | "blue" | "pink" | "green";
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

const cityPath = LAUNCH_CITY_PATH;
const mapHref = LAUNCH_URLS.map;
const searchHref = LAUNCH_URLS.search;
const weatherCacheTtlMs = 10 * 60 * 1000;
const currentWeatherCache = new Map<string, { temperatureCelsius: number; expiresAt: number }>();

function withQueryParams(path: string, params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `${path}?${searchParams.toString()}`;
}

const quickChips: Chip[] = [
  { label: "Em alta", href: withQueryParams(searchHref, { q: "em alta" }), icon: Flame },
  { label: "Restaurantes", href: LAUNCH_URLS.gastronomy },
  { label: "Eletricista", href: withQueryParams(searchHref, { q: "eletricista" }) },
  { label: "Salões", href: withQueryParams(searchHref, { q: "salões" }) },
  { label: "Mercados", href: withQueryParams(searchHref, { q: "mercados" }) },
  { label: "Vagas", href: LAUNCH_URLS.jobs },
  { label: "Apartamentos", href: withQueryParams(LAUNCH_URLS.classifieds, { q: "apartamentos" }) },
];

const stats = [
  { value: "+18 mil", label: "Empresas locais", icon: Building2, tone: "cyan" },
  { value: "+52 mil", label: "Membros ativos", icon: Users, tone: "blue" },
  { value: "+9 mil", label: "Posts esta semana", icon: Bell, tone: "blue" },
  { value: "4,8", label: "Confiança média", icon: Star, tone: "amber" },
  { value: "100%", label: "Verificados", icon: ShieldCheck, tone: "cyan" },
  { value: "Respostas rápidas", label: "Comunidade ativa", icon: Zap, tone: "amber" },
];

const salvadorCenter = { latitude: -12.8744, longitude: -38.5015 };

type HomeMapEntity = {
  id: string;
  type: MapEntityType;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  url: string;
  category: string;
  map_layer_key: string;
  rating?: number;
  isPremium?: boolean;
};

const homeMapEntities: HomeMapEntity[] = [
  {
    id: "home-map-padaria",
    type: "business",
    latitude: -13.0112,
    longitude: -38.4894,
    name: "Padaria da Esquina",
    subtitle: "Rio Vermelho",
    url: LAUNCH_URLS.business,
    category: "Empresas",
    map_layer_key: "businesses",
    rating: 4.9,
  },
  {
    id: "home-map-restaurante",
    type: "business",
    latitude: -13.0064,
    longitude: -38.5324,
    name: "Restaurante da Barra",
    subtitle: "Barra",
    url: LAUNCH_URLS.gastronomy,
    category: "Gastronomia",
    map_layer_key: "gastronomy",
    rating: 4.8,
    isPremium: true,
  },
  {
    id: "home-map-servico",
    type: "service",
    latitude: -12.9747,
    longitude: -38.508,
    name: "Serviço rápido",
    subtitle: "Centro Histórico",
    url: LAUNCH_URLS.services,
    category: "Serviços",
    map_layer_key: "services",
  },
  {
    id: "home-map-classificado",
    type: "classified",
    latitude: -12.999,
    longitude: -38.4593,
    name: "Apartamento mobiliado",
    subtitle: "Pituba",
    url: LAUNCH_URLS.classifieds,
    category: "Classificados",
    map_layer_key: "classifieds",
  },
  {
    id: "home-map-alerta",
    type: "alert",
    latitude: -12.9505,
    longitude: -38.3607,
    name: "Alerta de chuva forte",
    subtitle: "Itapuã",
    url: LAUNCH_URLS.community,
    category: "Comunidade",
    map_layer_key: "alerts",
  },
  {
    id: "home-map-evento",
    type: "event",
    latitude: -12.9027,
    longitude: -38.425,
    name: "Mutirão de limpeza",
    subtitle: "Cajazeiras",
    url: LAUNCH_URLS.community,
    category: "Comunidade",
    map_layer_key: "events",
  },
];

const homeMapMarkers = homeMapEntities
  .map(({ type, ...entity }) =>
    mapEntityProjection.projectEntity(entity, type, {
      includeMetadata: true,
      calculateScore: true,
    }),
  )
  .filter((marker): marker is MapMarker => marker !== null);

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

const salvadorFallbackTerritoryPolygons: TerritoryPolygon[] = [
  {
    name: "Salvador",
    color: "#21e0d0",
    center: [salvadorCenter.latitude, salvadorCenter.longitude],
    // Simplified fallback from IBGE municipal mesh 2927408.
    coordinates: [
      [-13.0127, -38.5856],
      [-13.0149, -38.4687],
      [-12.956, -38.385],
      [-12.9571, -38.3535],
      [-12.9109, -38.3043],
      [-12.8947, -38.3549],
      [-12.8391, -38.3534],
      [-12.8243, -38.374],
      [-12.867, -38.416],
      [-12.8294, -38.464],
      [-12.7915, -38.4623],
      [-12.7793, -38.5038],
      [-12.7483, -38.5085],
      [-12.7387, -38.535],
      [-12.7339, -38.5879],
      [-12.754, -38.5879],
      [-12.7541, -38.6952],
      [-12.8006, -38.6986],
      [-12.8454, -38.6749],
      [-12.8926, -38.5888],
      [-12.9327, -38.5611],
      [-13.0127, -38.5856],
    ],
  },
];

const homeTerritoryFitPadding = { top: 24, right: 24, bottom: 56, left: 24 };

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

function HeaderNav({ navItems }: { navItems: NavItem[] }) {
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
        </Link>
        <button type="button" className="home-icon-button" onClick={toggleTheme} aria-label="Alternar tema">
          <ThemeIcon aria-hidden="true" />
        </button>
        <Link to="/login" className="home-auth-button home-auth-button--ghost">
          Entrar
        </Link>
        <Link to="/cadastro" className="home-auth-button home-auth-button--primary">
          Criar conta
        </Link>
      </div>
    </header>
  );
}

function HeroBadges({ temperature }: { temperature: TemperatureBadgeState }) {
  return (
    <div className="home-hero-badges" aria-label="Local e clima">
      <Link to={cityPath} className="home-glass-badge">
        <MapPin aria-hidden="true" />
        <span>Salvador, BA</span>
      </Link>
      <span className="home-glass-badge" aria-label={temperature.ariaLabel} aria-live="polite">
        <Sun aria-hidden="true" />
        <span>{temperature.label}</span>
      </span>
    </div>
  );
}

function SearchPanel() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    const target = query ? `${searchHref}?q=${encodeURIComponent(query)}` : searchHref;
    navigate(target);
  };

  return (
    <form className="home-search-panel" onSubmit={handleSubmit} role="search">
      <div className="home-search-row">
        <Link to={cityPath} className="home-search-location">
          <MapPin aria-hidden="true" />
          <span>Salvador, BA</span>
          <ChevronDown aria-hidden="true" />
        </Link>
        <label className="home-search-field">
          <Search aria-hidden="true" />
          <input
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Buscar restaurantes, serviços, empresas, classificados..."
          />
        </label>
        <button type="submit" className="home-search-submit" aria-label="Buscar">
          <Search aria-hidden="true" />
        </button>
      </div>
      <div className="home-chip-row" aria-label="Buscas rápidas">
        {quickChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <Link key={chip.label} to={chip.href} className={Icon ? "home-chip home-chip--hot" : "home-chip"}>
              {Icon ? <Icon aria-hidden="true" /> : null}
              <span>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </form>
  );
}

function ModuleCards({ cards }: { cards: ModuleCard[] }) {
  return (
    <section className="home-module-grid" aria-label="Módulos locais">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            to={card.href}
            className={`home-module-card home-module-card--${card.accent}`}
          >
            <img src={card.image} alt="" loading="lazy" />
            <span className="home-module-shade" aria-hidden="true" />
            <span className="home-module-content">
              <Icon aria-hidden="true" />
              <strong>{card.label}</strong>
            </span>
            <span className="home-module-arrow" aria-hidden="true">
              <ArrowRight />
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function HomeTerritoryMap() {
  const { polygons } = useTerritoryPolygon(homeSelectedTerritory);
  const territoryPolygons = useMemo(
    () => (polygons.length > 0 ? polygons : salvadorFallbackTerritoryPolygons),
    [polygons],
  );

  return (
    <div className="home-map-canvas" aria-label="Mapa da cidade de Salvador">
      <MapLibreAdapter
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={{ center: salvadorCenter, zoom: 9.6 }}
        territoryPolygons={territoryPolygons}
        markers={homeMapMarkers}
        resolved={homeSelectedTerritory}
        fitTerritoryBounds
        territoryFitPadding={homeTerritoryFitPadding}
        territoryFitMaxZoom={10.8}
        enableClustering
        clusterOptions={{ radius: 34, maxZoom: 8, minPoints: 2 }}
        markerPresentation="compact"
        userLocationMarker={{ enabled: false, autoAdd: false }}
        className="home-real-map"
      />
      <span className="home-real-map-label" aria-hidden="true">
        Salvador
      </span>
    </div>
  );
}

function MapPanel() {
  const filters = [
    {
      label: "Restaurantes",
      icon: UtensilsCrossed,
      tone: "amber",
      href: withQueryParams(mapHref, { layer: "gastronomy" }),
    },
    {
      label: "Empresas",
      icon: Briefcase,
      tone: "blue",
      href: withQueryParams(mapHref, { layer: "businesses" }),
    },
    { label: "Serviços", icon: Wrench, tone: "blue", href: withQueryParams(mapHref, { layer: "services" }) },
    { label: "Classificados", icon: Tag, tone: "pink", href: withQueryParams(mapHref, { layer: "classifieds" }) },
    { label: "Mais", icon: MoreHorizontal, tone: "neutral", href: mapHref },
  ];

  return (
    <section className="home-panel home-map-panel" aria-labelledby="home-map-title">
      <div className="home-panel-heading">
        <h2 id="home-map-title">Mapa da cidade</h2>
        <Link to={mapHref}>Ver mapa completo</Link>
      </div>
      <HomeTerritoryMap />
      <div className="home-map-filters" aria-label="Camadas do mapa">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <Link key={filter.label} to={filter.href} className={`home-map-filter is-${filter.tone}`}>
              <Icon aria-hidden="true" />
              <span>{filter.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getDocumentIcon(document: SearchDocument): LucideIcon {
  switch (document.type) {
    case "business":
      return Building2;
    case "professional":
      return Wrench;
    case "opportunity":
      return Briefcase;
    case "classified":
      return Tag;
    case "event":
      return Calendar;
    case "community":
      return Users;
    default:
      return Bell;
  }
}

function DocumentThumb({ document }: { document: SearchDocument }) {
  const Icon = getDocumentIcon(document);

  if (document.imageUrl) {
    return <img src={document.imageUrl} alt="" loading="lazy" />;
  }

  return (
    <span className="home-document-thumb" aria-hidden="true">
      <Icon />
    </span>
  );
}

function PanelStatus({
  label,
  isLoading,
}: {
  label: string;
  isLoading: boolean;
}) {
  return (
    <p className="home-panel-status">
      {isLoading ? "Carregando..." : label}
    </p>
  );
}

function ActivityPanel({
  communityHref,
  documents,
  isLoading,
}: {
  communityHref: string;
  documents: SearchDocument[];
  isLoading: boolean;
}) {
  return (
    <section className="home-panel home-list-panel" aria-labelledby="activity-title">
      <div className="home-panel-heading">
        <h2 id="activity-title">Atividade da comunidade</h2>
        <Link to={communityHref}>Ver tudo</Link>
      </div>
      <div className="home-activity-list">
        {documents.length === 0 ? (
          <PanelStatus
            isLoading={isLoading}
            label="Nenhuma atividade publica em destaque ainda."
          />
        ) : (
          documents.map((document) => {
            const Icon = getDocumentIcon(document);
            const tone = getHomeDiscoveryDocumentTone(document);
            return (
              <Link
                key={`${document.type}-${document.id}`}
                to={getHomeDiscoveryDocumentHref(document, communityHref)}
                className="home-activity-item"
              >
                <DocumentThumb document={document} />
                <span className="home-activity-copy">
                  <strong>{document.title}</strong>
                  <small>{getHomeDiscoveryDocumentMeta(document)}</small>
                </span>
                <Icon className={`home-activity-icon is-${tone}`} aria-hidden="true" />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

function RankingPanel({
  documents,
  isLoading,
}: {
  documents: SearchDocument[];
  isLoading: boolean;
}) {
  return (
    <section className="home-panel home-list-panel" aria-labelledby="ranking-title">
      <div className="home-panel-heading">
        <h2 id="ranking-title">Ranking de confiança</h2>
        <Link to={LAUNCH_URLS.business}>Ver mais</Link>
      </div>
      <div className="home-ranking-list">
        {documents.length === 0 ? (
          <PanelStatus
            isLoading={isLoading}
            label="Nenhuma avaliacao publica em destaque ainda."
          />
        ) : (
          documents.map((document, index) => {
            const rating = getHomeDiscoveryDocumentRating(document);
            return (
              <Link
                key={`${document.type}-${document.id}`}
                to={getHomeDiscoveryDocumentHref(document, LAUNCH_URLS.business)}
                className="home-ranking-item"
              >
                <span className="home-ranking-number">{index + 1}</span>
                <DocumentThumb document={document} />
                <span className="home-ranking-copy">
                  <strong>{document.title}</strong>
                  <small>{getHomeDiscoveryDocumentMeta(document)}</small>
                </span>
                {rating ? (
                  <span className="home-rating">
                    <Star aria-hidden="true" />
                    {rating}
                  </span>
                ) : null}
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <Link to="/regras" className="home-trust-strip">
      <span className="home-trust-icon" aria-hidden="true">
        <ShieldCheck />
      </span>
      <span>
        <strong>Ambiente seguro e verificado</strong>
        <small>Perfis verificados • Conteúdo moderado</small>
      </span>
      <ChevronRight aria-hidden="true" />
    </Link>
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

  const navItems: NavItem[] = [
    { label: "Início", href: "/" },
    { label: "Comunidade", href: communityHref },
    { label: "Empresas", href: LAUNCH_URLS.business },
    { label: "Gastronomia", href: LAUNCH_URLS.gastronomy },
    { label: "Serviços", href: LAUNCH_URLS.services },
    { label: "Classificados", href: LAUNCH_URLS.classifieds },
    { label: "Mapa", href: mapHref },
  ];

  const moduleCards: ModuleCard[] = [
    { label: "Empresas", href: LAUNCH_URLS.business, icon: Briefcase, image: empresasHero, accent: "cyan" },
    { label: "Gastronomia", href: LAUNCH_URLS.gastronomy, icon: UtensilsCrossed, image: gastronomyHero, accent: "amber" },
    { label: "Serviços", href: LAUNCH_URLS.services, icon: Wrench, image: servicosHero, accent: "blue" },
    { label: "Classificados", href: LAUNCH_URLS.classifieds, icon: Tag, image: bairroRioVermelho, accent: "pink" },
    { label: "Comunidade", href: communityHref, icon: Users, image: neighborhoodFeatured, accent: "green" },
    { label: "Mapa", href: mapHref, icon: MapIcon, image: bairroPituba, accent: "blue" },
  ];

  return (
    <main className="home-concept">
      <div className="home-bg" aria-hidden="true">
        <img src={heroImg} alt="" />
      </div>
      <div className="home-shell">
        <HeaderNav navItems={navItems} />
        <div className="home-main-grid">
          <section className="home-hero-copy" aria-labelledby="home-title">
            <HeroBadges temperature={temperature} />
            <h1 id="home-title">
              Tudo do seu bairro,
              <br />
              em <span>um só lugar</span>
            </h1>
            <p>Descubra, conecte-se e resolva tudo perto de você.</p>
            <SearchPanel />
            <ModuleCards cards={moduleCards} />
          </section>

          <aside className="home-side" aria-label="Resumo do bairro">
            <MapPanel />
            <div className="home-side-grid">
              <ActivityPanel
                communityHref={communityHref}
                documents={activityDocuments}
                isLoading={homeDiscovery.isLoading}
              />
              <RankingPanel
                documents={trustDocuments}
                isLoading={homeDiscovery.isLoading}
              />
            </div>
            <TrustStrip />
          </aside>
        </div>
        <StatsBar />
      </div>
    </main>
  );
}
