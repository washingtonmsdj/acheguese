import { useMemo, type FormEvent, type HTMLAttributes } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  Compass,
  Map,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  Tag,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";
import { useCommunityAccess } from "@/core/community/access/useCommunityAccess";
import { useTerritoryHomeData } from "@/core/landing/hooks/useTerritoryHomeData";
import type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
} from "@/core/landing/services/LandingFeaturedService";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import type { Post } from "@/core/posts/types";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import {
  buildCityTerritoryBaseUrl,
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { useSessionContext } from "@/core/session";
import type { TerritorialHighlight } from "@/core/territorial/highlights/types";
import { eventPublicRoutes } from "@/core/verticals/events/routes/eventPublicRoutes";
import type { PublicEvent } from "@/core/verticals/events";
import type { WorkOpportunityCard } from "@/core/work-opportunities/types";
import { classifiedUrlService } from "@/core/classifieds/services";
import { cn } from "@/shared/utils/cn";

interface HomeUrls {
  business: string;
  classifieds: string;
  community: string;
  events: string;
  gastronomy: string;
  jobs: string;
  map: string;
  search: string;
  services: string;
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("pt-BR", {
  numeric: "auto",
});

function titleCase(value: string): string {
  return value
    .replace(/-/g, " ")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data a confirmar"
    : DATE_FORMATTER.format(date);
}

function formatRelativeDate(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "recente";
  const days = Math.round((timestamp - Date.now()) / (24 * 60 * 60 * 1000));
  if (Math.abs(days) < 7) return RELATIVE_TIME_FORMATTER.format(days, "day");
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(timestamp);
}

function formatPrice(value: number): string {
  if (value <= 0) return "Consulte";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitial(value: string): string {
  return value.trim().charAt(0).toLocaleUpperCase("pt-BR") || "A";
}

function SectionHeader({
  title,
  description,
  href,
  linkLabel = "Ver tudo",
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          to={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function Surface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-3xl border border-border/75 bg-card shadow-[0_18px_55px_-42px_rgba(15,23,42,0.55)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function HomeLoading() {
  return (
    <div
      className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.8fr)]"
      aria-label="Carregando informações do território"
    >
      <div className="space-y-4">
        <div className="h-7 w-56 animate-pulse rounded-full bg-muted" />
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
        <div className="h-36 animate-pulse rounded-3xl bg-muted" />
      </div>
      <div className="h-80 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}

function HomeSectionLoading({ rows = 2 }: { rows?: number }) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Atualizando esta seção"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/70"
        />
      ))}
    </div>
  );
}

function EventRow({
  event,
  eventsBaseUrl,
}: {
  event: PublicEvent;
  eventsBaseUrl: string;
}) {
  return (
    <Link
      to={eventPublicRoutes.detailFromBase(eventsBaseUrl, event.id)}
      className="group flex gap-4 rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
        <CalendarDays className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-700">
          Evento · {formatEventDate(event.date)}
        </span>
        <span className="mt-1 block line-clamp-2 font-semibold leading-6 text-foreground group-hover:text-primary">
          {event.title}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {event.venue_name ?? event.location ?? "Local a confirmar"}
        </span>
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function HighlightRow({ highlight }: { highlight: TerritorialHighlight }) {
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">
          Destaque local
        </span>
        <span className="mt-1 block line-clamp-2 font-semibold leading-6 text-foreground">
          {highlight.title}
        </span>
        {highlight.subtitle ? (
          <span className="mt-1 block line-clamp-2 text-sm text-muted-foreground">
            {highlight.subtitle}
          </span>
        ) : null}
      </span>
    </>
  );

  if (highlight.cta_url?.startsWith("/")) {
    return (
      <Link
        to={highlight.cta_url}
        className="flex gap-4 rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:border-primary/30 hover:bg-card"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-border/70 bg-background/55 p-4">
      {content}
    </div>
  );
}

function OpportunityRow({
  opportunity,
  jobsUrl,
}: {
  opportunity: WorkOpportunityCard;
  jobsUrl: string;
}) {
  return (
    <Link
      to={jobsUrl}
      className="group flex gap-4 rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-violet-700">
          Oportunidade · {opportunity.territory_name ?? "por perto"}
        </span>
        <span className="mt-1 block line-clamp-2 font-semibold leading-6 text-foreground group-hover:text-primary">
          {opportunity.headline}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {opportunity.professional_category}
        </span>
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function ClassifiedRow({
  classified,
  fallbackHref,
}: {
  classified: FeaturedClassified;
  fallbackHref: string;
}) {
  const href =
    classifiedUrlService.buildPublicUrl({
      id: classified.id,
      public_id: classified.public_id,
      slug: classified.slug,
      geographic_path: classified.geographic_path,
      category_slug: classified.category_slug,
      subcategory_slug: classified.subcategory_slug,
    }) ?? fallbackHref;

  return (
    <Link
      to={href}
      className="group flex gap-4 rounded-2xl border border-border/70 bg-background/55 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-sm"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        <Tag className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-800">
          Classificado · {formatPrice(classified.price)}
        </span>
        <span className="mt-1 block line-clamp-2 font-semibold leading-6 text-foreground group-hover:text-primary">
          {classified.titulo}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {classified.territory_name ?? classified.category}
        </span>
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

function CommunityPostRow({
  post,
  communityUrl,
}: {
  post: Post;
  communityUrl: string;
}) {
  const author = post.profile?.displayName ?? "Pessoa da comunidade";
  const separator = communityUrl.includes("?") ? "&" : "?";

  return (
    <Link
      to={`${communityUrl}${separator}post=${encodeURIComponent(post.id)}`}
      className="group flex gap-3 rounded-2xl border border-border/70 p-4 transition hover:border-primary/30 hover:bg-muted/35"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        {getInitial(author)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate font-semibold text-foreground">
            {author}
          </span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {formatRelativeDate(post.created_at)}
          </span>
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-6 text-foreground">
          {getPublicPostPreview(
            post.content,
            150,
            "Conteúdo sem resumo disponível.",
          )}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {post.comments_count}{" "}
          {post.comments_count === 1 ? "resposta" : "respostas"}
        </span>
      </span>
    </Link>
  );
}

function BusinessItem({
  business,
  href,
}: {
  business: FeaturedBusiness;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-muted/55"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-semibold text-emerald-800">
        {getInitial(business.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {business.name}
          </span>
          {business.is_verified ? (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-sky-600"
              aria-label="Verificado"
            />
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {business.category || "Comércio local"}
          {business.rating > 0 ? ` · ${business.rating.toFixed(1)} ★` : ""}
        </span>
      </span>
    </Link>
  );
}

function ServiceItem({
  service,
  href,
}: {
  service: FeaturedService;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-muted/55"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-semibold text-sky-800">
        {getInitial(service.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {service.name}
          </span>
          {service.is_verified ? (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-sky-600"
              aria-label="Verificado"
            />
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {service.category || "Serviço local"} ·{" "}
          {service.price_range ?? "A combinar"}
        </span>
      </span>
    </Link>
  );
}

function getBusinessHref(
  business: FeaturedBusiness,
  fallbackHref: string,
  canonical: (input: {
    id: string;
    slug: string;
    is_premium?: boolean;
    geographic_path: string;
  }) => string,
): string {
  if (!business.slug || !business.geographic_path) return fallbackHref;
  const geographicParts = business.geographic_path.split("/").filter(Boolean);
  if (geographicParts.length < 4) return fallbackHref;

  return canonical({
    id: business.id,
    slug: business.slug,
    is_premium: business.is_premium,
    geographic_path: business.geographic_path,
  });
}

export default function TerritoryHomePage() {
  const navigate = useNavigate();
  const params = useParams();
  const { resolved, baseUrl, communityBaseUrl, activeMemberIds } =
    useTerritorialContext();
  const { user, activeProfile } = useSessionContext();
  const { unreadCount } = useUnifiedNotifications();
  const appUrls = useAppUrls(resolved);
  const territory = useModuleTerritoryFilter({
    routeResolved: resolved,
    activeMemberIds,
    nearbyEnabled: false,
    includeDescendants: true,
  });
  const access = useCommunityAccess({ resolved, activeMemberIds });
  const data = useTerritoryHomeData({
    resolved,
    territoryFilter: territory.territoryFilter,
    resolvedLocationIds: territory.resolvedLocationIds,
    territoryLoading: territory.isLoading,
  });

  const cityBaseUrl = buildCityTerritoryBaseUrl(baseUrl);
  const isCityHome = cityBaseUrl === baseUrl;
  const territoryName =
    resolved.kind === "group" ? resolved.group.name : resolved.location.name;
  const cityName = titleCase(params.city ?? "cidade");
  const stateLabel = (params.state ?? "").toLocaleUpperCase("pt-BR");
  const locationLine = isCityHome
    ? `${stateLabel} · visão ampla da cidade`
    : `${cityName}, ${stateLabel}`;

  const urls = useMemo<HomeUrls>(
    () => ({
      business: appUrls.business.list,
      classifieds: appUrls.classifieds.list,
      community: communityBaseUrl,
      events: buildModuleTerritoryUrl(MODULE_SLUGS.events, baseUrl),
      gastronomy: buildModuleTerritoryUrl(MODULE_SLUGS.gastronomy, baseUrl),
      jobs: buildModuleTerritoryUrl(MODULE_SLUGS.jobs, baseUrl),
      map: buildModuleTerritoryUrl(MODULE_SLUGS.map, baseUrl),
      search: buildModuleTerritoryUrl(MODULE_SLUGS.search, baseUrl),
      services: appUrls.services.list,
    }),
    [
      appUrls.business.list,
      appUrls.classifieds.list,
      appUrls.services.list,
      baseUrl,
      communityBaseUrl,
    ],
  );

  const quickActions = useMemo(() => {
    const actions: Array<{
      label: string;
      description: string;
      href: string;
      icon: LucideIcon;
      tone: string;
    }> = [
      {
        label: "Buscar",
        description: "Tudo no território",
        href: urls.search,
        icon: Search,
        tone: "bg-emerald-100 text-emerald-800",
      },
      {
        label: "Serviços",
        description: "Profissionais locais",
        href: urls.services,
        icon: Wrench,
        tone: "bg-sky-100 text-sky-800",
      },
      {
        label: "Empresas",
        description: "Comércio por perto",
        href: urls.business,
        icon: Store,
        tone: "bg-violet-100 text-violet-800",
      },
      {
        label: "Classificados",
        description: "Comprar e vender",
        href: urls.classifieds,
        icon: Tag,
        tone: "bg-amber-100 text-amber-800",
      },
      {
        label: "Mapa",
        description: "Ver por localização",
        href: urls.map,
        icon: Map,
        tone: "bg-rose-100 text-rose-800",
      },
      {
        label: "Gastronomia",
        description: "Onde comer",
        href: urls.gastronomy,
        icon: UtensilsCrossed,
        tone: "bg-orange-100 text-orange-800",
      },
    ];
    return actions.filter((action) => {
      if (action.href === urls.gastronomy)
        return isLaunchSurfaceEnabled("gastronomy");
      if (action.href === urls.map) return isLaunchSurfaceEnabled("map");
      return true;
    });
  }, [urls]);

  const hasWorthKnowing =
    data.highlights.length > 0 ||
    data.events.length > 0 ||
    data.opportunities.length > 0 ||
    data.classifieds.length > 0;
  const hasUsefulPlaces =
    data.businesses.length > 0 || data.services.length > 0;
  const canCreatePost = !access.isLoading && access.can.create_post;
  const worthKnowingTitle = isCityHome
    ? `Panorama de ${territoryName}`
    : `Vale saber em ${territoryName}`;
  const worthKnowingDescription = isCityHome
    ? "Uma visão ampla do que está válido nos territórios da cidade."
    : "Informação pública, válida e vinculada a este território.";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = String(
      new FormData(event.currentTarget).get("q") ?? "",
    ).trim();
    navigate(
      query ? `${urls.search}?q=${encodeURIComponent(query)}` : urls.search,
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.09),transparent_30rem),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35))] pb-10 text-foreground md:pb-16">
      <header
        className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/?trocar=territorio"
            className="group flex min-w-0 items-center gap-3 rounded-2xl pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            aria-label={`Trocar território. Você está em ${territoryName}.`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate font-display text-lg font-semibold leading-tight sm:text-xl">
                  {territoryName}
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {locationLine}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {canCreatePost ? (
              <Link
                to="/novo-post"
                className="hidden h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:inline-flex"
              >
                Publicar
              </Link>
            ) : null}
            {!user ? (
              <Link
                to="/login"
                className="inline-flex h-9 items-center rounded-full px-2.5 text-xs font-semibold text-foreground transition hover:bg-muted hover:text-primary sm:h-auto sm:px-0 sm:text-sm sm:hover:bg-transparent"
              >
                Entrar
              </Link>
            ) : null}
            <Link
              to={user ? "/notificacoes" : "/login"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition hover:border-primary/25 hover:text-primary"
              aria-label={
                user && unreadCount > 0
                  ? `${unreadCount} notificações não lidas`
                  : "Notificações"
              }
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {user && unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <section className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.68fr)] lg:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Hoje em {territoryName}
            </p>
            <h1 className="mt-2.5 max-w-3xl font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[3.2rem]">
              O que importa por aqui, em um só lugar.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground sm:text-lg sm:leading-7">
              Descubra o que mudou, o que merece atenção e o que você consegue
              resolver em {territoryName}.
            </p>
            {activeProfile?.displayName ? (
              <p className="mt-3 text-sm font-medium text-foreground">
                Olá, {activeProfile.displayName.split(" ")[0]}. Este é o seu
                contexto territorial atual.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSearch} role="search" className="relative">
            <label htmlFor="territory-home-search" className="sr-only">
              Buscar em {territoryName}
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="territory-home-search"
              name="q"
              type="search"
              autoComplete="off"
              placeholder={`Buscar em ${territoryName}`}
              className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-14 text-sm shadow-[0_18px_45px_-32px_rgba(15,23,42,0.65)] outline-none transition placeholder:text-muted-foreground focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90"
              aria-label="Buscar"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>

        {data.happeningSoon.length > 0 ? (
          <section
            className="mt-8"
            aria-labelledby="home-now-title"
            data-testid="home-now-section"
          >
            <Surface className="overflow-hidden border-orange-200/80 bg-gradient-to-r from-orange-50 to-card p-5 sm:p-6">
              <SectionHeader
                title={`Agora em ${territoryName}`}
                description="Somente informações com horário atual ou muito próximo."
                href={urls.events}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {data.happeningSoon.slice(0, 2).map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    eventsBaseUrl={urls.events}
                  />
                ))}
              </div>
            </Surface>
          </section>
        ) : null}

        <section className="mt-7 sm:mt-8" aria-labelledby="quick-actions-title">
          <div className="[&_p]:hidden sm:[&_p]:block">
            <SectionHeader
              title="Resolver por aqui"
              description="Atalhos que mantêm o contexto deste território."
            />
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="group min-w-[7.25rem] snap-start rounded-2xl border border-border/75 bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:min-w-0 sm:p-4"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      action.tone,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-foreground group-hover:text-primary">
                    {action.label}
                  </span>
                  <span className="mt-1 hidden text-xs leading-5 text-muted-foreground sm:block">
                    {action.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {data.loading.territory ? (
          <section className="mt-8">
            <HomeLoading />
          </section>
        ) : (
          <div className="mt-8 grid gap-7 lg:mt-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.8fr)] lg:items-start">
            <div className="contents lg:col-start-1 lg:block lg:space-y-7">
              <section
                className="order-1"
                aria-labelledby="worth-knowing-title"
                data-testid="worth-knowing-section"
              >
                <SectionHeader
                  title={worthKnowingTitle}
                  description={worthKnowingDescription}
                />
                {data.loading.worthKnowing ? (
                  <HomeSectionLoading />
                ) : hasWorthKnowing ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.highlights.slice(0, 2).map((highlight) => (
                      <HighlightRow key={highlight.id} highlight={highlight} />
                    ))}
                    {data.events.slice(0, 2).map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        eventsBaseUrl={urls.events}
                      />
                    ))}
                    {data.opportunities.slice(0, 2).map((opportunity) => (
                      <OpportunityRow
                        key={opportunity.id}
                        opportunity={opportunity}
                        jobsUrl={urls.jobs}
                      />
                    ))}
                    {data.classifieds.slice(0, 2).map((classified) => (
                      <ClassifiedRow
                        key={classified.id}
                        classified={classified}
                        fallbackHref={urls.classifieds}
                      />
                    ))}
                  </div>
                ) : (
                  <Surface
                    className="p-6 sm:p-8"
                    data-testid="territory-home-empty"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {isCityHome
                            ? "Ainda não há atualizações recentes para destacar na cidade."
                            : "Ainda há pouca atividade recente registrada por aqui."}
                        </p>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                          {isCityHome
                            ? "A Home não completa esse espaço com conteúdo fictício. Explore empresas, serviços e anúncios públicos de Salvador."
                            : "A Home não completa esse espaço com conteúdo fictício. Explore os serviços disponíveis ou amplie a visão para a cidade."}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          to={urls.search}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                        >
                          Explorar
                          <Compass className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        {!isCityHome ? (
                          <Link
                            to={cityBaseUrl}
                            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
                          >
                            Ver {cityName} inteira
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </Surface>
                )}
              </section>

              <section
                className="order-3"
                aria-labelledby="community-summary-title"
                data-testid="community-summary-section"
              >
                <Surface className="p-5 sm:p-6">
                  <SectionHeader
                    title={
                      isCityHome
                        ? `Community de ${territoryName}`
                        : `Community em ${territoryName}`
                    }
                    description={
                      isCityHome
                        ? "Conversas públicas dos territórios de Salvador, sem confundir cidade com bairro."
                        : "A camada de participação local: conversas, colaboração e vida comunitária."
                    }
                    href={urls.community}
                    linkLabel="Abrir Community"
                  />
                  {data.loading.community ? (
                    <HomeSectionLoading />
                  ) : data.posts.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.posts.slice(0, 4).map((post) => (
                        <CommunityPostRow
                          key={post.id}
                          post={post}
                          communityUrl={urls.community}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-muted/55 p-5">
                      <p className="font-semibold text-foreground">
                        Nenhuma conversa recente neste contexto.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Você ainda pode acompanhar a Community pública.
                        Participar depende do seu perfil, vínculo territorial e
                        das policies atuais.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={urls.community}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-primary/30"
                        >
                          Ver Community
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        {canCreatePost ? (
                          <Link
                            to="/novo-post"
                            className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                          >
                            Publicar
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Surface>
              </section>
            </div>

            <aside
              className="order-2 space-y-6 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24"
              aria-label="Serviços e contexto do território"
            >
              <Surface className="p-4 sm:p-5">
                <SectionHeader
                  title="Empresas e serviços úteis"
                  description={
                    hasUsefulPlaces
                      ? isCityHome
                        ? "Cadastros públicos encontrados nos territórios de Salvador."
                        : "Cadastros públicos disponíveis neste território."
                      : undefined
                  }
                  href={hasUsefulPlaces ? urls.business : undefined}
                />
                {data.loading.usefulPlaces ? (
                  <HomeSectionLoading rows={1} />
                ) : hasUsefulPlaces ? (
                  <div className="space-y-1">
                    {data.businesses.slice(0, 4).map((business) => (
                      <BusinessItem
                        key={business.id}
                        business={business}
                        href={getBusinessHref(
                          business,
                          urls.business,
                          appUrls.business.canonical,
                        )}
                      />
                    ))}
                    {data.services
                      .slice(0, Math.max(0, 6 - data.businesses.length))
                      .map((service) => (
                        <ServiceItem
                          key={service.id}
                          service={service}
                          href={urls.services}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-muted/55 p-5 text-sm leading-6 text-muted-foreground">
                    Ainda não há empresas ou profissionais públicos suficientes
                    para destacar aqui.
                  </div>
                )}
              </Surface>

              <Surface className="overflow-hidden p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                      Seu contexto
                    </p>
                    <h2 className="mt-2 font-display text-xl font-semibold">
                      {territoryName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {locationLine}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ["Empresas", urls.business],
                    ["Serviços", urls.services],
                    ["Anúncios", urls.classifieds],
                  ].map(([label, href]) => (
                    <Link
                      key={label}
                      to={href}
                      className="rounded-2xl bg-muted/55 p-3 text-center text-xs font-semibold text-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 grid gap-2">
                  <Link
                    to={urls.map}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:border-primary/30"
                  >
                    <Map className="h-4 w-4" aria-hidden="true" />
                    Ver no mapa
                  </Link>
                  {!isCityHome ? (
                    <Link
                      to={cityBaseUrl}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-foreground hover:bg-muted/80"
                    >
                      Ampliar para {cityName}
                    </Link>
                  ) : null}
                </div>
              </Surface>
            </aside>
          </div>
        )}

        {data.hasError ? (
          <div
            className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            Parte das informações não pôde ser atualizada. O restante da Home
            continua disponível sem substituir dados ausentes por conteúdo
            fictício.
          </div>
        ) : null}

        <section
          className="mt-12 border-t border-border/70 pt-8"
          aria-labelledby="discover-more-title"
        >
          <SectionHeader
            title="Descobrir mais"
            description={`Outras formas de explorar ${territoryName}.`}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Explorar e buscar",
                description: "Encontre lugares, serviços e conteúdo.",
                href: urls.search,
                icon: Search,
              },
              {
                label: "Eventos",
                description: "Agenda válida do território.",
                href: urls.events,
                icon: CalendarDays,
              },
              {
                label: "Vagas e oportunidades",
                description: "O que ainda está disponível por perto.",
                href: urls.jobs,
                icon: BriefcaseBusiness,
              },
              {
                label: "Comércio local",
                description: "Empresas e profissionais cadastrados.",
                href: urls.business,
                icon: Building2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-border/75 bg-card p-4 transition hover:border-primary/30 hover:shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
