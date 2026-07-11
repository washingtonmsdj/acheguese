import React, { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  Bookmark,
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  CircleHelp,
  Compass,
  FileQuestion,
  Flame,
  Heart,
  Home,
  Info,
  Lock,
  LogIn,
  MapPin,
  Megaphone,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  Store,
  Tag,
  UserPlus,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import bairroChapada from "@/assets/bairro-chapada.jpg";
import bairroNordeste from "@/assets/bairro-nordeste.jpg";
import bairroOndina from "@/assets/bairro-ondina.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";
import bairroSantaCruz from "@/assets/bairro-santa-cruz.jpg";
import bairroStiep from "@/assets/bairro-stiep.jpg";
import bairroValePedrinhas from "@/assets/bairro-vale-pedrinhas.jpg";
import heroSalvador from "@/assets/hero-cidade-salvador-real.jpg";
import neighborhoodFeatured from "@/assets/neighborhood-featured.jpg";
import personaMorador from "@/assets/persona-morador.jpg";
import {
  isLaunchCommunityPostEnabled,
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { useAdDelivery, SponsoredAdCard } from "@/core/business/promotions";
import { useBusinessUrls } from "@/core/business/hooks/useBusinessUrls";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";
import {
  CommunityGroupsService,
  type GroupRow,
} from "@/core/community/services/CommunityGroupsService";
import { COMMUNITY_FEED_HEADER_FILTERS } from "@/core/community/utils/communityFeedTab";
import { LandingFeaturedService, type FeaturedBusiness } from "@/core/landing/services/LandingFeaturedService";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { useCommunityUrls } from "@/core/routing/hooks/useCommunityUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import {
  COMMUNITY_OVERVIEW_VISUAL_FIXTURE,
  COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE,
} from "./communityOverviewVisualFixture";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import {
  eventRuntimeService,
  type PublicEvent,
} from "@/core/verticals/events";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type CommunityOverviewMode = "public" | "member";

interface CommunityOverviewSurfaceProps {
  resolved?: ResolvedTerritory;
  territoryName: string;
  territoryFilter: TerritoryFilter;
  activeHeaderFilter: TerritorialFeedChannel;
  onHeaderFilterChange: (filter: TerritorialFeedChannel) => void;
  onRequireLogin: () => void;
  loginHref: string;
  publishHref: string;
  communityId?: string | null;
  communityProfile?: TerritorialCommunityProfile | null;
  mode?: CommunityOverviewMode;
  onOpenCreatePost?: () => void;
  children?: React.ReactNode;
}

interface ModuleLink {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  isActive?: boolean;
  surface?: LaunchSurfaceKey;
}

const COMMUNITY_HERO_IMAGES: Record<string, string> = {
  barra: bairroOndina,
  chapada: bairroChapada,
  "complexo-do-nordeste-de-amaralina": bairroNordeste,
  nordeste: bairroNordeste,
  ondina: bairroOndina,
  pituba: bairroPituba,
  "rio-vermelho": bairroRioVermelho,
  "santa-cruz": bairroSantaCruz,
  stiep: bairroStiep,
  "vale-das-pedrinhas": bairroValePedrinhas,
};

const COMMUNITY_RULES = [
  "Respeite todos os membros e moradores.",
  "Nada de spam, golpe ou autopromocao excessiva.",
  "Nao publique dados pessoais de terceiros.",
  "Mantenha o foco na comunidade local.",
];

function formatSlugLabel(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getResolvedSlug(resolved?: ResolvedTerritory): string | null {
  if (resolved?.kind === "group") return resolved.group.slug;
  if (resolved?.kind === "location") return resolved.location.slug;
  return null;
}

function getHeroImage(resolved?: ResolvedTerritory): string {
  const slug = getResolvedSlug(resolved);
  if (slug && COMMUNITY_HERO_IMAGES[slug]) return COMMUNITY_HERO_IMAGES[slug];
  if (resolved?.kind === "location" && resolved.location.type === "city") return heroSalvador;
  return neighborhoodFeatured;
}

function getTerritoryLocationLabel(resolved?: ResolvedTerritory): string {
  if (resolved?.kind === "group") return "Comunidade territorial";
  if (resolved?.kind === "location") {
    const stateCode =
      typeof resolved.location.metadata?.state_code === "string"
        ? resolved.location.metadata.state_code.toUpperCase()
        : null;
    const parent = stateCode ? `, ${stateCode}` : "";
    return `${resolved.location.name}${parent}`;
  }
  return "Comunidade local";
}

function getCommunityLocationLine(resolved?: ResolvedTerritory): string {
  if (resolved?.kind === "group") return "Comunidade territorial";
  if (resolved?.kind !== "location") return "Comunidade local";

  const stateCode =
    typeof resolved.location.metadata?.state_code === "string"
      ? resolved.location.metadata.state_code.toUpperCase()
      : null;
  const pathParts = resolved.location.geographic_path.split("/").filter(Boolean);
  const pathState = pathParts[1]?.toUpperCase() ?? null;
  const citySlug = pathParts[2] ?? null;
  const cityName =
    resolved.location.type === "city"
      ? resolved.location.name
      : citySlug
        ? formatSlugLabel(citySlug)
        : resolved.location.full_name || resolved.location.name;
  const state = stateCode ?? pathState;

  return state ? `${cityName}, ${state}` : cityName;
}

function getCommunityTitle(
  territoryName: string,
  communityProfile?: TerritorialCommunityProfile | null,
): string {
  const profileName = communityProfile?.name?.trim();
  const normalizedProfileName = profileName?.replace(/^Achegue-se\s+/i, "");

  if (
    normalizedProfileName &&
    !/^a comunidade (da|de|do) .+ esta chegando$/i.test(normalizedProfileName)
  ) {
    return normalizedProfileName;
  }

  return territoryName;
}

function getCommunityDescription(
  territoryName: string,
  communityProfile?: TerritorialCommunityProfile | null,
): string {
  const candidates = [
    communityProfile?.hero_subtitle?.trim(),
    communityProfile?.headline?.trim(),
    communityProfile?.description?.trim(),
  ].filter(Boolean) as string[];
  const publicDescription = candidates.find(
    (candidate) =>
      !/cadastre seu interesse|ser avisado|achegue-se .*est[aá] chegando|comunidade .*est[aá] chegando|^em breve\b/i.test(
        candidate,
      ),
  );

  return (
    publicDescription ||
    `Acompanhe empresas, classificados, gastronomia, serviços e conversas relevantes de ${territoryName}.`
  );
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  if (value >= 1000) {
    const formatted = new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: value >= 10000 ? 0 : 1,
    }).format(value / 1000);
    return `${formatted} mil`;
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPublicPostDate(value: string | null | undefined): string {
  if (!value) return "agora";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "agora";

  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;

  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(timestamp),
  );
}

function getEventDateParts(value: string): { day: string; month: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "---", time: "Horario a confirmar" };
  }

  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase(),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function getPublicPostAuthor(post: unknown): string {
  if (!post || typeof post !== "object") return "Morador";
  const record = post as {
    author_name?: string | null;
    author?: { display_name?: string | null } | null;
  };
  return record.author_name?.trim() || record.author?.display_name?.trim() || "Morador";
}

function getPublicPostTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "alerta":
      return "Alerta";
    case "recomendacao":
      return "Recomendacao";
    case "enquete":
      return "Enquete";
    case "pergunta":
      return "Pergunta";
    case "aviso":
      return "Aviso";
    case "achados":
      return "Achados";
    case "desapego":
      return "Classificado";
    default:
      return "Discussao";
  }
}

function getPublicPostTypeIcon(type: string | null | undefined): React.ElementType {
  switch (type) {
    case "alerta":
      return Megaphone;
    case "recomendacao":
      return BadgeCheck;
    case "pergunta":
      return CircleHelp;
    case "aviso":
      return Megaphone;
    case "desapego":
      return Tag;
    default:
      return MessageCircle;
  }
}

function buildBusinessHref(
  business: FeaturedBusiness,
  canonicalUrl: (ctx: {
    id: string;
    slug: string;
    is_premium?: boolean;
    geographic_path: string;
  }) => string,
): string | null {
  if (!business.slug || !business.geographic_path) return null;

  try {
    return canonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
  } catch {
    return null;
  }
}

function normalizeCategoryLabel(value?: string | null): string {
  if (!value) return "Local";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EventPreviewItem({ event }: { event: PublicEvent }) {
  const dateParts = getEventDateParts(event.date);

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-black/24 text-center">
          <span className="text-lg font-bold leading-none text-white">{dateParts.day}</span>
          <span className="mt-1 text-[10px] font-semibold uppercase text-white/48">
            {dateParts.month}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{event.title}</p>
          <p className="mt-1 truncate text-xs text-teal-200">
            {normalizeCategoryLabel(event.category)}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/54">
            {dateParts.time}
            {event.location ? ` - ${event.location}` : ""}
          </p>
        </div>
      </div>
    </article>
  );
}

function getGroupMembersCount(group: GroupRow): number {
  if (typeof group.members_count === "number" && Number.isFinite(group.members_count)) {
    return group.members_count;
  }

  if (typeof group.members_count === "string") {
    const parsed = Number(group.members_count);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(group.members_count) && group.members_count[0]) {
    const count = group.members_count[0].count;
    return Number.isFinite(count) ? count : 0;
  }

  return 0;
}

