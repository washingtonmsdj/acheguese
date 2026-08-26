import { useMemo, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Compass,
  Info,
  Map,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  TerritorySearch,
  TerritorySectionHeading,
  TerritoryState,
  TerritorySurface,
  TerritoryTopbar,
} from "@/app/components/territory-vivo";
import {
  isSalvadorCommunityLaunchTerritory,
  SALVADOR_COMMUNITY_LAUNCH_CLUSTER,
} from "@/config/communityLaunch";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";
import { TERRITORY_CONFIG } from "@/config/territory";
import { useCommunityAccess } from "@/core/community-experience/access";
import { classifiedUrlService } from "@/core/classifieds/services";
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
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import {
  buildCityTerritoryBaseUrl,
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { useSessionContext } from "@/core/session";
import type { TerritorialHighlight } from "@/core/territorial/highlights/types";
import type { PublicEvent } from "@/core/community-events";
import { eventPublicRoutes } from "@/core/community-events/routes/eventPublicRoutes";
import type { WorkOpportunityCard } from "@/core/work-opportunities/types";
import { cn } from "@/shared/utils/cn";

interface HomeUrls {
  business: string;
  classifieds: string;
  community: string;
  communityInterest: string;
  events: string;
  gastronomy: string;
  jobs: string;
  map: string;
  search: string;
  services: string;
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

interface StoryRowProps {
  icon: ReactNode;
  kicker: string;
  title: string;
  meta?: string;
  href?: string;
  imageUrl?: string;
  toneClassName: string;
}

function StoryRow({
  icon,
  kicker,
  title,
  meta,
  href,
  imageUrl,
  toneClassName,
}: StoryRowProps) {
  const content = (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-14 w-16 shrink-0 rounded-territory object-cover sm:h-16 sm:w-20"
        />
      ) : (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-territory",
            toneClassName,
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-territory-muted">
          {kicker}
        </span>
        <span className="mt-1 block line-clamp-2 font-heading text-[0.9375rem] font-semibold leading-6 text-territory-ink group-hover:text-territory-brand sm:text-base">
          {title}
        </span>
        {meta ? (
          <span className="mt-1 block truncate text-sm text-territory-muted">
            {meta}
          </span>
        ) : null}
      </span>
      {href ? (
        <ArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  const className =
    "group flex gap-3 border-b border-territory-border/75 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:gap-4";

  return href ? (
    <Link to={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
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
    <StoryRow
      href={eventPublicRoutes.detailFromBase(eventsBaseUrl, event.id)}
      icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
      kicker={`Evento · ${formatEventDate(event.date)}`}
      title={event.title}
      meta={event.venue_name ?? event.location ?? "Local a confirmar"}
      toneClassName="bg-[hsl(var(--category-event)/0.14)] text-category-event"
    />
  );
}

function HighlightRow({ highlight }: { highlight: TerritorialHighlight }) {
  return (
    <StoryRow
      href={highlight.cta_url?.startsWith("/") ? highlight.cta_url : undefined}
      icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
      kicker="Destaque local"
      title={highlight.title}
      meta={highlight.subtitle ?? undefined}
      toneClassName="bg-[hsl(var(--category-discussion)/0.14)] text-category-discussion"
    />
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
    <StoryRow
      href={jobsUrl}
      icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
      kicker={`Oportunidade · ${opportunity.territory_name ?? "por perto"}`}
      title={opportunity.headline}
      meta={opportunity.professional_category}
      toneClassName="bg-[hsl(var(--category-poll)/0.14)] text-category-poll"
    />
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
    <StoryRow
      href={href}
      icon={<Tag className="h-5 w-5" aria-hidden="true" />}
      kicker={`Classificado · ${formatPrice(classified.price)}`}
      title={classified.titulo}
      meta={classified.territory_name ?? classified.category}
      imageUrl={classified.photos[0]}
      toneClassName="bg-[hsl(var(--category-classified)/0.16)] text-category-classified"
    />
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
      className="group flex gap-3 border-b border-territory-border/75 py-4 first:pt-0 last:border-b-0 last:pb-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-territory-brand/12 font-semibold text-territory-brand">
        {getInitial(author)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-xs text-territory-muted">
          <span className="truncate font-semibold text-territory-ink">
            {author}
          </span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {formatRelativeDate(post.created_at)}
          </span>
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-6 text-territory-ink group-hover:text-territory-brand">
          {getPublicPostPreview(
            post.content,
            150,
            "Conteúdo sem resumo disponível.",
          )}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-territory-muted">
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
      className="group flex items-center gap-3 border-b border-territory-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
    >
      {business.logo_url ? (
        <img
          src={business.logo_url}
          alt=""
          className="h-10 w-10 shrink-0 rounded-territory object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-[hsl(var(--category-business)/0.14)] font-semibold text-category-business">
          {getInitial(business.name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-territory-ink group-hover:text-territory-brand">
            {business.name}
          </span>
          {business.is_verified ? (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-category-discussion"
              aria-label="Verificado"
            />
          ) : null}
        </span>
        <span className="block truncate text-xs text-territory-muted">
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
      className="group flex items-center gap-3 border-b border-territory-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0"
    >
      {service.logo_url ? (
        <img
          src={service.logo_url}
          alt=""
          className="h-10 w-10 shrink-0 rounded-territory object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-[hsl(var(--category-discussion)/0.14)] font-semibold text-category-discussion">
          {getInitial(service.name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-territory-ink group-hover:text-territory-brand">
            {service.name}
          </span>
          {service.is_verified ? (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-category-discussion"
              aria-label="Verificado"
            />
          ) : null}
        </span>
        <span className="block truncate text-xs text-territory-muted">
          {service.category || "Serviço local"} ·{" "}
          {service.price_range ?? "A combinar"}
        </span>
      </span>
    </Link>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <TerritorySurface
      className="p-5 sm:p-6"
      aria-label="Atualizando esta seção"
    >
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex animate-pulse gap-3">
            <div className="h-11 w-11 rounded-territory bg-territory-raised" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-24 rounded-full bg-territory-raised" />
              <div className="h-4 w-4/5 rounded-full bg-territory-raised" />
            </div>
          </div>
        ))}
      </div>
    </TerritorySurface>
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
  if (business.geographic_path.split("/").filter(Boolean).length < 4)
    return fallbackHref;
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
  const stateSlug = params.state ?? TERRITORY_CONFIG.launch.state;
  const citySlug = params.city ?? TERRITORY_CONFIG.launch.city;
  const resolvedTerritorySlug =
    resolved.kind === "group" ? resolved.group.slug : resolved.location.slug;
  const isOfficialCommunityTerritory =
    stateSlug === "ba" &&
    citySlug === "salvador" &&
    isSalvadorCommunityLaunchTerritory(resolvedTerritorySlug);
  const isCommunityAvailable =
    isOfficialCommunityTerritory && access.isCommunityAvailable;
  const data = useTerritoryHomeData({
    resolved,
    territoryFilter: territory.territoryFilter,
    resolvedLocationIds: territory.resolvedLocationIds,
    territoryLoading: territory.isLoading,
    communityEnabled: !access.isLoading && isCommunityAvailable,
  });

  const cityBaseUrl = buildCityTerritoryBaseUrl(baseUrl);
  const isCityHome = cityBaseUrl === baseUrl;
  const isSalvadorCity =
    isCityHome && stateSlug === "ba" && citySlug === "salvador";
  const territoryName =
    resolved.kind === "group" ? resolved.group.name : resolved.location.name;
  const cityName = titleCase(citySlug);
  const stateLabel = stateSlug.toLocaleUpperCase("pt-BR");
  const locationLine = isCityHome
    ? `${stateLabel} · visão ampla da cidade`
    : `${cityName}, ${stateLabel}`;

  const urls = useMemo<HomeUrls>(
    () => ({
      business: appUrls.business.list,
      classifieds: appUrls.classifieds.list,
      community: communityBaseUrl,
      communityInterest: buildCommunityTerritoryUrl(baseUrl, "interesse"),
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
        tone: "bg-territory-brand/14 text-territory-brand",
      },
      {
        label: "Serviços",
        description: "Profissionais locais",
        href: urls.services,
        icon: Wrench,
        tone: "bg-[hsl(var(--category-discussion)/0.14)] text-category-discussion",
      },
      {
        label: "Empresas",
        description: "Comércio por perto",
        href: urls.business,
        icon: Store,
        tone: "bg-[hsl(var(--category-business)/0.14)] text-category-business",
      },
      {
        label: "Classificados",
        description: "Comprar e vender",
        href: urls.classifieds,
        icon: Tag,
        tone: "bg-[hsl(var(--category-classified)/0.15)] text-category-classified",
      },
      {
        label: "Mapa",
        description: "Ver por localização",
        href: urls.map,
        icon: Map,
        tone: "bg-territory-warm/14 text-territory-warm",
      },
      {
        label: "Gastronomia",
        description: "Onde comer",
        href: urls.gastronomy,
        icon: UtensilsCrossed,
        tone: "bg-[hsl(var(--category-gastronomy)/0.14)] text-category-gastronomy",
      },
    ];
    return actions.filter(
      (action) =>
        action.href !== urls.gastronomy || isLaunchSurfaceEnabled("gastronomy"),
    );
  }, [urls]);

  const hasWorthKnowing =
    data.highlights.length > 0 ||
    data.events.length > 0 ||
    data.opportunities.length > 0 ||
    data.classifieds.length > 0;
  const hasUsefulPlaces =
    data.businesses.length > 0 || data.services.length > 0;
  const canCreatePost =
    !access.isLoading && isCommunityAvailable && access.can.create_post;
  const worthKnowingTitle = isCityHome
    ? `Panorama de ${territoryName}`
    : `Vale saber em ${territoryName}`;

  const welcomeName = activeProfile?.displayName?.split(" ")[0];
  const heroTitle = isCityHome
    ? `${territoryName} hoje, sem perder os bairros de vista.`
    : `O que merece atenção em ${territoryName} hoje.`;

  return (
    <div className="min-h-[100dvh] text-territory-ink">
      <TerritoryTopbar
        territoryName={territoryName}
        contextLabel={locationLine}
        isAuthenticated={Boolean(user)}
        unreadCount={unreadCount}
        canCreatePost={canCreatePost}
      />

      <main className="mx-auto w-full max-w-[76rem] px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <section className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:gap-10">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-territory-brand">
              {welcomeName ? `Olá, ${welcomeName}` : `Hoje em ${territoryName}`}
            </p>
            <h1 className="mt-2 max-w-3xl font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.035em] text-territory-ink sm:text-4xl lg:text-[2.5rem]">
              {heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-6 text-territory-muted sm:text-base sm:leading-7">
              Onde estou, o que mudou e o que consigo resolver por aqui — com
              dados reais deste território.
            </p>
          </div>

          <TerritorySearch
            id="territory-home-search"
            label={`Buscar em ${territoryName}`}
            placeholder={`Buscar em ${territoryName}`}
            onSubmit={(query) =>
              navigate(
                query
                  ? `${urls.search}?q=${encodeURIComponent(query)}`
                  : urls.search,
              )
            }
          />
        </section>

        {data.happeningSoon.length > 0 ? (
          <section
            className="mt-7"
            aria-labelledby="home-now-title"
            data-testid="home-now-section"
          >
            <TerritorySurface tone="highlight" className="p-5 sm:p-6">
              <TerritorySectionHeading
                id="home-now-title"
                title={`Agora em ${territoryName}`}
                eyebrow="Informação atual"
                description="Somente eventos em andamento ou com horário realmente próximo."
                href={urls.events}
              />
              <div className="grid gap-x-6 sm:grid-cols-2">
                {data.happeningSoon.slice(0, 2).map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    eventsBaseUrl={urls.events}
                  />
                ))}
              </div>
            </TerritorySurface>
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="resolver-title">
          <TerritorySectionHeading
            id="resolver-title"
            title="Resolver por aqui"
            description="Intenções frequentes, sempre dentro do território atual."
          />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="group min-w-[7.75rem] snap-start rounded-territory border border-territory-border bg-territory-surface p-3.5 transition-colors hover:border-territory-brand/35 hover:bg-territory-raised sm:min-w-0 sm:p-4"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      action.tone,
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-territory-ink group-hover:text-territory-brand">
                    {action.label}
                  </span>
                  <span className="mt-1 hidden text-xs leading-5 text-territory-muted sm:block">
                    {action.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start xl:gap-12">
          <section
            className="order-1 xl:col-start-1"
            aria-labelledby="worth-knowing-title"
            data-testid="worth-knowing-section"
          >
            <TerritorySectionHeading
              id="worth-knowing-title"
              title={worthKnowingTitle}
              description={
                isCityHome
                  ? "Uma leitura ampla do que está válido nos territórios da cidade."
                  : "Informação pública, válida e vinculada a este território."
              }
            />
            {data.loading.worthKnowing ? (
              <SectionSkeleton />
            ) : hasWorthKnowing ? (
              <TerritorySurface className="p-5 sm:p-6">
                <div className="grid gap-x-8 md:grid-cols-2">
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
              </TerritorySurface>
            ) : (
              <TerritoryState
                icon={<Info className="h-5 w-5" aria-hidden="true" />}
                title={
                  isCityHome
                    ? "Ainda não há atualizações recentes para destacar na cidade."
                    : "Ainda há pouca atividade recente registrada por aqui."
                }
                description={
                  isCityHome
                    ? "Não preenchemos este espaço com conteúdo fictício. Explore cadastros públicos de Salvador."
                    : "Não preenchemos este espaço com conteúdo fictício. Explore o que já existe ou amplie a visão para Salvador."
                }
                primaryAction={{ label: "Explorar", href: urls.search }}
                secondaryAction={
                  isCityHome
                    ? undefined
                    : { label: `Ver ${cityName} inteira`, href: cityBaseUrl }
                }
                testId="territory-home-empty"
              />
            )}
          </section>

          <aside
            className="order-2 space-y-6 xl:col-start-2 xl:row-span-3 xl:row-start-1 xl:sticky xl:top-24"
            aria-label="Contexto e serviços do território"
          >
            <TerritorySurface className="p-5">
              <TerritorySectionHeading
                title="Empresas e serviços"
                description={
                  hasUsefulPlaces
                    ? `Cadastros públicos em ${territoryName}.`
                    : undefined
                }
                href={hasUsefulPlaces ? urls.business : undefined}
                className="mb-4"
              />
              {data.loading.usefulPlaces ? (
                <div
                  className="space-y-3"
                  aria-label="Atualizando lugares úteis"
                >
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-12 animate-pulse rounded-territory bg-territory-raised"
                    />
                  ))}
                </div>
              ) : hasUsefulPlaces ? (
                <div>
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
                <p className="text-sm leading-6 text-territory-muted">
                  Ainda não há empresas ou profissionais públicos suficientes
                  para destacar aqui.
                </p>
              )}
            </TerritorySurface>

            <TerritorySurface tone="inset" className="overflow-hidden p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                    Seu contexto
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-semibold text-territory-ink">
                    {territoryName}
                  </h2>
                  <p className="mt-1 text-sm text-territory-muted">
                    {locationLine}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-territory bg-territory-brand/12 text-territory-brand">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-2">
                <Link
                  to={urls.map}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-territory-brand text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong"
                >
                  <Map className="h-4 w-4" aria-hidden="true" />
                  Explorar no mapa
                </Link>
                {!isCityHome ? (
                  <Link
                    to={cityBaseUrl}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-territory-border bg-territory-surface text-sm font-semibold text-territory-ink hover:border-territory-brand/35"
                  >
                    Ampliar para {cityName}
                  </Link>
                ) : null}
              </div>
            </TerritorySurface>
          </aside>

          <section
            className="order-3 xl:col-start-1"
            aria-labelledby="community-summary-title"
            data-testid="community-summary-section"
          >
            <TerritorySectionHeading
              id="community-summary-title"
              title={
                isCityHome
                  ? `Community em ${territoryName}`
                  : `Community de ${territoryName}`
              }
              description="A camada de participação local, sem substituir o território nem os serviços públicos."
              href={isCommunityAvailable ? urls.community : undefined}
              linkLabel="Abrir Community"
            />

            {access.isLoading ? (
              <SectionSkeleton rows={2} />
            ) : isSalvadorCity ? (
              <TerritorySurface className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-territory bg-territory-brand/12 text-territory-brand">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-heading font-semibold text-territory-ink">
                      Primeiro cluster: Complexo do Nordeste de Amaralina
                    </p>
                    <p className="mt-1 text-sm leading-6 text-territory-muted">
                      A participação começa por quatro territórios
                      independentes, sem bloquear o restante da Home de
                      Salvador.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {SALVADOR_COMMUNITY_LAUNCH_CLUSTER.map((item) => {
                    const territoryBase = `/${stateSlug}/${citySlug}/${item.slug}`;
                    return (
                      <Link
                        key={item.slug}
                        to={buildCommunityTerritoryUrl(territoryBase)}
                        className="flex min-h-11 items-center justify-between rounded-xl border border-territory-border px-3 text-sm font-semibold text-territory-ink hover:border-territory-brand/35 hover:text-territory-brand"
                      >
                        {item.name}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
                {isCommunityAvailable && data.posts.length > 0 ? (
                  <div className="mt-6 border-t border-territory-border pt-5">
                    {data.posts.slice(0, 3).map((post) => (
                      <CommunityPostRow
                        key={post.id}
                        post={post}
                        communityUrl={urls.community}
                      />
                    ))}
                  </div>
                ) : null}
              </TerritorySurface>
            ) : !isCommunityAvailable ? (
              <TerritoryState
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                title={`Community ainda não liberada em ${territoryName}.`}
                description="Empresas, serviços, mapa e conteúdo público continuam disponíveis. A restrição vale somente para a camada de participação."
                primaryAction={{
                  label: "Acompanhar liberação",
                  href: urls.communityInterest,
                }}
                secondaryAction={{
                  label: "Continuar explorando",
                  href: urls.search,
                }}
              />
            ) : data.loading.community ? (
              <SectionSkeleton rows={2} />
            ) : data.posts.length > 0 ? (
              <TerritorySurface className="p-5 sm:p-6">
                <div className="grid gap-x-8 md:grid-cols-2">
                  {data.posts.slice(0, 4).map((post) => (
                    <CommunityPostRow
                      key={post.id}
                      post={post}
                      communityUrl={urls.community}
                    />
                  ))}
                </div>
              </TerritorySurface>
            ) : (
              <TerritoryState
                icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
                title="Nenhuma conversa recente neste território."
                description="A Community está disponível. Participar depende do perfil ativo, vínculo territorial e policies atuais."
                primaryAction={{ label: "Ver Community", href: urls.community }}
                secondaryAction={
                  canCreatePost
                    ? { label: "Publicar", href: "/novo-post" }
                    : undefined
                }
              />
            )}
          </section>

          <section
            className="order-4 border-t border-territory-border pt-8 xl:col-start-1"
            aria-labelledby="discover-more-title"
          >
            <TerritorySectionHeading
              id="discover-more-title"
              title="Continuar explorando"
              description={`Outras formas úteis de navegar por ${territoryName}.`}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Explorar e buscar",
                  description: "Resultados, categorias, filtros e mapa.",
                  href: urls.search,
                  icon: Compass,
                },
                {
                  label: "Eventos",
                  description: "Agenda válida deste contexto.",
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
                    className="group flex items-center gap-4 rounded-territory border border-territory-border bg-territory-surface p-4 transition-colors hover:border-territory-brand/35 hover:bg-territory-raised"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-territory-ink group-hover:text-territory-brand">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-territory-muted">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {data.hasError ? (
          <div
            className="mt-8 rounded-territory border border-territory-sun/30 bg-territory-sun/10 px-4 py-3 text-sm text-territory-ink"
            role="status"
          >
            Parte das informações não pôde ser atualizada. O restante da Home
            continua disponível sem substituir dados ausentes por conteúdo
            fictício.
          </div>
        ) : null}
      </main>
    </div>
  );
}
