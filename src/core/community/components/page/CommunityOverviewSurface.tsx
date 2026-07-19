import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  Bookmark,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Heart,
  Home,
  LayoutGrid,
  LogIn,
  MapPin,
  Megaphone,
  MessageCircle,
  Share2,
  Store,
  Tag,
  UserPlus,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import personaMoradorImport from "@/assets/persona-morador.jpg";
import {
  buildBusinessHref,
  buildCommunityViewHref,
  formatCount,
  formatPublicPostDate,
  formatSlugLabel,
  getCommunityDescription,
  getCommunityLocationLine,
  getCommunityTitle,
  getEventDateParts,
  getHeroImage,
  getPublicPostAuthor,
  getPublicPostTypeIcon,
  getPublicPostTypeLabel,
  getResolvedSlug,
  getTerritoryLocationLabel,
  normalizeCategoryLabel,
} from "./communityOverviewHelpers";
import personaMorador from "@/assets/persona-morador.jpg";
import {
  isLaunchCommunityPostEnabled,
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { useAdDelivery, SponsoredAdCard } from "@/core/business/promotions";
import { useBusinessUrls } from "@/core/business/hooks/useBusinessUrls";
import { ClassifiedUrlService } from "@/core/classifieds/services/ClassifiedUrlService";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import { CommunityComposerEntry } from "@/core/community/components/composer/CommunityComposerEntry";
import { ImageGallery } from "@/core/community/components/ImageGallery";
import {
  CommunityGroupsService,
  type GroupRow,
} from "@/core/community/services/CommunityGroupsService";
import {
  COMMUNITY_FEED_SORT_FILTERS,
  type CommunityFeedSortType,
} from "@/core/community/utils/communityFeedTab";
import {
  LandingFeaturedService,
  type FeaturedBusiness,
  type FeaturedClassified,
  type FeaturedService,
} from "@/core/landing/services/LandingFeaturedService";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { useCommunityUrls } from "@/core/routing/hooks/useCommunityUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import type { PostType } from "@/core/posts/types";
import {
  COMMUNITY_OVERVIEW_VISUAL_FIXTURE,
  COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE,
} from "./fixtures/communityOverviewVisualFixture";
import {
  isCommunitySocialView,
  type CommunityOverviewSection,
  type CommunityOverviewView,
} from "./communityOverviewNavigation";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import { eventRuntimeService, type PublicEvent } from "@/core/verticals/events";
import { Button } from "@/shared/components/ui/button";
import { SafeImage } from "@/shared/components/security/SafeImage";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { getRecordValue } from "@/shared/utils/recordLookup";

type CommunityOverviewMode = "public" | "member";

interface CommunityOverviewSurfaceProps {
  resolved?: ResolvedTerritory;
  territoryName: string;
  territoryFilter: TerritoryFilter;
  onRequireLogin: () => void;
  loginHref: string;
  publishHref: string;
  communityId?: string | null;
  communityProfile?: TerritorialCommunityProfile | null;
  mode?: CommunityOverviewMode;
  onOpenCreatePost?: (defaultType?: PostType) => void;
  activeView?: CommunityOverviewView;
  onViewChange?: (view: CommunityOverviewView) => void;
  activeSection?: CommunityOverviewSection;
  children?: React.ReactNode;
}

interface ModuleLink {
  key: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  isActive?: boolean;
  surface?: LaunchSurfaceKey;
  view?: CommunityOverviewView;
}

interface FocusShortcut {
  label: string;
  detail: string;
  icon: React.ElementType;
  href?: string;
  view?: CommunityOverviewView;
  isActive?: boolean;
  surface?: LaunchSurfaceKey;
}


const COMMUNITY_FEED_CONTEXT_SHORTCUTS = [
  { view: "feed", label: "Posts", icon: MessageCircle },
  { view: "groups", label: "Grupos", icon: Users },
  { view: "discussions", label: "Discussões", icon: MessageCircle },
] as const satisfies ReadonlyArray<{
  view: "feed" | "groups" | "discussions";
  label: string;
  icon: React.ElementType;
}>;

type CommunityFeedContextTab =
  (typeof COMMUNITY_FEED_CONTEXT_SHORTCUTS)[number]["view"];

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
  const communityImage = slug
    ? getRecordValue(COMMUNITY_HERO_IMAGES, slug)
    : undefined;
  if (communityImage) return communityImage;
  if (resolved?.kind === "location" && resolved.location.type === "city")
    return heroSalvador;
  return neighborhoodFeatured;
}