function GroupPreviewItem({ group, href }: { group: GroupRow; href: string }) {
  const membersCount = getGroupMembersCount(group);

  return (
    <Link
      to={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-white/[0.055]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/12 text-teal-200">
        <Users className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{group.name}</span>
        <span className="block truncate text-xs text-white/52">
          {normalizeCategoryLabel(group.category)} - {formatCount(membersCount)} membros
        </span>
      </span>
      <span className="shrink-0 rounded-lg border border-teal-300/25 px-2 py-1 text-xs font-semibold text-teal-200">
        Entrar
      </span>
    </Link>
  );
}

type DiscussionPreviewPost = {
  id: string;
  type?: string | null;
  content?: string | null;
  created_at?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  author_name?: string | null;
};

function getPostEngagement(post: DiscussionPreviewPost): number {
  return (post.comments_count ?? 0) * 2 + (post.likes_count ?? 0);
}

function DiscussionPreviewItem({ post }: { post: DiscussionPreviewPost }) {
  const Icon = getPublicPostTypeIcon(post.type);

  return (
    <a
      href={`#post-${post.id}`}
      className="group block rounded-xl px-1.5 py-1 transition-colors hover:bg-white/[0.055]"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-300/10 text-amber-300">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 text-sm font-semibold leading-5 text-white/84">
            {getPublicPostPreview(post.content, 76)}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-white/42">
            <span>{post.comments_count ?? 0} respostas</span>
            <span aria-hidden="true">-</span>
            <span>{formatPublicPostDate(post.created_at)}</span>
          </span>
        </span>
      </div>
    </a>
  );
}

function SurfacePanel({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl border border-white/10 bg-[#071922]/88 p-4 text-white shadow-xl shadow-black/10 backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {actionHref && actionLabel ? (
        <Link
          to={actionHref}
          className="shrink-0 text-xs font-semibold text-teal-300 transition-colors hover:text-teal-200"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function ModuleNavLink({
  item,
  className,
}: {
  item: ModuleLink;
  className: string;
}) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </>
  );

  if (item.href.startsWith("#")) {
    return (
      <a href={item.href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {content}
    </Link>
  );
}

function EmptyCommunityState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.03] px-3 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-300/12 text-teal-200">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-white/52">{description}</p>
          {ctaHref && ctaLabel ? (
            <Link
              to={ctaHref}
              className="mt-3 inline-flex min-h-8 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-teal-200 transition-colors hover:bg-white/[0.08]"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CommunityOverviewSurface({
  resolved,
  territoryName,
  territoryFilter,
  activeHeaderFilter,
  onHeaderFilterChange,
  onRequireLogin,
  loginHref,
  publishHref,
  communityId = null,
  communityProfile = null,
  mode = "public",
  onOpenCreatePost,
  children,
}: CommunityOverviewSurfaceProps) {
  const routeLocation = useLocation();
  const moduleUrls = useFriendlyModuleUrls();
  const communityUrls = useCommunityUrls(resolved);
  const businessUrls = useBusinessUrls(resolved);
  const filterReady = isTerritoryFilterReady(territoryFilter);
  const filterKey = territoryFilterKey(territoryFilter);
  const heroImage = getHeroImage(resolved);
  const communityTitle = getCommunityTitle(territoryName, communityProfile);
  const locationLabel = getTerritoryLocationLabel(resolved);
  const communityLocationLine = getCommunityLocationLine(resolved);
  const description = getCommunityDescription(territoryName, communityProfile);
  const fallbackLocationId =
    territoryFilter.scope === "location" ? territoryFilter.location_id : null;
  const fullEventsEnabled = isLaunchSurfaceEnabled("events");
  const communityEventsPreviewEnabled = isLaunchSurfaceEnabled("communityEventsPreview");
  const visualMockEnabled = useMemo(() => {
    const params = new URLSearchParams(routeLocation.search);
    return (
      import.meta.env.DEV &&
      params.get("visualMock") === COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE
    );
  }, [routeLocation.search]);

  const { posts, isLoading, isError, error, hasNextPage, isFetchingNextPage, loadMore } =
    useCommunityFeedSimple({
      locationScope: "neighborhood",
      territoryFilter,
      limit: children ? 6 : 12,
      enabled: !visualMockEnabled,
    });

  const visiblePosts = useMemo(() => posts.filter(isLaunchCommunityPostEnabled), [posts]);

  const { data: stats } = useQuery({
    queryKey: ["community-overview", "territory-stats", filterKey],
    queryFn: () => LandingFeaturedService.getTerritoryStats(territoryFilter),
    enabled: filterReady && !visualMockEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: [
      "community-overview",
      "featured-businesses",
      communityId ? `community:${communityId}` : `territory:${filterKey}`,
    ],
    queryFn: () =>
      LandingFeaturedService.getCommunityFeaturedBusinesses(communityId, territoryFilter, 4),
    enabled: filterReady && !visualMockEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: eventsPreviewPage, isLoading: loadingEventsPreview } = useQuery({
    queryKey: ["community-overview", "events-preview", filterKey],
    queryFn: () =>
      eventRuntimeService.getEventsPage({
        upcoming: true,
        statuses: ["upcoming", "ongoing"],
        territoryFilter,
        page: 0,
        pageSize: 3,
      }),
    enabled: filterReady && communityEventsPreviewEnabled && !visualMockEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const previewEvents = eventsPreviewPage?.items ?? [];
  const eventsPreviewTotal = eventsPreviewPage?.totalCount ?? previewEvents.length;

  const { data: groupsPage, isLoading: loadingGroups } = useQuery({
    queryKey: ["community-overview", "groups", filterKey],
    queryFn: () =>
      CommunityGroupsService.getGroupsPage({
        territoryFilter,
        limit: 4,
        sortBy: "populares",
      }),
    enabled: filterReady && !visualMockEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const previewGroups = groupsPage?.items ?? [];
  const groupsTotal = groupsPage?.totalCount ?? previewGroups.length;
  const displayPosts: DiscussionPreviewPost[] = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.posts
    : visiblePosts;
  const displayBusinesses = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.businesses
    : businesses;
  const displayEvents = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.events
    : previewEvents;
  const displayEventsTotal = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.events
    : eventsPreviewTotal;
  const displayGroups = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.groups
    : previewGroups;
  const displayGroupsTotal = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.groups
    : groupsTotal;
  const displayPostCount = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.posts
    : displayPosts.length;
  const displayLoadingFeed = visualMockEnabled ? false : isLoading;
  const displayFeedError = visualMockEnabled ? false : isError;
  const displayLoadingBusinesses = visualMockEnabled ? false : loadingBusinesses;
  const displayLoadingEvents = visualMockEnabled ? false : loadingEventsPreview;
  const displayLoadingGroups = visualMockEnabled ? false : loadingGroups;
  const displayHasNextPage = visualMockEnabled ? false : hasNextPage;
  const displayIsFetchingNextPage = visualMockEnabled ? false : isFetchingNextPage;
  const trendingDiscussions = useMemo(
    () =>
      [...displayPosts]
        .sort((a, b) => getPostEngagement(b) - getPostEngagement(a))
        .slice(0, 4),
    [displayPosts],
  );

  const { campaign, isLoading: loadingAd } = useAdDelivery("sidebar_widget", {
    fallbackLocationId,
    enabled: filterReady && !visualMockEnabled,
  });

  const moduleLinks = useMemo<ModuleLink[]>(
    () => {
      const links: ModuleLink[] = [
        { key: "feed", label: "Feed", href: "#feed", icon: Home, isActive: true },
        { key: "groups", label: "Grupos", href: communityUrls.groups, icon: Users },
        { key: "discussions", label: "Discussões", href: "#discussoes", icon: MessageCircle },
        { key: "business", label: "Empresas", href: moduleUrls.business, icon: Building2, surface: "business" },
        { key: "classifieds", label: "Classificados", href: moduleUrls.classifieds, icon: Tag, surface: "classifieds" },
        { key: "gastronomy", label: "Gastronomia", href: moduleUrls.gastronomy, icon: UtensilsCrossed, surface: "gastronomy" },
        { key: "services", label: "Serviços", href: moduleUrls.services, icon: Wrench, surface: "services" },
        { key: "events", label: "Eventos", href: "#eventos", icon: CalendarDays },
        { key: "about", label: "Sobre", href: "#sobre", icon: Info },
        { key: "rules", label: "Regras", href: "#regras", icon: ShieldCheck },
      ];
      return links.filter((item) => !item.surface || isLaunchSurfaceEnabled(item.surface));
    },
    [
      moduleUrls.business,
      moduleUrls.classifieds,
      communityUrls.groups,
      moduleUrls.gastronomy,
      moduleUrls.services,
    ],
  );

  const handleShareCommunity = useCallback(() => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      void navigator.share({ title: communityTitle, url: shareUrl }).catch(() => undefined);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
      void navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copiado"));
    }
  }, [communityTitle]);

  const handleSharePost = useCallback(
    (postId: string) => {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`
          : "";

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        void navigator.share({ title: communityTitle, url: shareUrl }).catch(() => undefined);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
        void navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copiado"));
      }
    },
    [communityTitle],
  );

  const statItems = visualMockEnabled
    ? [
        { label: "Membros", value: COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.members, icon: Users },
        {
          label: "Empresas locais",
          value: COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.businesses,
          icon: Building2,
        },
        {
          label: "Publicações recentes",
          value: COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.posts,
          icon: MessageCircle,
        },
        {
          label: "Eventos disponíveis",
          value: COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.events,
          icon: CalendarDays,
        },
      ]
    : [
        { label: "Empresas locais", value: stats?.businesses ?? 0, icon: Building2 },
        { label: "Classificados ativos", value: stats?.classifieds ?? 0, icon: Tag },
        { label: "Publicações recentes", value: displayPostCount, icon: MessageCircle },
        {
          label: "Eventos disponíveis",
          value: communityEventsPreviewEnabled ? displayEventsTotal : 0,
          icon: CalendarDays,
        },
      ];

  const focusShortcutLinks = [
    {
      label: "Feed",
      detail: `${formatCount(displayPostCount)} publicações`,
      href: "#feed",
      icon: MessageCircle,
      isActive: true,
    },
    {
      label: "Grupos",
      detail: `${formatCount(displayGroupsTotal)} ativos`,
      href: communityUrls.groups,
      icon: Users,
    },
    {
      label: "Discussões",
      detail: `${formatCount(trendingDiscussions.length)} em alta`,
      href: "#discussoes",
      icon: Flame,
    },
    {
      label: "Achados",
      detail: "Pedidos e recomendações",
      href: "#feed",
      icon: Tag,
    },
    {
      label: "Enquetes",
      detail: "Opinião dos moradores",
      href: "#feed",
      icon: FileQuestion,
    },
  ];

  return (
    <div
      className="w-full min-w-0 px-3 py-4 text-white sm:px-4 md:px-6 xl:px-0 xl:py-0"
      data-community-overview="community-first"
      data-visual-mock={visualMockEnabled ? COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE : undefined}
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-[14.375rem_minmax(0,1fr)] xl:gap-0">
        <aside className="hidden border-r border-white/10 bg-[#06131b]/72 xl:block">
          <div className="sticky top-0 space-y-5 px-5 py-6">
            <p className="px-1 text-xs font-medium text-white/58">Comunidade</p>
            <nav className="space-y-2" aria-label="Navegacao da comunidade">
              {moduleLinks.map((item) => {
                return (
                  <ModuleNavLink
                    key={item.key}
                    item={item}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      item.isActive
                        ? "bg-teal-400/16 text-teal-100"
                        : "text-white/68 hover:bg-white/[0.06] hover:text-white",
                    )}
                  />
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleShareCommunity}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-teal-300/30 px-4 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-300/10"
            >
              <UserPlus className="h-4 w-4" />
              Convidar amigos
            </button>
          </div>
        </aside>

        <main className="min-w-0 space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_23.75rem] xl:gap-x-4 xl:gap-y-3 xl:px-5 xl:py-3 xl:space-y-0">
          <section
            className="relative isolate overflow-hidden rounded-[24px] border border-white/12 bg-[#06141d] shadow-2xl shadow-black/20 xl:col-start-1 xl:row-start-1"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(2,12,18,0.84) 0%, rgba(2,12,18,0.64) 43%, rgba(2,12,18,0.16) 100%), url(${heroImage})`,
              backgroundPosition: "center 48%",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_32%)]" />
            <div className="relative min-h-[12.25rem] px-4 py-2 sm:min-h-[14rem] sm:px-5 lg:min-h-[15rem] lg:px-7 lg:py-4 xl:h-[136px] xl:min-h-0 xl:px-5 xl:py-4">
              <div className="flex min-w-0 flex-col justify-between gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-center xl:gap-5">
                <div className="flex min-w-0 flex-row items-center gap-3 sm:gap-4 xl:gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/22 bg-white/10 shadow-xl shadow-black/25 sm:h-20 sm:w-20 md:h-24 md:w-24 md:rounded-2xl xl:h-24 xl:w-24">
                    <img
                      src={heroImage}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  </div>
                  <div className="min-w-0 xl:max-w-[36rem]">
                    <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl xl:text-[2rem]">
                      {communityTitle}
                    </h1>
                    <p className="mt-1.5 flex min-w-0 items-center gap-2 text-sm font-medium text-white/82">
                      <MapPin className="h-4 w-4 shrink-0 text-teal-300" />
                      <span className="truncate">
                        {communityLocationLine}
                        {locationLabel !== communityLocationLine ? ` - ${locationLabel}` : ""}
                      </span>
                    </p>
                    <p className="mt-1.5 max-w-xl overflow-hidden text-sm leading-5 text-white/82 sm:text-base sm:leading-6 xl:line-clamp-2 xl:text-sm xl:leading-5">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 xl:grid xl:grid-cols-[minmax(0,7.25rem)_12rem] xl:items-center xl:gap-3">
                  <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-4 xl:grid-cols-1 xl:gap-2">
                    {statItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={cn(
                            "rounded-xl border border-white/10 bg-black/24 px-2.5 py-1 backdrop-blur md:rounded-2xl md:px-4 md:py-2 xl:min-w-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-0",
                            index >= 2 ? "xl:hidden" : "",
                          )}
                        >
                          <div className="flex items-center gap-2 text-white">
                            <Icon className="h-4 w-4 text-teal-300 xl:text-white/82" />
                            <strong className="text-sm md:text-base xl:text-xl">{formatCount(item.value)}</strong>
                          </div>
                          <p className="mt-0.5 text-[0.66rem] leading-tight text-white/58 md:text-xs xl:mt-1">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex shrink-0 flex-nowrap gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:justify-end md:overflow-visible md:pb-0 xl:flex-col xl:gap-2 xl:pb-0 [&::-webkit-scrollbar]:hidden">
                    {mode === "member" ? (
                      <Button
                        type="button"
                        onClick={onOpenCreatePost}
                         className="min-h-9 shrink-0 rounded-xl bg-teal-400 px-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Criar publicação
                      </Button>
                    ) : (
                      <Link
                        to={loginHref}
                        className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-xl bg-teal-400 px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-300 md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                      >
                        <LogIn className="mr-2 h-4 w-4 xl:hidden" />
                        <span className="xl:hidden">Participar</span>
                        <span className="hidden xl:inline">Participar da comunidade</span>
                      </Link>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShareCommunity}
                      className="min-h-9 shrink-0 rounded-xl border-white/20 bg-black/20 px-3 text-sm text-white hover:bg-white/10 hover:text-white md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative hidden border-t border-white/10 px-4 py-2 xl:flex xl:min-h-12 xl:items-center xl:gap-5">
              {focusShortcutLinks.map((item) => {
                const Icon = item.icon;
                const className = cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-teal-400/15 text-teal-100"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                );
                const content = (
                  <>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </>
                );

                return item.href.startsWith("#") ? (
                  <a key={item.label} href={item.href} className={className}>
                    {content}
                  </a>
                ) : (
                  <Link key={item.label} to={item.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => {
              return (
                <ModuleNavLink
                  key={item.key}
                  item={item}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors",
                    item.isActive
                      ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                      : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
                  )}
                />
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:hidden [&::-webkit-scrollbar]:hidden">
            {focusShortcutLinks.map((item) => {
              const Icon = item.icon;
              const className = cn(
                "group flex min-h-14 min-w-[13.5rem] items-center gap-3 rounded-2xl border px-3 py-2.5 text-white shadow-xl shadow-black/10 backdrop-blur transition-colors hover:border-teal-300/30 hover:bg-white/[0.06] sm:min-w-0",
                item.isActive
                  ? "border-teal-300/35 bg-teal-300/12"
                  : "border-white/10 bg-[#071922]/88",
              );
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-300/12 text-teal-200 transition-colors group-hover:bg-teal-300/18">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs text-white/50">{item.detail}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
                </>
              );

              return item.href.startsWith("#") ? (
                <a key={item.label} href={item.href} className={className}>
                  {content}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="grid min-w-0 gap-4 xl:col-start-1 xl:row-start-2">
            <div className="order-1 min-w-0 space-y-4">
              {children ? (
                children
              ) : (
                <>
                  <SurfacePanel id="feed">
                    <SectionHeader title="Feed da comunidade" />
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] px-3 text-left transition-colors hover:border-teal-300/35 hover:bg-teal-300/10"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06]">
                        <img src={personaMorador} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-white/58">
                        Compartilhe algo com {communityTitle}...
                      </span>
                      <Send className="h-4 w-4 shrink-0 text-teal-300" />
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onRequireLogin}
                          className="h-9 rounded-lg border-white/10 bg-black/20 px-3 text-xs text-white/78 hover:bg-white/10 hover:text-white"
                        >
                          <MessageCircle className="mr-2 h-3.5 w-3.5" />
                          Post
                        </Button>
                        <Button
                          type="button"
                        variant="outline"
                        onClick={onRequireLogin}
                          className="h-9 rounded-lg border-white/10 bg-black/20 px-3 text-xs text-white/78 hover:bg-white/10 hover:text-white"
                        >
                          <Camera className="mr-2 h-3.5 w-3.5" />
                          Foto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onRequireLogin}
                          className="h-9 rounded-lg border-white/10 bg-black/20 px-3 text-xs text-white/78 hover:bg-white/10 hover:text-white"
                        >
                          <BarChart3 className="mr-2 h-3.5 w-3.5" />
                          Enquete
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                        onClick={onRequireLogin}
                          className="h-9 rounded-lg border-white/10 bg-black/20 px-3 text-xs text-white/78 hover:bg-white/10 hover:text-white"
                        >
                          <CircleHelp className="mr-2 h-3.5 w-3.5" />
                          Pergunta
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onRequireLogin}
                          className="h-9 rounded-lg border-white/10 bg-black/20 px-3 text-xs text-white/78 hover:bg-white/10 hover:text-white"
                        >
                          <BadgeCheck className="mr-2 h-3.5 w-3.5" />
                          Recomendação
                        </Button>
                    </div>
                  </SurfacePanel>

                  <SurfacePanel className="p-3">
                    <div
                      className="mb-3 flex min-w-0 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      role="tablist"
                      aria-label="Filtros públicos do feed"
                    >
                      {COMMUNITY_FEED_HEADER_FILTERS.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={activeHeaderFilter === id}
                          onClick={() => onHeaderFilterChange(id)}
                          className={cn(
                            "inline-flex min-h-9 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold transition-colors",
                            activeHeaderFilter === id
                              ? "border-teal-300/45 bg-teal-300/15 text-teal-100"
                              : "border-white/10 bg-black/20 text-white/55 hover:text-white",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {displayLoadingFeed ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                          />
                        ))}
                      </div>
                    ) : displayFeedError ? (
                      <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-4 text-sm text-red-100">
                        Erro ao carregar feed: {error?.message ?? "tente novamente em instantes."}
                      </p>
                    ) : displayPosts.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm text-white/50">
                        Nenhuma publicação pública encontrada neste território.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {displayPosts.map((post) => {
                          const Icon = getPublicPostTypeIcon(post.type);
                          return (
                            <article
                              id={`post-${post.id}`}
                              key={post.id}
                              className="rounded-2xl border border-white/10 bg-[#081e28] p-4 shadow-lg shadow-black/10"
                            >
                              <div className="flex min-w-0 gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-300/12 text-teal-200">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-white">
                                        {getPublicPostAuthor(post)}
                                      </p>
                                      <p className="text-xs text-white/42">
                                        {getPublicPostTypeLabel(post.type)} - {formatPublicPostDate(post.created_at)}
                                      </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-white/36">
                                      {formatPublicPostDate(post.created_at)}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-sm leading-6 text-white/78">
                                    {getPublicPostPreview(post.content, 220)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                                <div className="flex items-center gap-3 text-xs text-white/48">
                                  <span className="inline-flex items-center gap-1">
                                    <Heart className="h-3.5 w-3.5" />
                                    {post.likes_count ?? 0}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    {post.comments_count ?? 0}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRequireLogin}
                                    className="h-8 rounded-full px-3 text-xs text-white/62 hover:bg-white/[0.07] hover:text-white"
                                  >
                                    <Lock className="mr-1 h-3.5 w-3.5" />
                                    Comentar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRequireLogin}
                                    className="h-8 rounded-full px-3 text-xs text-white/62 hover:bg-white/[0.07] hover:text-white"
                                  >
                                    <Bookmark className="mr-1 h-3.5 w-3.5" />
                                    Salvar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSharePost(post.id)}
                                    className="h-8 rounded-full px-3 text-xs text-white/62 hover:bg-white/[0.07] hover:text-white"
                                  >
                                    <Share2 className="mr-1 h-3.5 w-3.5" />
                                    Compartilhar
                                  </Button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}

                    {displayHasNextPage ? (
                      <div className="mt-4 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadMore}
                          disabled={displayIsFetchingNextPage}
                          className="rounded-xl border-white/15 bg-white/[0.03] text-white hover:bg-white/10"
                        >
                          {displayIsFetchingNextPage ? "Carregando..." : "Carregar mais"}
                        </Button>
                      </div>
                    ) : null}
                  </SurfacePanel>
                </>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-4 xl:col-start-2 xl:row-span-5 xl:row-start-1">
              <SurfacePanel id="grupos" className="p-3">
                <SectionHeader
                  title="Grupos da comunidade"
                  actionHref={communityUrls.groups}
                  actionLabel="Ver todos"
                />
                {displayLoadingGroups ? (
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
                      />
                    ))}
                  </div>
                ) : displayGroups.length > 0 ? (
                  <div className="space-y-2">
                    {displayGroups.map((group) => (
                      <GroupPreviewItem
                        key={group.id}
                        group={group}
                        href={visualMockEnabled ? "#grupos" : communityUrls.groupDetail(group.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyCommunityState
                    icon={Users}
                    title="Grupos em preparacao"
                    description="Quando grupos ativos existirem neste territorio, eles aparecem aqui como a principal porta de participacao."
                  />
                )}
              </SurfacePanel>

              <SurfacePanel id="discussoes" className="p-3">
                <SectionHeader title="Discussões em alta" actionHref="#feed" actionLabel="Ver feed" />
                {displayLoadingFeed ? (
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="h-11 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
                      />
                    ))}
                  </div>
                ) : trendingDiscussions.length > 0 ? (
                  <div className="space-y-2">
                    {trendingDiscussions.map((post) => (
                      <DiscussionPreviewItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <EmptyCommunityState
                    icon={MessageCircle}
                    title="Nenhuma discussao em alta"
                    description="As discussoes aparecem aqui quando houver publicacoes publicas com interacao real."
                  />
                )}
              </SurfacePanel>

              <SurfacePanel id="eventos" className="p-3">
                <SectionHeader
                  title="Próximos eventos"
                  actionHref={fullEventsEnabled ? moduleUrls.events : undefined}
                  actionLabel={fullEventsEnabled ? "Ver todos" : undefined}
                />
                {!communityEventsPreviewEnabled ? (
                  <EmptyCommunityState
                    icon={CalendarDays}
                    title="Módulo de eventos aguardando ativação"
                    description="A agenda já está prevista na página, mas a prévia comunitária de eventos segue desligada no launch scope."
                  />
                ) : displayLoadingEvents ? (
                  <div className="space-y-2">
                    {[0, 1].map((index) => (
                      <div
                        key={index}
                        className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
                      />
                    ))}
                  </div>
                ) : displayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {displayEvents.map((event) => (
                      <EventPreviewItem key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <EmptyCommunityState
                    icon={CalendarDays}
                    title="Nenhum evento público nesta comunidade"
                    description="Quando eventos aprovados existirem para este território, eles aparecem aqui em modo de leitura."
                    ctaHref={fullEventsEnabled ? moduleUrls.events : undefined}
                    ctaLabel={fullEventsEnabled ? "Abrir eventos" : undefined}
                  />
                )}
              </SurfacePanel>

              <SurfacePanel id="empresas" className="p-3">
                <SectionHeader
                  title="Empresas úteis hoje"
                  actionHref={moduleUrls.business}
                  actionLabel="Ver todas"
                />
                {displayLoadingBusinesses ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-white/50">
                    Carregando empresas reais do território...
                  </p>
                ) : displayBusinesses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-white/50">
                    Nenhuma empresa ativa cadastrada nesta comunidade.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {displayBusinesses.map((business) => {
                      const href = buildBusinessHref(business, businessUrls.canonical);
                      const rating =
                        typeof business.rating === "number" && business.rating > 0
                          ? business.rating.toFixed(1).replace(".", ",")
                          : "Sem avaliações";
                      const content = (
                        <>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06] text-teal-200">
                            {business.logo_url ? (
                              <img
                                src={business.logo_url}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Store className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-white">
                              {business.name}
                            </span>
                            <span className="block truncate text-xs text-white/48">
                              {normalizeCategoryLabel(business.category)}
                            </span>
                            <span className="block text-xs font-semibold text-teal-300">
                              {rating}
                            </span>
                          </span>
                        </>
                      );

                      return href ? (
                        <Link
                          key={business.id}
                          to={href}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.06]"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div key={business.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SurfacePanel>

              <SurfacePanel id="sobre">
                <SectionHeader title={`Sobre ${communityTitle}`} />
                <p className="text-sm leading-6 text-white/66">{description}</p>
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-start gap-3">
                    <Compass className="mt-0.5 h-4 w-4 text-teal-300" />
                    <p className="text-sm text-white/62">
                      Conteúdo público para descoberta. Interações exigem conta e permissão comunitária.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-teal-300" />
                    <p className="text-sm text-white/62">
                      Moderação e regras de segurança ficam aplicadas no fluxo de publicação.
                    </p>
                  </div>
                </div>
              </SurfacePanel>

              <SurfacePanel id="regras">
                <SectionHeader title="Regras da comunidade" />
                <ul className="space-y-2">
                  {COMMUNITY_RULES.map((rule) => (
                    <li key={rule} className="flex gap-2 text-sm text-white/66">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </SurfacePanel>

              <SurfacePanel id="albuns">
                <SectionHeader title="Álbuns da comunidade" />
                <EmptyCommunityState
                  icon={Camera}
                  title="Galeria pública em preparação"
                  description="Fotos e álbuns precisam de moderação, origem autorizada e política de exposição antes de aparecerem publicamente."
                />
              </SurfacePanel>

              <SurfacePanel className="xl:hidden">
                <SectionHeader title="Anúncio local" />
                {loadingAd ? (
                  <div className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
                ) : campaign ? (
                  <SponsoredAdCard
                    campaign={campaign}
                    variant="compact"
                    className="border-teal-300/20 bg-teal-300/10 text-white"
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-sm text-white/50">
                    Nenhuma campanha patrocinada ativa para este território.
                  </p>
                )}
              </SurfacePanel>
            </div>
        </main>
      </div>
    </div>
  );
}
