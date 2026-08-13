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
      aria-label="Carregando informaÃ§Ãµes do territÃ³rio"
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
      aria-label="Atualizando esta seÃ§Ã£o"
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
          Evento Â· {formatEventDate(event.date)}
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
          Oportunidade Â· {opportunity.territory_name ?? "por perto"}
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
          Classificado Â· {formatPrice(classified.price)}
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
          <span aria-hidden="true">Â·</span>
          <span className="shrink-0">
            {formatRelativeDate(post.created_at)}
          </span>
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-6 text-foreground">
          {getPublicPostPreview(
            post.content,
            150,
            "ConteÃºdo sem resumo disponÃ­vel.",
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
          {business.category || "ComÃ©rcio local"}
          {business.rating > 0 ? ` Â· ${business.rating.toFixed(1)} â˜…` : ""}
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
          {service.category || "ServiÃ§o local"} Â·{" "}
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
  }ã_6¶‰žËkºwµç@Ü´ÄÀ¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µá°ˆ°(€€€€€€€€€€€€€€€€€€€€€…Ñ¥½¸¹Ñ½¹”°(€€€€€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÔÜ´Ôˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´Ì‰±½¬Ñ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹É½ÕÀµ¡½Ù•ÈéÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€í…Ñ¥½¸¹±…‰•±ô(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´Ä¡¥‘‘•¸Ñ•áÐµáÌ±•…‘¥¹œ´ÔÑ•áÐµµÕÑ•µ™½É•É½Õ¹Í´é‰±½¬ˆø(€€€€€€€€€€€€€€€€€€€í…Ñ¥½¸¹‘•ÍÉ¥ÁÑ¥½¹ô(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€ô¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€í‘…Ñ„¹±½…‘¥¹œ¹Ñ•ÉÉ¥Ñ½Éä€ü€ (€€€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”ô‰µÐ´àˆø(€€€€€€€€€€€€ñ!½µ•1½…‘¥¹œ€¼ø(€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€¤€è€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´àÉ¥…À´Ü±œéµÐ´ÄÀ±œéÉ¥µ½±Ìµmµ¥¹µ…à À°Ä¸ØÕ™È¥}µ¥¹µ…à ÈÁÉ•´°À¸á™È¥t±œé¥Ñ•µÌµÍÑ…ÉÐˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰½¹Ñ•¹ÑÌ±œé½°µÍÑ…ÉÐ´Ä±œé‰±½¬±œéÍÁ…”µä´Üˆø(€€€€€€€€€€€€€€ñÍ•Ñ¥½¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰½É‘•È´Äˆ(€€€€€€€€€€€€€€€…É¥„µ±…‰•±±•‘‰äô‰Ý½ÉÑ µ­¹½Ý¥¹œµÑ¥Ñ±”ˆ(€€€€€€€€€€€€€€€‘…Ñ„µÑ•ÍÑ¥ô‰Ý½ÉÑ µ­¹½Ý¥¹œµÍ•Ñ¥½¸ˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñM•Ñ¥½¹!•…‘•È(€€€€€€€€€€€€€€€€€Ñ¥Ñ±”õíÝ½ÉÑ¡-¹½Ý¥¹Q¥Ñ±•ô(€€€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸õíÝ½ÉÑ¡-¹½Ý¥¹•ÍÉ¥ÁÑ¥½¹ô(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€í‘…Ñ„¹±½…‘¥¹œ¹Ý½ÉÑ¡-¹½Ý¥¹œ€ü€ (€€€€€€€€€€€€€€€€€€ñ!½µ•M•Ñ¥½¹1½…‘¥¹œ€¼ø(€€€€€€€€€€€€€€€€¤€è¡…Í]½ÉÑ¡-¹½Ý¥¹œ€ü€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´ÌÍ´éÉ¥µ½±Ì´Èˆø(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹¡¥¡±¥¡ÑÌ¹Í±¥” À°€È¤¹µ…À ¡¡¥¡±¥¡Ð¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñ!¥¡±¥¡ÑI½Ü­•äõí¡¥¡±¥¡Ð¹¥‘ô¡¥¡±¥¡Ðõí¡¥¡±¥¡Ñô€¼ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹•Ù•¹ÑÌ¹Í±¥” À°€È¤¹µ…À ¡•Ù•¹Ð¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñÙ•¹ÑI½Ü(€€€€€€€€€€€€€€€€€€€€€€€­•äõí•Ù•¹Ð¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€•Ù•¹Ðõí•Ù•¹Ñô(€€€€€€€€€€€€€€€€€€€€€€€•Ù•¹ÑÍ	…Í•UÉ°õíÕÉ±Ì¹•Ù•¹ÑÍô(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹½ÁÁ½ÉÑÕ¹¥Ñ¥•Ì¹Í±¥” À°€È¤¹µ…À ¡½ÁÁ½ÉÑÕ¹¥Ñä¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñ=ÁÁ½ÉÑÕ¹¥ÑåI½Ü(€€€€€€€€€€€€€€€€€€€€€€€­•äõí½ÁÁ½ÉÑÕ¹¥Ñä¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€½ÁÁ½ÉÑÕ¹¥Ñäõí½ÁÁ½ÉÑÕ¹¥Ñåô(€€€€€€€€€€€€€€€€€€€€€€€©½‰ÍUÉ°õíÕÉ±Ì¹©½‰Íô(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹±…ÍÍ¥™¥•‘Ì¹Í±¥” À°€È¤¹µ…À ¡±…ÍÍ¥™¥•¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñ±…ÍÍ¥™¥•‘I½Ü(€€€€€€€€€€€€€€€€€€€€€€€­•äõí±…ÍÍ¥™¥•¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ¥™¥•õí±…ÍÍ¥™¥•‘ô(€€€€€€€€€€€€€€€€€€€€€€€™…±±‰…­!É•˜õíÕÉ±Ì¹±…ÍÍ¥™¥•‘Íô(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñMÕÉ™…”(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰À´ØÍ´éÀ´àˆ(€€€€€€€€€€€€€€€€€€€‘…Ñ„µÑ•ÍÑ¥ô‰Ñ•ÉÉ¥Ñ½Éäµ¡½µ”µ•µÁÑäˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°…À´ÔÍ´é™±•àµÉ½ÜÍ´é¥Ñ•µÌµ•¹Ñ•ÈÍ´é©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€€€€€í¥Í¥Ñå!½µ”(€€€€€€€€€€€€€€€€€€€€€€€€€€€€ü€‰¥¹‘„»¼£„…ÑÕ…±¥é‡ŸÕ•ÌÉ••¹Ñ•ÌÁ…É„‘•ÍÑ……È¹„¥‘…‘”¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€è€‰¥¹‘„£„Á½Õ„…Ñ¥Ù¥‘…‘”É••¹Ñ”É•¥ÍÑÉ…‘„Á½È…ÅÕ¤¸‰ô(€€€€€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´Èµ…àµÜµá°Ñ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµµÕÑ•µ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€€€€€í¥Í¥Ñå!½µ”(€€€€€€€€€€€€€€€€€€€€€€€€€€€€ü€‰!½µ”»¼½µÁ±•Ñ„•ÍÍ”•ÍÁ‡¼½´½¹Ñ—é‘¼™¥Óµ¥¼¸áÁ±½É”•µÁÉ•Í…Ì°Í•ÉÙ§½Ì”…»é¹¥½ÌÃé‰±¥½Ì‘”M…±Ù…‘½È¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€è€‰!½µ”»¼½µÁ±•Ñ„•ÍÍ”•ÍÁ‡¼½´½¹Ñ—é‘¼™¥Óµ¥¼¸áÁ±½É”½ÌÍ•ÉÙ§½Ì‘¥ÍÁ½»µÙ•¥Ì½Ô…µÁ±¥”„Ù¥Ï¼Á…É„„¥‘…‘”¸‰ô(€€€€€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àÍ¡É¥¹¬´À™±•àµÝÉ…À…À´Èˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€€€€€Ñ¼õíÕÉ±Ì¹Í•…É¡ô(€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÀ¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ™Õ±°‰œµÁÉ¥µ…ÉäÁà´ÐÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÁÉ¥µ…Éäµ™½É•É½Õ¹ˆ(€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€áÁ±½É…È(€€€€€€€€€€€€€€€€€€€€€€€€€€ñ½µÁ…ÍÌ±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€€€€€€ì…¥Í¥Ñå!½µ”€ü€ (€€€€€€€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€€€€€€€Ñ¼õí¥Ñå	…Í•UÉ±ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÀ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•Èµ‰½É‘•È‰œµ…ÉÁà´ÐÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€Y•Èí¥Ñå9…µ•ô¥¹Ñ•¥É„(€€€€€€€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€€€€€€€¤€è¹Õ±±ô(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½MÕÉ™…”ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€€€€€€€ñÍ•Ñ¥½¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰½É‘•È´Ìˆ(€€€€€€€€€€€€€€€…É¥„µ±…‰•±±•‘‰äô‰½µµÕ¹¥ÑäµÍÕµµ…ÉäµÑ¥Ñ±”ˆ(€€€€€€€€€€€€€€€‘…Ñ„µÑ•ÍÑ¥ô‰½µµÕ¹¥ÑäµÍÕµµ…ÉäµÍ•Ñ¥½¸ˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñMÕÉ™…”±…ÍÍ9…µ”ô‰À´ÔÍ´éÀ´Øˆø(€€€€€€€€€€€€€€€€€€ñM•Ñ¥½¹!•…‘•È(€€€€€€€€€€€€€€€€€€€Ñ¥Ñ±”õì(€€€€€€€€€€€€€€€€€€€€€¥Í¥Ñå!½µ”(€€€€€€€€€€€€€€€€€€€€€€€€ü½µµÕ¹¥Ñä‘”€‘íÑ•ÉÉ¥Ñ½Éå9…µ•õ€(€€€€€€€€€€€€€€€€€€€€€€€€è½µµÕ¹¥Ñä•´€‘íÑ•ÉÉ¥Ñ½Éå9…µ•õ€(€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸õì(€€€€€€€€€€€€€€€€€€€€€¥Í¥Ñå!½µ”(€€€€€€€€€€€€€€€€€€€€€€€€ü€‰½¹Ù•ÉÍ…ÌÃé‰±¥…Ì‘½ÌÑ•ÉÉ¥ÓÍÉ¥½Ì‘”M…±Ù…‘½È°Í•´½¹™Õ¹‘¥È¥‘…‘”½´‰…¥ÉÉ¼¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€€è€‰…µ…‘„‘”Á…ÉÑ¥¥Á‡Ÿ¼±½…°è½¹Ù•ÉÍ…Ì°½±…‰½É‡Ÿ¼”Ù¥‘„½µÕ¹¥Ó…É¥„¸ˆ(€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€¡É•˜õíÕÉ±Ì¹½µµÕ¹¥Ñåô(€€€€€€€€€€€€€€€€€€€±¥¹­1…‰•°ô‰‰É¥È½µµÕ¹¥Ñäˆ(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€í‘…Ñ„¹±½…‘¥¹œ¹½µµÕ¹¥Ñä€ü€ (€€€€€€€€€€€€€€€€€€€€ñ!½µ•M•Ñ¥½¹1½…‘¥¹œ€¼ø(€€€€€€€€€€€€€€€€€€¤€è‘…Ñ„¹Á½ÍÑÌ¹±•¹Ñ €ø€À€ü€ (€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´ÌÍ´éÉ¥µ½±Ì´Èˆø(€€€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹Á½ÍÑÌ¹Í±¥” À°€Ð¤¹µ…À ¡Á½ÍÐ¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€€€ñ½µµÕ¹¥ÑåA½ÍÑI½Ü(€€€€€€€€€€€€€€€€€€€€€€€€€­•äõíÁ½ÍÐ¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€€€Á½ÍÐõíÁ½ÍÑô(€€€€€€€€€€€€€€€€€€€€€€€€€½µµÕ¹¥ÑåUÉ°õíÕÉ±Ì¹½µµÕ¹¥Ñåô(€€€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É½Õ¹‘•´Éá°‰œµµÕÑ•¼ÔÔÀ´Ôˆø(€€€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€€€9•¹¡Õµ„½¹Ù•ÉÍ„É••¹Ñ”¹•ÍÑ”½¹Ñ•áÑ¼¸(€€€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÄÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµµÕÑ•µ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€€€Y½¨…¥¹‘„Á½‘”…½µÁ…¹¡…È„½µµÕ¹¥ÑäÃé‰±¥„¸(€€€€€€€€€€€€€€€€€€€€€€€A…ÉÑ¥¥Á…È‘•Á•¹‘”‘¼Í•ÔÁ•É™¥°°Ûµ¹Õ±¼Ñ•ÉÉ¥Ñ½É¥…°”(€€€€€€€€€€€€€€€€€€€€€€€‘…ÌÁ½±¥¥•Ì…ÑÕ…¥Ì¸(€€€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ð™±•à™±•àµÝÉ…À…À´Èˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€€€€€Ñ¼õíÕÉ±Ì¹½µµÕ¹¥Ñåô(€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÀ¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•Èµ‰½É‘•È‰œµ…ÉÁà´ÐÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹¡½Ù•Èé‰½É‘•ÈµÁÉ¥µ…Éä¼ÌÀˆ(€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€Y•È½µµÕ¹¥Ñä(€€€€€€€€€€€€€€€€€€€€€€€€€€ñÉÉ½ÝI¥¡Ð±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€€€€€€í…¹É•…Ñ•A½ÍÐ€ü€ (€€€€€€€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€€€€€€€Ñ¼ôˆ½¹½Ù¼µÁ½ÍÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÀ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ™Õ±°‰œµÁÉ¥µ…ÉäÁà´ÐÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÁÉ¥µ…Éäµ™½É•É½Õ¹ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€AÕ‰±¥…È(€€€€€€€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€€€€€€€¤€è¹Õ±±ô(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€ð½MÕÉ™…”ø(€€€€€€€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñ…Í¥‘”(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰½É‘•È´ÈÍÁ…”µä´Ø±œé½É‘•Èµ¹½¹”±œé½°µÍÑ…ÉÐ´È±œéÉ½ÜµÍÑ…ÉÐ´Ä±œéÍÑ¥­ä±œéÑ½À´ÈÐˆ(€€€€€€€€€€€€€…É¥„µ±…‰•°ô‰M•ÉÙ§½Ì”½¹Ñ•áÑ¼‘¼Ñ•ÉÉ¥ÓÍÉ¥¼ˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñMÕÉ™…”±…ÍÍ9…µ”ô‰À´ÐÍ´éÀ´Ôˆø(€€€€€€€€€€€€€€€€ñM•Ñ¥½¹!•…‘•È(€€€€€€€€€€€€€€€€€Ñ¥Ñ±”ô‰µÁÉ•Í…Ì”Í•ÉÙ§½ÌƒéÑ•¥Ìˆ(€€€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸õì(€€€€€€€€€€€€€€€€€€€¡…ÍUÍ•™Õ±A±…•Ì(€€€€€€€€€€€€€€€€€€€€€€ü¥Í¥Ñå!½µ”(€€€€€€€€€€€€€€€€€€€€€€€€ü€‰…‘…ÍÑÉ½ÌÃé‰±¥½Ì•¹½¹ÑÉ…‘½Ì¹½ÌÑ•ÉÉ¥ÓÍÉ¥½Ì‘”M…±Ù…‘½È¸ˆ(€€€€€€€€€€€€€€€€€€€€€€€€è€‰…‘…ÍÑÉ½ÌÃé‰±¥½Ì‘¥ÍÁ½»µÙ•¥Ì¹•ÍÑ”Ñ•ÉÉ¥ÓÍÉ¥¼¸ˆ(€€€€€€€€€€€€€€€€€€€€€€èÕ¹‘•™¥¹•(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€¡É•˜õí¡…ÍUÍ•™Õ±A±…•Ì€üÕÉ±Ì¹‰ÕÍ¥¹•ÍÌ€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€í‘…Ñ„¹±½…‘¥¹œ¹ÕÍ•™Õ±A±…•Ì€ü€ (€€€€€€€€€€€€€€€€€€ñ!½µ•M•Ñ¥½¹1½…‘¥¹œÉ½ÝÌõìÅô€¼ø(€€€€€€€€€€€€€€€€¤€è¡…ÍUÍ•™Õ±A±…•Ì€ü€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Äˆø(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹‰ÕÍ¥¹•ÍÍ•Ì¹Í±¥” À°€Ð¤¹µ…À ¡‰ÕÍ¥¹•ÍÌ¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€ñ	ÕÍ¥¹•ÍÍ%Ñ•´(€€€€€€€€€€€€€€€€€€€€€€€­•äõí‰ÕÍ¥¹•ÍÌ¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€‰ÕÍ¥¹•ÍÌõí‰ÕÍ¥¹•ÍÍô(€€€€€€€€€€€€€€€€€€€€€€€¡É•˜õí•Ñ	ÕÍ¥¹•ÍÍ!É•˜ (€€€€€€€€€€€€€€€€€€€€€€€€€‰ÕÍ¥¹•ÍÌ°(€€€€€€€€€€€€€€€€€€€€€€€€€ÕÉ±Ì¹‰ÕÍ¥¹•ÍÌ°(€€€€€€€€€€€€€€€€€€€€€€€€€…ÁÁUÉ±Ì¹‰ÕÍ¥¹•ÍÌ¹…¹½¹¥…°°(€€€€€€€€€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€í‘…Ñ„¹Í•ÉÙ¥•Ì(€€€€€€€€€€€€€€€€€€€€€€¹Í±¥” À°5…Ñ ¹µ…à À°€Ø€´‘…Ñ„¹‰ÕÍ¥¹•ÍÍ•Ì¹±•¹Ñ ¤¤(€€€€€€€€€€€€€€€€€€€€€€¹µ…À ¡Í•ÉÙ¥”¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€€€ñM•ÉÙ¥•%Ñ•´(€€€€€€€€€€€€€€€€€€€€€€€€€­•äõíÍ•ÉÙ¥”¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€€€Í•ÉÙ¥”õíÍ•ÉÙ¥•ô(€€€€€€€€€€€€€€€€€€€€€€€€€¡É•˜õíÕÉ±Ì¹Í•ÉÙ¥•Íô(€€€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É½Õ¹‘•´Éá°‰œµµÕÑ•¼ÔÔÀ´ÔÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµµÕÑ•µ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€¥¹‘„»¼£„•µÁÉ•Í…Ì½ÔÁÉ½™¥ÍÍ¥½¹…¥ÌÃé‰±¥½ÌÍÕ™¥¥•¹Ñ•Ì(€€€€€€€€€€€€€€€€€€€Á…É„‘•ÍÑ……È…ÅÕ¤¸(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½MÕÉ™…”ø((€€€€€€€€€€€€€€ñMÕÉ™…”±…ÍÍ9…µ”ô‰½Ù•É™±½Üµ¡¥‘‘•¸À´ÔÍ´éÀ´Øˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµÍÑ…ÉÐ©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ðˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸ÄÉ•µtÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€€€M•Ô½¹Ñ•áÑ¼(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€ñ È±…ÍÍ9…µ”ô‰µÐ´È™½¹Ðµ‘¥ÍÁ±…äÑ•áÐµá°™½¹ÐµÍ•µ¥‰½±ˆø(€€€€€€€€€€€€€€€€€€€€€íÑ•ÉÉ¥Ñ½Éå9…µ•ô(€€€€€€€€€€€€€€€€€€€€ð½ Èø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÄÑ•áÐµÍ´Ñ•áÐµµÕÑ•µ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€í±½…Ñ¥½¹1¥¹•ô(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™±•à ´ÄÄÜ´ÄÄÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•´Éá°‰œµÁÉ¥µ…Éä¼ÄÀÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€€ñ5…ÁA¥¸±…ÍÍ9…µ”ô‰ ´ÔÜ´Ôˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´ÔÉ¥É¥µ½±Ì´Ì…À´Èˆø(€€€€€€€€€€€€€€€€€íl(€€€€€€€€€€€€€€€€€€€l‰µÁÉ•Í…Ìˆ°ÕÉ±Ì¹‰ÕÍ¥¹•ÍÍt°(€€€€€€€€€€€€€€€€€€€l‰M•ÉÙ§½Ìˆ°ÕÉ±Ì¹Í•ÉÙ¥•Ít°(€€€€€€€€€€€€€€€€€€€l‰»é¹¥½Ìˆ°ÕÉ±Ì¹±…ÍÍ¥™¥•‘Ít°(€€€€€€€€€€€€€€€€€t¹µ…À ¡m±…‰•°°¡É•™t¤€ôø€ (€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€­•äõí±…‰•±ô(€€€€€€€€€€€€€€€€€€€€€Ñ¼õí¡É•™ô(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰É½Õ¹‘•´Éá°‰œµµÕÑ•¼ÔÔÀ´ÌÑ•áÐµ•¹Ñ•ÈÑ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹ÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰œµÁÉ¥µ…Éä¼ÄÀ¡½Ù•ÈéÑ•áÐµÁÉ¥µ…Éäˆ(€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€í±…‰•±ô(€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´ÌÉ¥…À´Èˆø(€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€Ñ¼õíÕÉ±Ì¹µ…Áô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÄ¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µá°‰½É‘•È‰½É‘•Èµ‰½É‘•È‰œµ…ÉÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹¡½Ù•Èé‰½É‘•ÈµÁÉ¥µ…Éä¼ÌÀˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñ5…À±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€€Y•È¹¼µ…Á„(€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€ì…¥Í¥Ñå!½µ”€ü€ (€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€Ñ¼õí¥Ñå	…Í•UÉ±ô(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à ´ÄÄ¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µá°‰œµµÕÑ•Ñ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹¡½Ù•Èé‰œµµÕÑ•¼àÀˆ(€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€µÁ±¥…ÈÁ…É„í¥Ñå9…µ•ô(€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€¤€è¹Õ±±ô(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½MÕÉ™…”ø(€€€€€€€€€€€€ð½…Í¥‘”ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô((€€€€€€€í‘…Ñ„¹¡…ÍÉÉ½È€ü€ (€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€±…ÍÍ9…µ”ô‰µÐ´ÜÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•Èµ…µ‰•È´ÈÀÀ‰œµ…µ‰•È´ÔÀÁà´ÐÁä´ÌÑ•áÐµÍ´Ñ•áÐµ…µ‰•È´äÔÀˆ(€€€€€€€€€€€É½±”ô‰ÍÑ…ÑÕÌˆ(€€€€€€€€€€ø(€€€€€€€€€€€A…ÉÑ”‘…Ì¥¹™½Éµ‡ŸÕ•Ì»¼ÃÑ‘”Í•È…ÑÕ…±¥é…‘„¸<É•ÍÑ…¹Ñ”‘„!½µ”(€€€€€€€€€€€½¹Ñ¥¹Õ„‘¥ÍÁ½»µÙ•°Í•´ÍÕ‰ÍÑ¥ÑÕ¥È‘…‘½Ì…ÕÍ•¹Ñ•ÌÁ½È½¹Ñ—é‘¼(€€€€€€€€€€€™¥Óµ¥¼¸(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¤€è¹Õ±±ô((€€€€€€€€ñÍ•Ñ¥½¸(€€€€€€€€€±…ÍÍ9…µ”ô‰µÐ´ÄÈ‰½É‘•ÈµÐ‰½É‘•Èµ‰½É‘•È¼ÜÀÁÐ´àˆ(€€€€€€€€€…É¥„µ±…‰•±±•‘‰äô‰‘¥Í½Ù•Èµµ½É”µÑ¥Ñ±”ˆ(€€€€€€€€ø(€€€€€€€€€€ñM•Ñ¥½¹!•…‘•È(€€€€€€€€€€€Ñ¥Ñ±”ô‰•Í½‰É¥Èµ…¥Ìˆ(€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸õí=ÕÑÉ…Ì™½Éµ…Ì‘”•áÁ±½É…È€‘íÑ•ÉÉ¥Ñ½Éå9…µ•ô¹ô(€€€€€€€€€€¼ø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´ÌÍ´éÉ¥µ½±Ì´È±œéÉ¥µ½±Ì´Ðˆø(€€€€€€€€€€€íl(€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€±…‰•°è€‰áÁ±½É…È”‰ÕÍ…Èˆ°(€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸è€‰¹½¹ÑÉ”±Õ…É•Ì°Í•ÉÙ§½Ì”½¹Ñ—é‘¼¸ˆ°(€€€€€€€€€€€€€€€¡É•˜èÕÉ±Ì¹Í•…É °(€€€€€€€€€€€€€€€¥½¸èM•…É °(€€€€€€€€€€€€€ô°(€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€±…‰•°è€‰Ù•¹Ñ½Ìˆ°(€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸è€‰•¹‘„Û…±¥‘„‘¼Ñ•ÉÉ¥ÓÍÉ¥¼¸ˆ°(€€€€€€€€€€€€€€€¡É•˜èÕÉ±Ì¹•Ù•¹ÑÌ°(€€€€€€€€€€€€€€€¥½¸è…±•¹‘…É…åÌ°(€€€€€€€€€€€€€ô°(€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€±…‰•°è€‰Y……Ì”½Á½ÉÑÕ¹¥‘…‘•Ìˆ°(€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸è€‰<ÅÕ”…¥¹‘„•ÍÓ„‘¥ÍÁ½»µÙ•°Á½ÈÁ•ÉÑ¼¸ˆ°(€€€€€€€€€€€€€€€¡É•˜èÕÉ±Ì¹©½‰Ì°(€€€€€€€€€€€€€€€¥½¸è	É¥•™…Í•	ÕÍ¥¹•ÍÌ°(€€€€€€€€€€€€€ô°(€€€€€€€€€€€€€ì(€€€€€€€€€€€€€€€±…‰•°è€‰½·¥É¥¼±½…°ˆ°(€€€€€€€€€€€€€€€‘•ÍÉ¥ÁÑ¥½¸è€‰µÁÉ•Í…Ì”ÁÉ½™¥ÍÍ¥½¹…¥Ì…‘…ÍÑÉ…‘½Ì¸ˆ°(€€€€€€€€€€€€€€€¡É•˜èÕÉ±Ì¹‰ÕÍ¥¹•ÍÌ°(€€€€€€€€€€€€€€€¥½¸è	Õ¥±‘¥¹œÈ°(€€€€€€€€€€€€€ô°(€€€€€€€€€€€t¹µ…À ¡¥Ñ•´¤€ôøì(€€€€€€€€€€€€€½¹ÍÐ%½¸€ô¥Ñ•´¹¥½¸ì(€€€€€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€­•äõí¥Ñ•´¹±…‰•±ô(€€€€€€€€€€€€€€€€€Ñ¼õí¥Ñ•´¹¡É•™ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰É½ÕÀ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÐÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•Èµ‰½É‘•È¼ÜÔ‰œµ…ÉÀ´ÐÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰½É‘•ÈµÁÉ¥µ…Éä¼ÌÀ¡½Ù•ÈéÍ¡…‘½ÜµÍ´ˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™±•à ´ÄÄÜ´ÄÄÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µá°‰œµÁÉ¥µ…Éä¼ÄÀÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÔÜ´Ôˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ¥¸µÜ´Àˆø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‰±½¬™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ™½É•É½Õ¹É½ÕÀµ¡½Ù•ÈéÑ•áÐµÁÉ¥µ…Éäˆø(€€€€€€€€€€€€€€€€€€€€€í¥Ñ•´¹±…‰•±ô(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´Ä‰±½¬Ñ•áÐµáÌ±•…‘¥¹œ´ÔÑ•áÐµµÕÑ•µ™½É•É½Õ¹ˆø(€€€€€€€€€€€€€€€€€€€€€í¥Ñ•´¹‘•ÍÉ¥ÁÑ¥½¹ô(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€ô¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€ð½µ…¥¸ø(€€€€ð½‘¥Øø(€€¤ì)ô