function buildCommunityViewHref(
  baseHref: string,
  view: CommunityOverviewView,
): string {
  if (view === "feed") return baseHref;
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}view=${encodeURIComponent(view)}`;
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
  const pathParts = resolved.location.geographic_path
    .split("/")
    .filter(Boolean);
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

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function getEventDateParts(value: string): {
  day: string;
  month: string;
  time: string;
} {
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
    author_profile?: { name?: string | null } | null;
  };
  return (
    record.author_name?.trim() ||
    record.author_profile?.name?.trim() ||
    record.author?.display_name?.trim() ||
    "Morador"
  );
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

function getPublicPostTypeIcon(
  type: string | null | undefined,
): React.ElementType {
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
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EventPreviewItem({ event }: { event: PublicEvent }) {
  const dateParts = getEventDateParts(event.date);

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-black/24 text-center">
          <span className="text-lg font-bold leading-none text-white">
            {dateParts.day}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase text-white/48">
            {dateParts.month}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {event.title}
          </p>
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
  if (
    typeof group.members_count === "number" &&
    Number.isFinite(group.members_count)
  ) {
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
        <span className="block truncate text-sm font-semibold text-white">
          {group.name}
        </span>
        <span className="block truncate text-xs text-white/52">
          {normalizeCategoryLabel(group.category)} - {formatCount(membersCount)}{" "}
          membros
        </span>
      </span>
      <span className="shrink-0 rounded-lg border border-teal-300/25 px-2 py-1 text-xs font-semibold text-teal-200">
        Abrir
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
  author_role?: string | null;
  avatar_url?: string | null;
  title?: string | null;
  summary?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  author_profile?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function getPublicPostRole(post: DiscussionPreviewPost): string {
  return post.author_role?.trim() || "Morador";
}

function getPublicPostAvatar(post: DiscussionPreviewPost): string | null {
  if (post.avatar_url?.trim()) return post.avatar_url;
  const record = post as DiscussionPreviewPost & {
    author?: { avatar_url?: string | null } | null;
  };
  return (
    record.author_profile?.avatar_url?.trim() ||
    record.author?.avatar_url?.trim() ||
    null
  );
}

function getPublicPostImages(post: DiscussionPreviewPost): string[] {
  const images = Array.isArray(post.images)
    ? post.images.filter((image): image is string => typeof image === "string")
    : [];
  if (images.length > 0) return images.slice(0, 4);
  return post.image_url ? [post.image_url] : [];
}

function getPublicPostTitle(post: DiscussionPreviewPost): string {
  return post.title?.trim() || getPublicPostPreview(post.content, 120);
}

function getPublicPostSummary(post: DiscussionPreviewPost): string | null {
  return post.summary?.trim() || null;
}

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
      tabIndex={id ? -1 : undefined}
      className={cn(
        "rounded-2xl border border-white/10 bg-[#071922]/88 p-4 text-white shadow-xl shadow-black/10 backdrop-blur",
        id &&
          "scroll-mt-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70",
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

function CommunityFeedContextNavigation({
  activeContextTab,
  onContextTabChange,
}: {
  activeContextTab: CommunityFeedContextTab;
  onContextTabChange: (tab: CommunityFeedContextTab) => void;
}) {
  return (
    <div
      className="flex min-w-0 gap-6 overflow-x-auto rounded-xl border border-white/10 bg-[#071922]/88 px-3 shadow-xl shadow-black/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Navegação contextual do feed"
    >
      {COMMUNITY_FEED_CONTEXT_SHORTCUTS.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          data-community-feed-shortcut={view}
          onClick={() => onContextTabChange(view)}
          aria-pressed={activeContextTab === view}
          className={cn(
            "relative inline-flex min-h-10 shrink-0 items-center gap-1.5 border-0 px-0 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70",
            activeContextTab === view
              ? "font-semibold text-teal-300 after:bg-teal-300"
              : "text-white/62",
          )}
          aria-controls="community-feed-context-panel"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

function CommunityPostSortControls({
  value,
  onChange,
}: {
  value: CommunityFeedSortType;
  onChange: (sort: CommunityFeedSortType) => void;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Ordenação dos posts"
      data-community-post-sort="true"
    >
      <span className="shrink-0 text-xs font-medium text-white/48">
        Ordenar:
      </span>
      {COMMUNITY_FEED_SORT_FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex min-h-8 shrink-0 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70",
            value === id
              ? "border-teal-300/35 bg-teal-300/12 text-teal-100"
              : "border-white/10 bg-white/[0.035] text-white/60 hover:border-white/20 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CommunityGroupsPreview({
  id,
  className,
  groups,
  loading,
  actionHref,
  groupHref,
  itemLimit,
}: {
  id: string;
  className?: string;
  groups: GroupRow[];
  loading: boolean;
  actionHref: string;
  groupHref: (group: GroupRow) => string;
  itemLimit?: number;
}) {
  const visibleGroups = groups.slice(0, itemLimit);

  return (
    <SurfacePanel id={id} className={className}>
      <SectionHeader
        title="Grupos da comunidade"
        actionHref={actionHref}
        actionLabel="Ver todos"
      />
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].slice(0, itemLimit ?? 4).map((index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : visibleGroups.length > 0 ? (
        <div className="space-y-2">
          {visibleGroups.map((group) => (
            <GroupPreviewItem
              key={group.id}
              group={group}
              href={groupHref(group)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-5 text-white/50">
          Nenhum grupo ativo neste território.
        </p>
      )}
    </SurfacePanel>
  );
}

function CommunityDiscussionsPreview({
  id,
  className,
  title = "Discussões em alta",
  posts,
  loading,
  itemLimit,
}: {
  id: string;
  className?: string;
  title?: string;
  posts: DiscussionPreviewPost[];
  loading: boolean;
  itemLimit?: number;
}) {
  const visiblePosts = posts.slice(0, itemLimit);

  return (
    <SurfacePanel id={id} className={className}>
      <SectionHeader title={title} />
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].slice(0, itemLimit ?? 4).map((index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : visiblePosts.length > 0 ? (
        <div className="space-y-2">
          {visiblePosts.map((post) => (
            <DiscussionPreviewItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-sm leading-5 text-white/50">
          Nenhuma discussão em alta agora.
        </p>
      )}
    </SurfacePanel>
  );
}

function CommunityModulePreview({
  icon: Icon,
  title,
  description,
  countLabel,
  actionHref,
  actionLabel,
  loading,
  isEmpty,
  emptyMessage,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  countLabel: string;
  actionHref: string;
  actionLabel: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <SurfacePanel
      className="overflow-hidden p-0"
      id={`preview-${title.toLowerCase()}`}
    >
      <div className="flex min-w-0 items-start gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-300/12 text-teal-200">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <span className="text-xs font-medium text-teal-200">
              {countLabel}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-white/52">{description}</p>
        </div>
      </div>

      <div className="p-2 sm:p-3">
        {loading ? (
          <div
            className="space-y-2"
            aria-label={`Carregando ${title.toLowerCase()}`}
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-[4.75rem] animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-sm text-white/50">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          to={actionHref}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-300/25 bg-teal-300/10 px-4 text-sm font-semibold text-teal-100 transition-colors hover:bg-teal-300/15 hover:text-white"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </SurfacePanel>
  );
}

function BusinessPreviewRow({
  business,
  href,
}: {
  business: FeaturedBusiness;
  href: string | null;
}) {
  const content = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-blue-500/12 text-blue-300">
        {business.logo_url ? (
          <SafeImage
            src={business.logo_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Store className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase text-blue-300">
          Negócio local
          {business.is_verified ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-label="Verificada" />
          ) : null}
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-white">
          {business.name}
        </strong>
        <span className="block truncate text-xs text-white/52">
          {normalizeCategoryLabel(business.category)}
          {business.rating > 0
            ? ` · ${business.rating.toFixed(1).replace(".", ",")}`
            : ""}
        </span>
      </span>
      {href ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
      ) : null}
    </>
  );

  return href ? (
    <Link
      to={href}
      className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081e28]/70 px-3 py-2 transition-colors hover:border-teal-300/25 hover:bg-white/[0.055]"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081e28]/70 px-3 py-2">
      {content}
    </div>
  );
}

function ServicePreviewRow({ service }: { service: FeaturedService }) {
  return (
    <article className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081e28]/70 px-3 py-2">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-violet-500/12 text-violet-300">
        {service.logo_url ? (
          <SafeImage
            src={service.logo_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Wrench className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase text-violet-300">
          Serviço local
          {service.is_verified ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-label="Verificado" />
          ) : null}
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-white">
          {service.name}
        </strong>
        <span className="block truncate text-xs text-white/52">
          {normalizeCategoryLabel(service.category)} ·{" "}
          {service.price_range ?? "A combinar"}
        </span>
      </span>
    </article>
  );
}

function ClassifiedPreviewRow({ item }: { item: FeaturedClassified }) {
  const href = ClassifiedUrlService.buildPublicUrl(item);
  const content = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-amber-500/12 text-amber-300">
        {item.photos[0] ? (
          <SafeImage
            src={item.photos[0]}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Tag className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[0.68rem] font-semibold uppercase text-amber-300">
          Classificado local
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-white">
          {item.titulo}
        </strong>
        <span className="block truncate text-xs text-white/52">
          {normalizeCategoryLabel(item.category)} ·{" "}
          {formatBrlNoCents(item.price)}
        </span>
      </span>
      {href ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
      ) : null}
    </>
  );

  return href ? (
    <Link
      to={href}
      className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081e28]/70 px-3 py-2 transition-colors hover:border-teal-300/25 hover:bg-white/[0.055]"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081e28]/70 px-3 py-2">
      {content}
    </div>
  );
}

function ModuleNavLink({
  item,
  className,
  labelClassName,
  onViewChange,
  onNavigate,
}: {
  item: ModuleLink;
  className: string;
  labelClassName?: string;
  onViewChange: (view: CommunityOverviewView) => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const view = item.view;
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={cn(
          "min-w-0 leading-none",
          labelClassName ?? "max-w-full truncate",
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (view) {
    return (
      <button
        type="button"
        className={className}
        data-community-nav-item={item.key}
        onClick={() => onViewChange(view)}
        aria-pressed={item.isActive}
        aria-controls="community-primary-content"
      >
        {content}
      </button>
    );
  }

  if (item.href?.startsWith("#")) {
    return (
      <a
        href={item.href}
        className={className}
        data-community-nav-item={item.key}
        aria-current={item.isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={item.href ?? "#"}
      className={className}
      data-community-nav-item={item.key}
      aria-current={item.isActive ? "page" : undefined}
      onClick={onNavigate}
    >
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
  onRequireLogin,
  loginHref,
  publishHref,
  communityId = null,
  communityProfile = null,
  mode = "public",
  onOpenCreatePost,
  activeView,
  onViewChange,
  activeSection,
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
  const communityEventsPreviewEnabled = isLaunchSurfaceEnabled(
    "communityEventsPreview",
  );
  const visualMockEnabled = useMemo(() => {
    const params = new URLSearchParams(routeLocation.search);
    return (
      import.meta.env.DEV &&
      params.get("visualMock") === COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE
    );
  }, [routeLocation.search]);
  const [feedContextTab, setFeedContextTab] =
    useState<CommunityFeedContextTab>("feed");
  const [postSort, setPostSort] = useState<CommunityFeedSortType>("popular");
  const [mobileSectionsExpanded, setMobileSectionsExpanded] = useState(false);
  const [internalView, setInternalView] =
    useState<CommunityOverviewView>("feed");
  const mobileSectionsId = React.useId();
  const selectedView = activeView ?? internalView;
  const isEmbeddedModule = Boolean(
    children && activeSection && !isCommunitySocialView(activeSection),
  );
  const handleViewChange = useCallback(
    (view: CommunityOverviewView) => {
      if (activeView === undefined) setInternalView(view);
      if (view === "feed") setFeedContextTab("feed");
      onViewChange?.(view);
      setMobileSectionsExpanded(false);
    },
    [activeView, onViewChange],
  );
  const handleModuleNavigate = useCallback(() => {
    setMobileSectionsExpanded(false);
  }, []);
  const handleFeedContextTabChange = useCallback(
    (tab: CommunityFeedContextTab) => {
      setFeedContextTab(tab);
    },
    [],
  );

  useEffect(() => {
    const targetId = routeLocation.hash.replace(/^#/, "");
    if (!targetId) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      target.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [routeLocation.hash]);

  const {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useCommunityFeedSimple({
    locationScope: "neighborhood",
    territoryFilter,
    limit: children ? 6 : 12,
    enabled:
      !visualMockEnabled &&
      !isEmbeddedModule &&
      (selectedView === "discussions" ||
        (selectedView === "feed" && feedContextTab !== "groups")),
  });

  const visiblePosts = useMemo(
    () => posts.filter(isLaunchCommunityPostEnabled),
    [posts],
  );

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
      LandingFeaturedService.getCommunityFeaturedBusinesses(
        communityId,
        territoryFilter,
        4,
      ),
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      selectedView === "business",
    staleTime: 5 * 60 * 1000,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: [
      "community-overview",
      "featured-services",
      communityId ? `community:${communityId}` : `territory:${filterKey}`,
    ],
    queryFn: () =>
      LandingFeaturedService.getCommunityFeaturedServices(
        communityId,
        territoryFilter,
        4,
      ),
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      selectedView === "services",
    staleTime: 5 * 60 * 1000,
  });

  const { data: classifieds = [], isLoading: loadingClassifieds } = useQuery({
    queryKey: [
      "community-overview",
      "featured-classifieds",
      communityId ? `community:${communityId}` : `territory:${filterKey}`,
    ],
    queryFn: () =>
      LandingFeaturedService.getCommunityFeaturedClassifieds(
        communityId,
        territoryFilter,
        4,
      ),
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      selectedView === "classifieds",
    staleTime: 5 * 60 * 1000,
  });

  const { data: gastronomy = [], isLoading: loadingGastronomy } = useQuery({
    queryKey: [
      "community-overview",
      "featured-gastronomy",
      communityId ? `community:${communityId}` : `territory:${filterKey}`,
    ],
    queryFn: () =>
      LandingFeaturedService.getCommunityFeaturedGastronomyBusinesses(
        communityId,
        territoryFilter,
        4,
      ),
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      selectedView === "gastronomy",
    staleTime: 5 * 60 * 1000,
  });

  const { data: eventsPreviewPage, isLoading: loadingEventsPreview } = useQuery(
    {
      queryKey: ["community-overview", "events-preview", filterKey],
      queryFn: () =>
        eventRuntimeService.getEventsPage({
          upcoming: true,
          statuses: ["upcoming", "ongoing"],
          territoryFilter,
          page: 0,
          pageSize: 3,
        }),
      enabled:
        filterReady &&
        communityEventsPreviewEnabled &&
        !visualMockEnabled &&
        !isEmbeddedModule &&
        selectedView === "feed",
      staleTime: 5 * 60 * 1000,
    },
  );

  const previewEvents = eventsPreviewPage?.items ?? [];
  const eventsPreviewTotal =
    eventsPreviewPage?.totalCount ?? previewEvents.length;

  const { data: groupsPage, isLoading: loadingGroups } = useQuery({
    queryKey: ["community-overview", "groups", filterKey],
    queryFn: () =>
      CommunityGroupsService.getGroupsPage({
        territoryFilter,
        limit: 4,
        sortBy: "populares",
      }),
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      (selectedView === "groups" ||
        (selectedView === "feed" && feedContextTab === "groups")),
    staleTime: 5 * 60 * 1000,
  });

  const previewGroups = groupsPage?.items ?? [];
  const displayPosts: DiscussionPreviewPost[] = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.posts
    : visiblePosts;
  const displayBusinesses = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.businesses
    : businesses;
  const displayServices = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.services
    : services;
  const displayClassifieds = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.classifieds
    : classifieds;
  const displayGastronomy = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.gastronomy
    : gastronomy;
  const displayEvents = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.events
    : previewEvents;
  const displayEventsTotal = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.events
    : eventsPreviewTotal;
  const displayGroups = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.groups
    : previewGroups;
  const displayPostCount = visualMockEnabled
    ? COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.posts
    : displayPosts.length;
  const displayLoadingFeed = visualMockEnabled ? false : isLoading;
  const displayFeedError = visualMockEnabled ? false : isError;
  const displayLoadingBusinesses = visualMockEnabled
    ? false
    : loadingBusinesses;
  const displayLoadingServices = visualMockEnabled ? false : loadingServices;
  const displayLoadingClassifieds = visualMockEnabled
    ? false
    : loadingClassifieds;
  const displayLoadingGastronomy = visualMockEnabled
    ? false
    : loadingGastronomy;
  const displayLoadingEvents = visualMockEnabled ? false : loadingEventsPreview;
  const displayLoadingGroups = visualMockEnabled ? false : loadingGroups;
  const displayHasNextPage = visualMockEnabled ? false : hasNextPage;
  const displayIsFetchingNextPage = visualMockEnabled
    ? false
    : isFetchingNextPage;
  const sortedDisplayPosts = useMemo(() => {
    const posts = [...displayPosts];
    const newestFirst = (
      left: DiscussionPreviewPost,
      right: DiscussionPreviewPost,
    ) => {
      const leftTime = left.created_at
        ? new Date(left.created_at).getTime()
        : 0;
      const rightTime = right.created_at
        ? new Date(right.created_at).getTime()
        : 0;
      return rightTime - leftTime;
    };

    if (postSort === "recent") return posts.sort(newestFirst);

    if (postSort === "most_commented") {
      return posts.sort(
        (left, right) =>
          (right.comments_count ?? 0) - (left.comments_count ?? 0) ||
          newestFirst(left, right),
      );
    }

    return posts.sort(
      (left, right) =>
        getPostEngagement(right) - getPostEngagement(left) ||
        newestFirst(left, right),
    );
  }, [displayPosts, postSort]);
  const trendingDiscussions = useMemo(
    () =>
      [...displayPosts]
        .sort((a, b) => getPostEngagement(b) - getPostEngagement(a))
        .slice(0, 4),
    [displayPosts],
  );

  const { campaign, isLoading: loadingAd } = useAdDelivery("sidebar_widget", {
    fallbackLocationId,
    enabled:
      filterReady &&
      !visualMockEnabled &&
      !isEmbeddedModule &&
      selectedView === "feed",
  });

  const moduleLinks = useMemo<ModuleLink[]>(() => {
    const links: ModuleLink[] = [
      {
        key: "feed",
        label: "Feed",
        icon: Home,
        href: isEmbeddedModule
          ? buildCommunityViewHref(communityUrls.feed, "feed")
          : undefined,
        view: isEmbeddedModule ? undefined : "feed",
        isActive: activeSection
          ? activeSection === "feed"
          : selectedView === "feed",
      },
      {
        key: "business",
        label: "Empresas",
        icon: Building2,
        href: isEmbeddedModule ? moduleUrls.business : undefined,
        view: isEmbeddedModule ? undefined : "business",
        surface: "business",
        isActive:
          activeSection === "business" ||
          (!activeSection && selectedView === "business"),
      },
      {
        key: "services",
        label: "Serviços",
        icon: Wrench,
        href: isEmbeddedModule ? moduleUrls.services : undefined,
        view: isEmbeddedModule ? undefined : "services",
        surface: "services",
        isActive:
          activeSection === "services" ||
          (!activeSection && selectedView === "services"),
      },
      {
        key: "classifieds",
        label: "Classificados",
        icon: Tag,
        href: isEmbeddedModule ? moduleUrls.classifieds : undefined,
        view: isEmbeddedModule ? undefined : "classifieds",
        surface: "classifieds",
        isActive:
          activeSection === "classifieds" ||
          (!activeSection && selectedView === "classifieds"),
      },
      {
        key: "gastronomy",
        label: "Gastronomia",
        icon: UtensilsCrossed,
        href: isEmbeddedModule ? moduleUrls.gastronomy : undefined,
        view: isEmbeddedModule ? undefined : "gastronomy",
        surface: "gastronomy",
        isActive:
          activeSection === "gastronomy" ||
          (!activeSection && selectedView === "gastronomy"),
      },
      {
        key: "map",
        label: "Mapa",
        href: moduleUrls.map,
        icon: MapPin,
        surface: "map",
        isActive: activeSection === "map",
      },
      {
        key: "events",
        label: "Eventos",
        href: isEmbeddedModule ? `${communityUrls.feed}#eventos` : "#eventos",
        icon: CalendarDays,
        surface: "communityEventsPreview",
      },
    ];
    return links.filter(
      (item) => !item.surface || isLaunchSurfaceEnabled(item.surface),
    );
  }, [
    moduleUrls.business,
    moduleUrls.classifieds,
    moduleUrls.gastronomy,
    moduleUrls.map,
    moduleUrls.services,
    activeSection,
    communityUrls.feed,
    isEmbeddedModule,
    selectedView,
  ]);

  const handleShareCommunity = useCallback(() => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      void navigator
        .share({ title: communityTitle, url: shareUrl })
        .catch(() => undefined);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
      void navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success("Link copiado"));
    }
  }, [communityTitle]);

  const handleSharePost = useCallback(
    (postId: string) => {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`
          : "";

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        void navigator
          .share({ title: communityTitle, url: shareUrl })
          .catch(() => undefined);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
        void navigator.clipboard
          .writeText(shareUrl)
          .then(() => toast.success("Link copiado"));
      }
    },
    [communityTitle],
  );

  const handleOpenComposer = useCallback(
    (defaultType?: PostType) => {
      if (mode === "member" && onOpenCreatePost) {
        onOpenCreatePost(defaultType);
        return;
      }

      onRequireLogin();
    },
    [mode, onOpenCreatePost, onRequireLogin],
  );

  const statItems = visualMockEnabled
    ? [
        {
          label: "Membros",
          value: COMMUNITY_OVERVIEW_VISUAL_FIXTURE.stats.members,
          icon: Users,
        },
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
        {
          label: "Empresas locais",
          value: stats?.businesses ?? 0,
          icon: Building2,
        },
        {
          label: "Classificados ativos",
          value: stats?.classifieds ?? 0,
          icon: Tag,
        },
        {
          label: "Publicações recentes",
          value: displayPostCount,
          icon: MessageCircle,
        },
        {
          label: "Eventos disponíveis",
          value: communityEventsPreviewEnabled ? displayEventsTotal : 0,
          icon: CalendarDays,
        },
      ];

  const focusShortcutCandidates: FocusShortcut[] = [
    {
      label: "Feed",
      detail: `${formatCount(displayPostCount)} publicações`,
      href: isEmbeddedModule
        ? buildCommunityViewHref(communityUrls.feed, "feed")
        : undefined,
      view: isEmbeddedModule ? undefined : ("feed" as const),
      icon: MessageCircle,
      isActive: !activeSection && selectedView === "feed",
    },
    {
      label: "Empresas",
      detail: `${formatCount(stats?.businesses ?? displayBusinesses.length)} locais`,
      href: isEmbeddedModule ? moduleUrls.business : undefined,
      view: isEmbeddedModule ? undefined : ("business" as const),
      icon: Building2,
      surface: "business",
      isActive:
        activeSection === "business" ||
        (!activeSection && selectedView === "business"),
    },
    {
      label: "Serviços",
      detail: `${formatCount(stats?.services ?? displayServices.length)} prestadores`,
      href: isEmbeddedModule ? moduleUrls.services : undefined,
      view: isEmbeddedModule ? undefined : ("services" as const),
      icon: Wrench,
      surface: "services",
      isActive:
        activeSection === "services" ||
        (!activeSection && selectedView === "services"),
    },
    {
      label: "Classificados",
      detail: `${formatCount(stats?.classifieds ?? displayClassifieds.length)} ativos`,
      href: isEmbeddedModule ? moduleUrls.classifieds : undefined,
      view: isEmbeddedModule ? undefined : ("classifieds" as const),
      icon: Tag,
      surface: "classifieds",
      isActive:
        activeSection === "classifieds" ||
        (!activeSection && selectedView === "classifieds"),
    },
    {
      label: "Gastronomia",
      detail: `${formatCount(displayGastronomy.length)} lugares`,
      href: isEmbeddedModule ? moduleUrls.gastronomy : undefined,
      view: isEmbeddedModule ? undefined : ("gastronomy" as const),
      icon: UtensilsCrossed,
      surface: "gastronomy",
      isActive:
        activeSection === "gastronomy" ||
        (!activeSection && selectedView === "gastronomy"),
    },
  ];
  const focusShortcutLinks = focusShortcutCandidates.filter(
    (item) => !item.surface || isLaunchSurfaceEnabled(item.surface),
  );

  return (
    <div
      className="w-full min-w-0 px-3 py-4 text-white sm:px-4 md:px-6 xl:px-0 xl:py-0"
      data-community-overview="community-first"
      data-visual-mock={
        visualMockEnabled
          ? COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE
          : undefined
      }
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
                    onViewChange={handleViewChange}
                    onNavigate={handleModuleNavigate}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-normal transition-colors",
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

        <main className="min-w-0 space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_23.75rem] xl:gap-x-4 xl:gap-y-2 xl:px-5 xl:py-3 xl:space-y-0">
          <section
            data-community-hero="true"
            className={cn(
              "relative isolate overflow-hidden rounded-2xl border border-white/12 bg-[#06141d] shadow-2xl shadow-black/20 sm:rounded-[24px] xl:col-start-1 xl:row-start-1",
              isEmbeddedModule && "xl:col-span-2",
            )}
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(2,12,18,0.84) 0%, rgba(2,12,18,0.64) 43%, rgba(2,12,18,0.16) 100%), url(${heroImage})`,
              backgroundPosition: "center 48%",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.12),transparent_32%)]" />
            <div className="relative px-3 py-3 sm:min-h-[14rem] sm:px-5 sm:py-3 lg:min-h-[15rem] lg:px-7 lg:py-4 xl:h-[136px] xl:min-h-0 xl:px-5 xl:py-4">
              <div className="flex min-w-0 flex-col justify-between gap-2 sm:gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-center xl:gap-5">
                <div className="flex min-w-0 flex-row items-center gap-3 sm:gap-4 xl:gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/22 bg-white/10 shadow-xl shadow-black/25 sm:h-20 sm:w-20 md:h-24 md:w-24 md:rounded-2xl xl:h-24 xl:w-24">
                    <SafeImage
                      src={heroImage}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  </div>
                  <div className="min-w-0 xl:max-w-[36rem]">
                    <h1 className="text-xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl xl:text-[1.75rem]">
                      {communityTitle}
                    </h1>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-normal text-white/78 sm:mt-1 sm:gap-2 sm:text-sm xl:text-xs">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-300 sm:h-4 sm:w-4" />
                      <span className="truncate">
                        {communityLocationLine}
                        {locationLabel !== communityLocationLine
                          ? ` - ${locationLabel}`
                          : ""}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 max-w-xl overflow-hidden text-xs font-normal leading-4 text-white/70 sm:mt-2 sm:text-base sm:leading-6 xl:text-xs xl:leading-[1.15rem]">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 xl:grid xl:grid-cols-[minmax(0,7.25rem)_12rem] xl:items-center xl:gap-3">
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 xl:grid-cols-1 xl:gap-2">
                    {statItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={cn(
                            "min-w-0 rounded-lg border border-white/10 bg-black/24 px-1.5 py-1 backdrop-blur sm:rounded-xl sm:px-2.5 md:rounded-2xl md:px-4 md:py-2 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-0",
                            index >= 2 ? "xl:hidden" : "",
                          )}
                        >
                          <div className="flex items-center gap-1 text-white sm:gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-teal-300 sm:h-4 sm:w-4 xl:text-white/82" />
                            <strong className="truncate text-xs sm:text-sm md:text-base xl:text-xl">
                              {formatCount(item.value)}
                            </strong>
                          </div>
                          <p className="mt-0.5 truncate text-[0.55rem] leading-tight text-white/58 sm:text-[0.66rem] md:text-xs xl:mt-1">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-nowrap sm:gap-3 sm:overflow-x-auto sm:pb-1 sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] md:flex-wrap md:justify-end md:overflow-visible md:pb-0 xl:flex-col xl:gap-2 xl:pb-0 sm:[&::-webkit-scrollbar]:hidden">
                    {mode === "member" ? (
                      <Button
                        type="button"
                        onClick={() => onOpenCreatePost?.()}
                        className="min-h-8 w-full rounded-lg bg-teal-400 px-2 text-xs font-semibold text-slate-950 hover:bg-teal-300 sm:min-h-9 sm:w-auto sm:shrink-0 sm:rounded-xl sm:px-3 sm:text-sm md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Criar publicação
                      </Button>
                    ) : (
                      <Link
                        to={loginHref}
                        className="inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-teal-400 px-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-teal-300 sm:min-h-9 sm:w-auto sm:shrink-0 sm:rounded-xl sm:px-3 sm:text-sm md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                      >
                        <LogIn className="mr-2 h-4 w-4 xl:hidden" />
                        <span className="xl:hidden">Participar</span>
                        <span className="hidden xl:inline">
                          Participar da comunidade
                        </span>
                      </Link>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShareCommunity}
                      className="min-h-8 w-full rounded-lg border-white/20 bg-black/20 px-2 text-xs text-white hover:bg-white/10 hover:text-white sm:min-h-9 sm:w-auto sm:shrink-0 sm:rounded-xl sm:px-3 sm:text-sm md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
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
                const view = item.view;
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

                return view ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleViewChange(view)}
                    className={className}
                    aria-pressed={item.isActive}
                    aria-controls="community-primary-content"
                  >
                    {content}
                  </button>
                ) : item.href?.startsWith("#") ? (
                  <a key={item.label} href={item.href} className={className}>
                    {content}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href ?? "#"}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="sm:hidden" data-community-mobile-primary-nav="true">
            <div className="grid grid-cols-4 gap-1.5">
              {moduleLinks.slice(0, 3).map((item) => (
                <ModuleNavLink
                  key={item.key}
                  item={item}
                  onViewChange={handleViewChange}
                  labelClassName="max-w-none whitespace-nowrap"
                  className={cn(
                    "inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border px-1 text-[0.625rem] font-semibold leading-none transition-colors min-[360px]:text-[0.6875rem] min-[480px]:min-h-11 min-[480px]:flex-row min-[480px]:gap-1.5 min-[480px]:px-2",
                    item.isActive
                      ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                      : "border-white/10 bg-white/[0.04] text-white/75 hover:text-white",
                  )}
                />
              ))}
              <button
                type="button"
                data-community-sections-trigger="true"
                onClick={() => setMobileSectionsExpanded((current) => !current)}
                className={cn(
                  "inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-1 text-[0.625rem] font-semibold leading-none text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 min-[360px]:text-[0.6875rem] min-[480px]:min-h-11 min-[480px]:flex-row min-[480px]:gap-1.5 min-[480px]:px-2",
                  (mobileSectionsExpanded || isEmbeddedModule) &&
                    "border-teal-300/35 bg-teal-300/10 text-teal-100",
                )}
                aria-expanded={mobileSectionsExpanded}
                aria-controls={mobileSectionsId}
              >
                <LayoutGrid
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Seções</span>
              </button>
            </div>
            {mobileSectionsExpanded ? (
              <nav
                id={mobileSectionsId}
                data-community-sections-menu="true"
                className="mt-2 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-[#071922]/96 p-2 shadow-xl shadow-black/20"
                aria-label="Outras seções da comunidade"
              >
                {moduleLinks.slice(3).map((item) => (
                  <ModuleNavLink
                    key={item.key}
                    item={item}
                    onViewChange={handleViewChange}
                    onNavigate={handleModuleNavigate}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 text-xs font-medium transition-colors hover:bg-white/[0.055] hover:text-white",
                      item.isActive
                        ? "bg-teal-300/12 text-teal-100"
                        : "text-white/68",
                    )}
                  />
                ))}
              </nav>
            ) : null}
          </div>

          <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex xl:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => (
              <ModuleNavLink
                key={item.key}
                item={item}
                onViewChange={handleViewChange}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors",
                  item.isActive
                    ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
                )}
              />
            ))}
          </div>

          <div className="hidden gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:hidden [&::-webkit-scrollbar]:hidden">
            {focusShortcutLinks.map((item) => {
              const Icon = item.icon;
              const view = item.view;
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
                    <span className="block truncate text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-white/50">
                      {item.detail}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
                </>
              );

              return view ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleViewChange(view)}
                  className={className}
                  aria-pressed={item.isActive}
                  aria-controls="community-primary-content"
                >
                  {content}
                </button>
              ) : item.href?.startsWith("#") ? (
                <a key={item.label} href={item.href} className={className}>
                  {content}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href ?? "#"}
                  className={className}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          <div
            id="community-primary-content"
            className={cn(
              "grid min-w-0 gap-4 xl:col-start-1 xl:row-start-2",
              (isEmbeddedModule || selectedView !== "feed") && "xl:col-span-2",
            )}
            aria-live="polite"
            data-community-module-content={
              isEmbeddedModule ? activeSection : undefined
            }
          >
            <div className="order-1 min-w-0 space-y-4 xl:space-y-2">
              {selectedView === "feed" ? (
                children ? (
                  children
                ) : (
                  <>
                    <CommunityComposerEntry
                      id="feed"
                      communityName={communityTitle}
                      onOpenCreatePost={handleOpenComposer}
                      avatarUrl={visualMockEnabled ? personaMorador : undefined}
                      className="xl:p-3"
                    />

                    <CommunityFeedContextNavigation
                      activeContextTab={feedContextTab}
                      onContextTabChange={handleFeedContextTabChange}
                    />

                    <div
                      id="community-feed-context-panel"
                      className="space-y-3"
                      data-community-feed-context-panel={feedContextTab}
                    >
                      {feedContextTab === "feed" ? (
                        <>
                          <SurfacePanel className="p-2.5">
                            <CommunityPostSortControls
                              value={postSort}
                              onChange={setPostSort}
                            />
                            {displayLoadingFeed ? (
                              <div className="mt-3 space-y-2">
                                {[0, 1, 2].map((index) => (
                                  <div
                                    key={index}
                                    className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                                  />
                                ))}
                              </div>
                            ) : displayFeedError ? (
                              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-4 text-sm text-red-100">
                                Erro ao carregar feed:{" "}
                                {error?.message ??
                                  "tente novamente em instantes."}
                              </p>
                            ) : displayPosts.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm text-white/50">
                                Nenhuma publicação pública encontrada neste
                                território.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {sortedDisplayPosts.map((post) => {
                                  const Icon = getPublicPostTypeIcon(post.type);
                                  const avatarUrl = getPublicPostAvatar(post);
                                  const summary = getPublicPostSummary(post);
                                  const postImages = getPublicPostImages(post);
                                  return (
                                    <article
                                      id={`post-${post.id}`}
                                      key={post.id}
                                      data-feed-post-id={post.id}
                                      className="rounded-xl border border-white/10 bg-[#081e28]/92 px-3 py-2.5 shadow-lg shadow-black/10 [content-visibility:auto] [contain-intrinsic-size:0_520px]"
                                    >
                                      <div className="flex min-w-0 items-start gap-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-teal-300/12 text-teal-200">
                                          {avatarUrl ? (
                                            <SafeImage
                                              src={avatarUrl}
                                              alt=""
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <Icon className="h-4 w-4" />
                                          )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-xs font-semibold text-white">
                                            {getPublicPostAuthor(post)}
                                            <span className="mx-1.5 font-normal text-white/30">
                                              •
                                            </span>
                                            <span className="font-normal text-white/48">
                                              {getPublicPostRole(post)}
                                            </span>
                                          </p>
                                          <p className="mt-0.5 text-[0.68rem] text-white/40">
                                            {formatPublicPostDate(
                                              post.created_at,
                                            )}{" "}
                                            atrás
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="px-1 text-lg leading-none text-white/46"
                                          aria-label="Mais opções"
                                        >
                                          •••
                                        </button>
                                      </div>
                                      <div className="mt-1.5">
                                        <span className="inline-flex min-h-4 items-center rounded px-1.5 text-[0.61rem] font-medium text-teal-200 ring-1 ring-inset ring-teal-300/15">
                                          {getPublicPostTypeLabel(post.type)}
                                        </span>
                                        <h3 className="mt-1 text-[0.92rem] font-semibold leading-[1.15rem] text-white/92">
                                          {getPublicPostTitle(post)}
                                        </h3>
                                        {summary ? (
                                          <p className="mt-0.5 text-[0.7rem] leading-4 text-white/52">
                                            {summary}
                                          </p>
                                        ) : null}
                                        {postImages.length > 0 ? (
                                          <ImageGallery
                                            images={postImages}
                                            className="mt-2"
                                          />
                                        ) : null}
                                      </div>
                                      <div className="mt-1.5 flex items-center gap-6 border-t border-white/[0.07] pt-1.5 text-[0.7rem] text-white/48">
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="inline-flex items-center gap-1.5 hover:text-white"
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                          {post.comments_count ?? 0}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="inline-flex items-center gap-1.5 hover:text-white"
                                        >
                                          <Heart className="h-3.5 w-3.5" />
                                          {post.likes_count ?? 0}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSharePost(post.id)
                                          }
                                          className="inline-flex items-center gap-1.5 hover:text-white"
                                        >
                                          <Share2 className="h-3.5 w-3.5" />
                                          Compartilhar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="ml-auto inline-flex items-center hover:text-white"
                                          aria-label="Salvar publicação"
                                        >
                                          <Bookmark className="h-3.5 w-3.5" />
                                        </button>
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
                                  {displayIsFetchingNextPage
                                    ? "Carregando..."
                                    : "Carregar mais"}
                                </Button>
                              </div>
                            ) : null}
                          </SurfacePanel>
                        </>
                      ) : feedContextTab === "groups" ? (
                        <CommunityGroupsPreview
                          id="feed-groups-tab"
                          className="p-3 sm:p-4"
                          groups={displayGroups}
                          loading={displayLoadingGroups}
                          actionHref={communityUrls.groups}
                          groupHref={(group) =>
                            visualMockEnabled
                              ? "#feed-groups-tab"
                              : communityUrls.groupDetail(group.id)
                          }
                        />
                      ) : (
                        <CommunityDiscussionsPreview
                          id="feed-discussions-tab"
                          className="p-3 sm:p-4"
                          title="Discussões da comunidade"
                          posts={trendingDiscussions}
                          loading={displayLoadingFeed}
                        />
                      )}
                    </div>
                  </>
                )
              ) : selectedView === "groups" ? (
                (children ?? (
                  <SurfacePanel id="groups-view" className="p-3 sm:p-4">
                    <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-white">
                          Grupos da comunidade
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-white/52">
                          Conversas organizadas por interesses e necessidades
                          locais.
                        </p>
                      </div>
                      {mode === "public" ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onRequireLogin}
                          className="shrink-0 rounded-xl border-teal-300/30 bg-teal-300/10 text-xs text-teal-100 hover:bg-teal-300/15 hover:text-white"
                        >
                          Participar
                        </Button>
                      ) : null}
                    </div>
                    {displayLoadingGroups ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
                          />
                        ))}
                      </div>
                    ) : displayGroups.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {displayGroups.map((group) => (
                          <GroupPreviewItem
                            key={group.id}
                            group={group}
                            href={
                              visualMockEnabled
                                ? "#groups-view"
                                : communityUrls.groupDetail(group.id)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyCommunityState
                        icon={Users}
                        title="Nenhum grupo ativo"
                        description="Os primeiros grupos desta comunidade aparecerão aqui assim que forem publicados."
                      />
                    )}
                  </SurfacePanel>
                ))
              ) : selectedView === "discussions" ? (
                (children ?? (
                  <div className="space-y-3">
                    <CommunityComposerEntry
                      communityName={communityTitle}
                      onOpenCreatePost={handleOpenComposer}
                      avatarUrl={visualMockEnabled ? personaMorador : undefined}
                    />
                    <SurfacePanel id="discussions-view" className="p-3 sm:p-4">
                      <div className="mb-4">
                        <h2 className="text-base font-semibold text-white">
                          Discussões da comunidade
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-white/52">
                          Perguntas, recomendações e assuntos com participação
                          dos moradores.
                        </p>
                      </div>
                      {displayLoadingFeed ? (
                        <div className="space-y-2">
                          {[0, 1, 2, 3].map((index) => (
                            <div
                              key={index}
                              className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
                            />
                          ))}
                        </div>
                      ) : trendingDiscussions.length > 0 ? (
                        <div className="space-y-3">
                          {displayPosts.map((post) => (
                            <DiscussionPreviewItem key={post.id} post={post} />
                          ))}
                        </div>
                      ) : (
                        <EmptyCommunityState
                          icon={MessageCircle}
                          title="Nenhuma discussão publicada"
                          description="As conversas públicas desta comunidade aparecerão aqui."
                        />
                      )}
                    </SurfacePanel>
                  </div>
                ))
              ) : selectedView === "business" ? (
                <CommunityModulePreview
                  icon={Building2}
                  title="Empresas da comunidade"
                  description="Negócios ativos e verificados que atendem este território."
                  countLabel={`${formatCount(stats?.businesses ?? displayBusinesses.length)} locais`}
                  actionHref={moduleUrls.business}
                  actionLabel="Ver todas as empresas"
                  loading={displayLoadingBusinesses}
                  isEmpty={displayBusinesses.length === 0}
                  emptyMessage="Nenhuma empresa ativa cadastrada nesta comunidade."
                >
                  {displayBusinesses.map((business) => (
                    <BusinessPreviewRow
                      key={business.id}
                      business={business}
                      href={buildBusinessHref(business, businessUrls.canonical)}
                    />
                  ))}
                </CommunityModulePreview>
              ) : selectedView === "services" ? (
                <CommunityModulePreview
                  icon={Wrench}
                  title="Serviços da comunidade"
                  description="Prestadores disponíveis para necessidades locais e recorrentes."
                  countLabel={`${formatCount(stats?.services ?? displayServices.length)} prestadores`}
                  actionHref={moduleUrls.services}
                  actionLabel="Ver todos os serviços"
                  loading={displayLoadingServices}
                  isEmpty={displayServices.length === 0}
                  emptyMessage="Nenhum prestador ativo encontrado nesta comunidade."
                >
                  {displayServices.map((service) => (
                    <ServicePreviewRow key={service.id} service={service} />
                  ))}
                </CommunityModulePreview>
              ) : selectedView === "classifieds" ? (
                <CommunityModulePreview
                  icon={Tag}
                  title="Classificados da comunidade"
                  description="Itens anunciados por pessoas e negócios deste território."
                  countLabel={`${formatCount(stats?.classifieds ?? displayClassifieds.length)} ativos`}
                  actionHref={moduleUrls.classifieds}
                  actionLabel="Ver todos os classificados"
                  loading={displayLoadingClassifieds}
                  isEmpty={displayClassifieds.length === 0}
                  emptyMessage="Nenhum classificado ativo encontrado nesta comunidade."
                >
                  {displayClassifieds.map((item) => (
                    <ClassifiedPreviewRow key={item.id} item={item} />
                  ))}
                </CommunityModulePreview>
              ) : (
                <CommunityModulePreview
                  icon={UtensilsCrossed}
                  title="Gastronomia da comunidade"
                  description="Restaurantes, lanchonetes e sabores encontrados perto de você."
                  countLabel={`${formatCount(displayGastronomy.length)} lugares`}
                  actionHref={moduleUrls.gastronomy}
                  actionLabel="Ver toda a gastronomia"
                  loading={displayLoadingGastronomy}
                  isEmpty={displayGastronomy.length === 0}
                  emptyMessage="Nenhum estabelecimento gastronômico encontrado nesta comunidade."
                >
                  {displayGastronomy.map((business) => (
                    <BusinessPreviewRow
                      key={business.id}
                      business={business}
                      href={buildBusinessHref(business, businessUrls.canonical)}
                    />
                  ))}
                </CommunityModulePreview>
              )}
            </div>
          </div>

          {!isEmbeddedModule && selectedView === "feed" ? (
            <div className="min-w-0 space-y-4 xl:col-start-2 xl:row-span-5 xl:row-start-1 xl:space-y-2">
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
          ) : null}
        </main>
      </div>
    </div>
  );
}
