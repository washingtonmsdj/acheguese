import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  Compass,
  GraduationCap,
  Info,
  Map,
  MessageCircle,
  Megaphone,
  Heart,
  MoreHorizontal,
  ShieldCheck,
  Store,
  Tag,
  Users,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  TerritorySectionHeading,
  TerritoryState,
  TerritorySurface,
  TerritoryTopbar,
} from "@/app/components/territory-vivo";
import {
  isSalvadorCommunityLaunchTerritory,
} from "@/core/community/config/communityLaunch";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
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
import { CONCEPT_HOME_MOCK } from "@/app/mocks/territoryHomeConceptMock";

interface HomeUrls {
  business: string;
  classifieds: string;
  community: string;
  communityInterest: string;
  education: string;
  events: string;
  gastronomy: string;
  jobs: string;
  map: string;
  mobility: string;
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

const TerritoryMapPreview = lazy(
  () => import("@/app/components/territory-vivo/TerritoryMapPreview"),
);

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

function HappeningRow({
  event,
  eventsBaseUrl,
}: {
  event: PublicEvent;
  eventsBaseUrl: string;
}) {
  return (
    <Link
      to={eventPublicRoutes.detailFromBase(eventsBaseUrl, event.id)}
      className="group flex items-center gap-3 rounded-xl bg-territory-sun/35 px-3 py-2 transition-colors hover:bg-territory-sun/50 sm:px-4 sm:py-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-ink sm:h-10 sm:w-10">
        <Megaphone className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-sm font-bold text-territory-ink sm:text-base">
          {event.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-territory-ink/75 sm:text-sm">
          {event.subtitle ?? formatEventDate(event.date)}
          {!event.subtitle && (event.venue_name || event.location)
            ? ` · ${event.venue_name ?? event.location}`
            : ""}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-territory-ink transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

function AgendaRow({
  event,
  eventsBaseUrl,
}: {
  event: PublicEvent;
  eventsBaseUrl: string;
}) {
  const parsedDate = new Date(event.date);
  const hasDate = !Number.isNaN(parsedDate.getTime());
  const weekday = hasDate
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
        .format(parsedDate)
        .replace(".", "")
        .toUpperCase()
    : "DATA";
  const day = hasDate ? String(parsedDate.getDate()).padStart(2, "0") : "—";

  return (
    <Link
      to={eventPublicRoutes.detailFromBase(eventsBaseUrl, event.id)}
      className="group flex items-center gap-3 border-b border-territory-border/75 py-3 last:border-b-0 last:pb-0"
    >
      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-territory-raised text-territory-brand">
        <span className="text-[0.625rem] font-bold leading-none">{weekday}</span>
        <span className="mt-1 font-heading text-xl font-bold leading-none text-territory-ink">
          {day}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-territory-ink group-hover:text-territory-brand">
          {event.title}
        </span>
        <span className="mt-1 block truncate text-xs text-territory-muted">
          {event.subtitle ?? formatEventDate(event.date)}
          {!event.subtitle && (event.venue_name || event.location)
            ? ` · ${event.venue_name ?? event.location}`
            : ""}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
    </Link>
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

function ConceptMockPostCard({
  post,
  communityUrl,
}: {
  post: Post;
  communityUrl: string;
}) {
  const author = post.profile?.displayName ?? "Pessoa da comunidade";
  const separator = communityUrl.includes("?") ? "&" : "?";
  const [question, detail] = post.content.split("\n");

  return (
    <Link
      to={`${communityUrl}${separator}post=${encodeURIComponent(post.id)}`}
      className="group block p-3.5 sm:p-5"
    >
      <span className="flex items-start gap-3">
        {post.profile?.avatarUrl ? (
          <img
            src={post.profile.avatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-territory-brand/12 font-semibold text-territory-brand">
            {getInitial(author)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-territory-ink">
            {author}
          </span>
          <span className="mt-0.5 block text-xs text-territory-muted">
            {post.location?.name ?? "Santa Cruz"} · {post.id === "concept-mock-post" ? "há 2h" : formatRelativeDate(post.created_at)}
          </span>
        </span>
        <span
          className="shrink-0 text-lg leading-none text-territory-ink"
          aria-hidden="true"
        >
          ···
        </span>
      </span>
      <span className="mt-3 block font-heading text-base font-bold leading-6 text-territory-ink group-hover:text-territory-brand sm:mt-4">
        {question}
      </span>
      {detail ? (
        <span className="mt-1 block text-sm leading-6 text-territory-muted">
          {detail}
        </span>
      ) : null}
      <span className="mt-3 flex items-center gap-5 text-xs font-semibold text-territory-muted sm:mt-4">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Responder
        </span>
        <Heart className="h-5 w-5" aria-hidden="true" />
        <Bookmark className="h-5 w-5" aria-hidden="true" />
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
      className="group flex items-center gap-3 border-b border-territory-border/70 py-2 first:pt-0 last:border-b-0 last:pb-0"
    >
      {business.logo_url ? (
        <img
          src={business.logo_url}
          alt=""
          className="h-14 w-16 shrink-0 rounded-territory object-cover sm:h-16 sm:w-[4.5rem]"
        />
      ) : (
        <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-territory bg-[hsl(var(--category-business)/0.14)] font-semibold text-category-business sm:h-16 sm:w-[4.5rem]">
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
      <ArrowRight className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand" aria-hidden="true" />
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
      className="group flex items-center gap-3 border-b border-territory-border/70 py-2 first:pt-0 last:border-b-0 last:pb-0"
    >
      {service.logo_url ? (
        <img
          src={service.logo_url}
          alt=""
          className="h-14 w-16 shrink-0 rounded-territory object-cover sm:h-16 sm:w-[4.5rem]"
        />
      ) : (
        <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-territory bg-[hsl(var(--category-discussion)/0.14)] font-semibold text-category-discussion sm:h-16 sm:w-[4.5rem]">
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
      <ArrowRight className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand" aria-hidden="true" />
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
  const params = useParams();
  const { search } = useLocation();
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
  const liveData = useTerritoryHomeData({
    resolved,
    territoryFilter: territory.territoryFilter,
    resolvedLocationIds: territory.resolvedLocationIds,
    territoryLoading: territory.isLoading,
    communityEnabled: !access.isLoading && isCommunityAvailable,
  });
  const conceptMockEnabled =
    import.meta.env.DEV &&
    new URLSearchParams(search).get("concept-mock") === "1";
  const data = conceptMockEnabled ? CONCEPT_HOME_MOCK : liveData;
  const communityVisibleInView = isCommunityAvailable || conceptMockEnabled;

  const cityBaseUrl = buildCityTerritoryBaseUrl(baseUrl);
  const isCityHome = cityBaseUrl === baseUrl;
  const territoryName = (
    resolved.kind === "group" ? resolved.group.name : resolved.location.name
  ).trim();
  const cityName = titleCase(citySlug);
  const stateLabel = stateSlug.toLocaleUpperCase("pt-BR");
  const locationLine = isCityHome
    ? `${stateLabel} · visão ampla da cidade`
    : `${territoryName} · ${cityName}, ${stateLabel}`;
  const topbarContextLabel = `${cityName}, ${stateLabel}`;

  const urls = useMemo<HomeUrls>(
    () => ({
      business: appUrls.business.list,
      classifieds: appUrls.classifieds.list,
      community: communityBaseUrl,
      communityInterest: buildCommunityTerritoryUrl(baseUrl, "interesse"),
      education: buildModuleTerritoryUrl(MODULE_SLUGS.education, baseUrl),
      events: buildModuleTerritoryUrl(MODULE_SLUGS.events, baseUrl),
      gastronomy: buildModuleTerritoryUrl(MODULE_SLUGS.gastronomy, baseUrl),
      jobs: buildModuleTerritoryUrl(MODULE_SLUGS.jobs, baseUrl),
      map: buildModuleTerritoryUrl(MODULE_SLUGS.map, baseUrl),
      mobility: buildModuleTerritoryUrl(MODULE_SLUGS.mobility, baseUrl),
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
        label: "Comida",
        description: "Onde comer por perto",
        href: urls.gastronomy,
        icon: Utensils,
        tone: "bg-territory-raised text-territory-brand",
      },
      {
        label: "Negócios",
        description: "Comércio por perto",
        href: urls.business,
        icon: Store,
        tone: "bg-territory-raised text-territory-brand",
      },
      {
        label: "Serviços",
        description: "Profissionais locais",
        href: urls.services,
        icon: Wrench,
        tone: "bg-territory-raised text-territory-brand",
      },
      {
        label: "Mobilidade",
        description: "Deslocamentos por perto",
        href: urls.mobility,
        icon: BusFront,
        tone: "bg-territory-raised text-territory-brand",
      },
      {
        label: "Classificados",
        description: "Comprar e vender",
        href: urls.classifieds,
        icon: Tag,
        tone: "bg-territory-raised text-territory-brand",
      },
      {
        label: "Educação",
        description: "Aprender no território",
        href: urls.education,
        icon: BookOpen,
        tone: "bg-territory-raised text-territory-brand",
      },
    ];
    return actions.filter(
      (action) =>
        action.href !== urls.gastronomy || isLaunchSurfaceEnabled("gastronomy"),
    );
  }, [urls]);

  const moreQuickAction = useMemo(
    () => ({
      label: "Ver todos",
      description: "Todos os caminhos do território",
      href: urls.search,
      icon: MoreHorizontal,
      tone: "bg-territory-raised text-territory-brand",
    }),
    [urls.search],
  );

  const mobileQuickActionsContainerRef = useRef<HTMLDivElement>(null);
  const mobileQuickActionsMeasureRef = useRef<HTMLDivElement>(null);
  const [mobileQuickActionCount, setMobileQuickActionCount] = useState(() =>
    Math.min(4, quickActions.length),
  );

  useEffect(() => {
    const container = mobileQuickActionsContainerRef.current;
    const measure = mobileQuickActionsMeasureRef.current;
    if (!container || !measure) return;

    const updateVisibleActions = () => {
      const containerStyles = window.getComputedStyle(container);
      const availableWidth =
        container.clientWidth -
        Number.parseFloat(containerStyles.paddingLeft || "0") -
        Number.parseFloat(containerStyles.paddingRight || "0");
      const gap = Number.parseFloat(window.getComputedStyle(measure).columnGap || "0");
      const measuredWidths = Array.from(measure.children).map(
        (child) => child.getBoundingClientRect().width,
      );
      const actionWidths = measuredWidths.slice(0, quickActions.length);
      const moreWidth = measuredWidths[quickActions.length] ?? 64;
      const allActionsWidth =
        actionWidths.reduce((total, width) => total + width, 0) +
        Math.max(0, actionWidths.length - 1) * gap;

      let visibleCount = quickActions.length;
      if (allActionsWidth > availableWidth + 1) {
        visibleCount = 0;
        for (let count = 1; count <= actionWidths.length; count += 1) {
          const candidateWidth =
            actionWidths.slice(0, count).reduce((total, width) => total + width, 0) +
            moreWidth +
            count * gap;
          if (candidateWidth <= availableWidth + 1) {
            visibleCount = count;
          } else {
            break;
          }
        }
      }

      setMobileQuickActionCount((currentCount) =>
        currentCount === visibleCount ? currentCount : visibleCount,
      );
    };

    updateVisibleActions();
    const resizeObserver = new ResizeObserver(updateVisibleActions);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [quickActions.length]);

  const mobileQuickActions = useMemo(
    () => [
      ...quickActions.slice(0, mobileQuickActionCount),
      ...(mobileQuickActionCount < quickActions.length ? [moreQuickAction] : []),
    ],
    [mobileQuickActionCount, moreQuickAction, quickActions],
  );

  const hasWorthKnowing =
    data.highlights.length > 0 ||
    data.events.length > 0 ||
    data.opportunities.length > 0 ||
    data.classifieds.length > 0 ||
    (communityVisibleInView &&
      (data.loading.community || data.posts.length > 0));
  const hasUsefulPlaces =
    data.businesses.length > 0 || data.services.length > 0;
  const canCreatePost =
    !access.isLoading && isCommunityAvailable && access.can.create_post;
  const worthKnowingTitle = isCityHome
    ? `Panorama de ${territoryName}`
    : "Na sua comunidade";

  const heroTitle = isCityHome
    ? `${territoryName}, mais perto.`
    : "Seu bairro, mais perto.";

  return (
    <div className="min-h-[100dvh] text-territory-ink">
      <TerritoryTopbar
        territoryName={territoryName}
        contextLabel={topbarContextLabel}
        isAuthenticated={Boolean(user)}
        unreadCount={unreadCount}
        searchHref={urls.search}
        searchLabel="O que você procura por aqui?"
        messagesHref={appUrls.messages}
        profileLabel={activeProfile?.displayName}
        profileAvatarUrl={activeProfile?.avatarUrl}
      />

      <main
        className="mx-auto w-full max-w-[76rem] px-4 pb-24 pt-3 sm:px-6 sm:pt-4 md:pt-8 lg:px-8 lg:pb-10"
        data-concept-mock={conceptMockEnabled ? "true" : undefined}
      >
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] xl:items-start xl:gap-8">
          <div className="xl:col-start-1">
            <section className="hidden items-end justify-between gap-5 md:flex">
              <div>
                <h1 className="max-w-3xl font-heading text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-territory-ink sm:text-4xl lg:text-[2.5rem]">
                  {heroTitle}
                </h1>
                <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-territory-muted sm:text-base">
                  {locationLine}
                </p>
              </div>
              {canCreatePost ? (
                <Link
                  to="/novo-post"
                  className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 sm:inline-flex"
                >
                  <span className="text-xl leading-none" aria-hidden="true">+</span>
                  Publicar
                </Link>
              ) : null}
            </section>

            <section className="mt-0 md:mt-2" aria-labelledby="resolver-title">
              <h2 id="resolver-title" className="sr-only">
                Resolver por aqui
              </h2>
              <div className="-mx-4 overflow-hidden px-4 pb-2 scrollbar-hide md:hidden">
                <div
                  ref={mobileQuickActionsContainerRef}
                  className="flex min-w-0 gap-1.5"
                >
                  {mobileQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        to={action.href}
                        className="group flex min-w-16 flex-none flex-col items-center rounded-xl p-1 text-center transition-colors hover:bg-territory-raised"
                      >
                        <span
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            action.tone,
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="mt-2 block text-xs font-semibold leading-5 text-territory-ink group-hover:text-territory-brand sm:text-sm">
                          {action.label}
                        </span>
                        <span className="sr-only">{action.description}</span>
                      </Link>
                    );
                  })}
                </div>
                <div
                  ref={mobileQuickActionsMeasureRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[10000px] top-0 flex w-max gap-1.5 opacity-0"
                >
                  {[...quickActions, moreQuickAction].map((action) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={`measure-${action.label}`}
                        className="group flex min-w-16 flex-none flex-col items-center rounded-xl p-1 text-center"
                      >
                        <span
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full",
                            action.tone,
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="mt-2 block text-xs font-semibold leading-5 text-territory-ink sm:text-sm">
                          {action.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="hidden md:grid md:grid-cols-6 md:gap-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="group flex min-w-0 flex-col items-center rounded-xl p-2 text-center transition-colors hover:bg-territory-raised"
                    >
                      <span
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-full",
                          action.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="mt-2 block text-sm font-semibold leading-5 text-territory-ink group-hover:text-territory-brand">
                        {action.label}
                      </span>
                      <span className="sr-only">{action.description}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div
              className={cn(
                "mt-0 grid gap-3 md:mt-4 md:gap-10",
                !conceptMockEnabled && "gap-6",
              )}
            >
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
                  : undefined
              }
              href={!isCityHome && communityVisibleInView ? urls.community : undefined}
              linkLabel="Ver feed"
            />
            {data.loading.worthKnowing ? (
              <SectionSkeleton />
            ) : hasWorthKnowing ? (
              <div
                className={
                  conceptMockEnabled ? "space-y-3 md:space-y-4" : "space-y-4"
                }
              >
                {data.happeningSoon.slice(0, 1).map((event) => (
                  <TerritorySurface
                    key={event.id}
                    tone="default"
                    className="border-0 bg-transparent p-0"
                  >
                    <HappeningRow
                      event={event}
                      eventsBaseUrl={urls.events}
                    />
                  </TerritorySurface>
                ))}
                {communityVisibleInView && data.posts.length > 0 ? (
                  <TerritorySurface className={conceptMockEnabled ? "p-0" : "p-5 sm:p-6"}>
                    {conceptMockEnabled ? (
                      data.posts.slice(0, 1).map((post) => (
                        <ConceptMockPostCard
                          key={post.id}
                          post={post}
                          communityUrl={urls.community}
                        />
                      ))
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-territory-ink">
                            Conversas por perto
                          </p>
                          <Link
                            to={urls.community}
                            className="text-sm font-semibold text-territory-brand hover:text-territory-brand-strong"
                          >
                            Ver feed
                          </Link>
                        </div>
                        <div className="mt-3">
                          {data.posts.slice(0, 2).map((post) => (
                            <CommunityPostRow
                              key={post.id}
                              post={post}
                              communityUrl={urls.community}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </TerritorySurface>
                ) : null}
                {!conceptMockEnabled && (data.highlights.length > 0 ||
                data.events.length > data.happeningSoon.length ||
                data.opportunities.length > 0 ||
                data.classifieds.length > 0) ? (
                  <TerritorySurface className="p-5 sm:p-6">
                    <div className="grid gap-x-8 md:grid-cols-2">
                      {data.highlights.slice(0, 2).map((highlight) => (
                        <HighlightRow key={highlight.id} highlight={highlight} />
                      ))}
                      {data.events
                        .filter(
                          (event) =>
                            !data.happeningSoon.some(
                              (happening) => happening.id === event.id,
                            ),
                        )
                        .slice(0, 2)
                        .map((event) => (
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
                ) : null}
              </div>
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
                    ? "Ainda não há atualizações recentes nesta cidade."
                    : "Ainda não há novidades públicas neste território."
                }
                primaryAction={{ label: "Explorar", href: urls.search }}
                secondaryAction={
                  isCityHome
                    ? undefined
                    : { label: `Ver ${cityName} inteira`, href: cityBaseUrl }
                }
                testId="territory-home-empty"
                compact
                tone="highlight"
              />
            )}
          </section>

          <section
            className="order-2 xl:col-start-1"
            aria-labelledby="nearby-title"
          >
            <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
              <h2
                id="nearby-title"
                className="font-heading text-xl font-bold leading-tight tracking-[-0.02em] text-territory-ink sm:text-2xl"
              >
                Explore por perto
              </h2>
              <span className="flex shrink-0 items-center gap-1.5">
                <Link
                  to={urls.map}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-territory-brand/45 px-3 text-sm font-semibold text-territory-ink hover:bg-territory-raised md:hidden"
                >
                  <Map className="h-4 w-4 text-territory-brand" aria-hidden="true" />
                  Mapa
                </Link>
                <Link
                  to={hasUsefulPlaces ? urls.business : urls.search}
                  className="hidden min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-territory-brand transition-colors hover:bg-territory-brand/10 hover:text-territory-brand-strong md:inline-flex"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </span>
            </div>
            {data.loading.usefulPlaces ? (
              <SectionSkeleton rows={2} />
            ) : hasUsefulPlaces ? (
              <div className="grid gap-x-8 sm:grid-cols-2">
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
              <TerritoryState
                icon={<Compass className="h-5 w-5" aria-hidden="true" />}
                title="Ainda não há lugares públicos para destacar."
                description="Nenhum lugar público disponível por enquanto. Use a busca ou o mapa."
                primaryAction={{ label: "Explorar", href: urls.search }}
                secondaryAction={
                  !isCityHome
                    ? { label: `Ver ${cityName} inteira`, href: cityBaseUrl }
                    : { label: "Abrir mapa", href: urls.map }
                }
                compact
              />
            )}
          </section>

          <section
            className="order-3 border-t border-territory-border pt-8 xl:col-start-1"
            aria-labelledby="discover-more-title"
          >
            {conceptMockEnabled ? (
              <>
                <div className="md:hidden">
                  <TerritorySectionHeading
                    id="discover-more-title"
                    title="Agenda e oportunidades"
                    description={undefined}
                  />
                  <Link
                    to={eventPublicRoutes.detailFromBase(
                      urls.events,
                      "concept-mock-roda-de-conversa",
                    )}
                    className="group flex min-h-[4.25rem] items-center gap-4 border-y border-territory-border py-3 transition-colors hover:bg-territory-raised/60"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-raised text-territory-brand">
                      <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-territory-ink group-hover:text-territory-brand">
                        Roda de conversa
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-territory-muted">
                        Neste domingo · Chapada
                      </span>
                    </span>
                    <ArrowRight
                      className="ml-auto h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
                <div className="hidden md:block">
                  <TerritorySectionHeading
                    id="discover-more-desktop-title"
                    title="Oportunidades do bairro"
                    description={undefined}
                  />
                  <div className="divide-y divide-territory-border border-y border-territory-border">
                    {[
                      {
                        label: "Aulas de reforço escolar",
                        description: "Educação · Chapada",
                        href: urls.education,
                        icon: GraduationCap,
                      },
                      {
                        label: "Serviços e trabalhos locais",
                        description: "Conheça as oportunidades",
                        href: urls.jobs,
                        icon: BriefcaseBusiness,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          className="group flex min-h-[4.25rem] items-center gap-4 py-3 transition-colors hover:bg-territory-raised/60"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-raised text-territory-brand">
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
                          <ArrowRight
                            className="ml-auto h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand"
                            aria-hidden="true"
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <TerritorySectionHeading
                  id="discover-more-title"
                  title="Oportunidades do bairro"
                  description={undefined}
                />
                <div className="divide-y divide-territory-border border-y border-territory-border">
                  {[
                    {
                      label: "Agenda do bairro",
                      description: "Eventos e encontros públicos.",
                      href: urls.events,
                      icon: CalendarDays,
                    },
                    {
                      label: "Vagas e oportunidades",
                      description: "O que ainda está disponível por perto.",
                      href: urls.jobs,
                      icon: BriefcaseBusiness,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="group flex min-h-[4.25rem] items-center gap-4 py-3 transition-colors hover:bg-territory-raised/60"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-raised text-territory-brand">
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
                        <ArrowRight
                          className="ml-auto h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5 group-hover:text-territory-brand"
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </section>

            </div>
          </div>

          <aside
            className="order-4 mt-6 space-y-6 xl:col-start-2 xl:row-start-1 xl:mt-0 xl:sticky xl:top-24"
            aria-label="Contexto e serviços do território"
          >
            <div className="hidden xl:block">
              <Suspense
                fallback={
                  <TerritorySurface
                    className="h-[21rem] animate-pulse bg-territory-raised"
                    aria-label="Carregando o mapa do território"
                  />
                }
              >
                <TerritoryMapPreview
                  resolved={resolved}
                  mapHref={urls.map}
                  territoryName={territoryName}
                  title="Seu território"
                />
              </Suspense>
            </div>

            <TerritorySurface className="p-5">
              <TerritorySectionHeading
                title="Agenda do bairro"
                description={undefined}
                href={urls.events}
                linkLabel="Ver agenda"
                className="mb-3"
              />
              {data.loading.worthKnowing ? (
                <SectionSkeleton rows={2} />
              ) : data.events.length > 0 ? (
                <div>
                  {data.events.slice(0, 2).map((event) => (
                    <AgendaRow
                      key={event.id}
                      event={event}
                      eventsBaseUrl={urls.events}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-territory-muted">
                  Ainda não há eventos publicados para {territoryName}.
                </p>
              )}
            </TerritorySurface>

            <Link
              to={isCommunityAvailable ? urls.community : urls.communityInterest}
              className="flex items-center gap-3 rounded-territory-highlight border border-territory-border bg-territory-raised p-4 transition-colors hover:border-territory-brand/30 hover:bg-territory-brand/10"
              data-testid="community-summary-section"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-brand/12 text-territory-brand">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-territory-ink">
                  Conheça os grupos da comunidade
                </span>
                <span className="mt-1 block text-xs leading-5 text-territory-muted">
                  {isCommunityAvailable
                    ? "Converse, troque ideias e fique por dentro."
                    : `Acompanhe a liberação em ${territoryName}.`}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
            </Link>
          </aside>
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
