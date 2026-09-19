import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  ArrowLeftRight,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Compass,
  Heart,
  Home,
  LayoutGrid,
  LogIn,
  MapPin,
  Megaphone,
  Newspaper,
  MessageCircle,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Tag,
  UserPlus,
  UserRound,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
} from "@/app/config/launchScope";
import { useAdDelivery, SponsoredAdCard } from "@/core/business/promotions";
import { useBusinessUrls } from "@/core/business/hooks/useBusinessUrls";
import { ClassifiedUrlService } from "@/core/classifieds/services/ClassifiedUrlService";
import { useCommunityFeedSimple } from "@/core/community-feed/hooks/useCommunityFeed";
import { CommunityComposerEntry } from "@/core/community-feed/components/CommunityComposerEntry";
import { ImageGallery } from "@/core/community-feed/components/ImageGallery";
import {
  CommunityGroupsService,
  type GroupRow,
} from "@/core/community-groups/services/CommunityGroupsService";
import {
  COMMUNITY_FEED_SORT_FILTERS,
  type CommunityFeedSortType,
} from "@/core/community-feed/utils/communityFeedTab";
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
import {
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
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
} from "@/core/community-feed/navigation";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import { sharePost } from "@/core/posts/utils/postShare";
import { eventRuntimeService, type PublicEvent } from "@/core/community-events";
import { Button } from "@/shared/components/ui/button";
import { SafeImage } from "@/shared/components/security/SafeImage";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { getRecordValue } from "@/shared/utils/recordLookup";

type CommunityOverviewMode = "public" | "member";

export interface CommunityOverviewSurfaceProps {
  resolved?: ResolvedTerritory;
  territoryName: string;
  territoryFilter: TerritoryFilter;
  onRequireLogin: () => void;
  loginHref: string;
  communityId?: string | null;
  communityProfile?: TerritorialCommunityProfile | null;
  mode?: CommunityOverviewMode;
  canCreatePost?: boolean;
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

const COMMUNITY_CONCEPT_CONTEXT_SHORTCUTS = [
  { view: "feed", label: "Publicações", icon: MessageCircle },
  { view: "alerts", label: "Avisos", icon: Megaphone },
  { view: "groups", label: "Grupos", icon: Users },
  { view: "events", label: "Agenda", icon: CalendarDays },
] as const satisfies ReadonlyArray<{
  view: "feed" | "alerts" | "groups" | "events";
  label: string;
  icon: React.ElementType;
}>;

type CommunityFeedContextTab =
  | (typeof COMMUNITY_FEED_CONTEXT_SHORTCUTS)[number]["view"]
  | (typeof COMMUNITY_CONCEPT_CONTEXT_SHORTCUTS)[number]["view"];

type CommunityVisualMockState =
  | "member"
  | "visitor"
  | "pending"
  | "empty"
  | "error";

type CommunityVisualAlert = {
  id: string;
  kind: "relato" | "comunicado";
  author_name: string;
  territory_label: string;
  title: string;
  detail: string;
};

function EventPreviewItem({ event }: { event: PublicEvent }) {
  const dateParts = getEventDateParts(event.date);

  return (
    <article className="rounded-xl border border-territory-border bg-territory-raised p-3">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-territory-border bg-territory-canvas text-center">
          <span className="text-lg font-bold leading-none text-territory-ink">
            {dateParts.day}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase text-territory-muted">
            {dateParts.month}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-territory-ink">
            {event.title}
          </p>
          <p className="mt-1 truncate text-xs text-territory-brand">
            {normalizeCategoryLabel(event.category)}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-territory-muted">
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
      className="group flex min-w-0 items-center gap-3 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-territory-raised"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand">
        <Users className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-territory-ink">
          {group.name}
        </span>
        <span className="block truncate text-xs text-territory-muted">
          {normalizeCategoryLabel(group.category)} - {formatCount(membersCount)}{" "}
          membros
        </span>
      </span>
      <span className="shrink-0 rounded-lg border border-territory-brand/25 px-2 py-1 text-xs font-semibold text-territory-brand">
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
  territory_label?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  response_preview?: {
    author_name: string;
    avatar_url?: string | null;
    content: string;
  } | null;
  author_profile?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function getCommunityConceptPostAge(postId: string): string {
  switch (postId) {
    case "visual-post-reforco-escolar":
      return "2h";
    case "visual-post-encontro-domingo":
      return "1 dia";
    case "visual-post-padaria":
      return "3 dias";
    default:
      return "agora";
  }
}

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
      className="group block rounded-xl px-1.5 py-1 transition-colors hover:bg-territory-raised"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-territory-brand/10 text-territory-sun">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 text-sm font-semibold leading-5 text-territory-ink">
            {getPublicPostPreview(post.content, 76)}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-territory-muted">
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
        "rounded-territory-highlight border border-territory-border bg-territory-surface p-4 text-territory-ink shadow-territory-highlight",
        id &&
          "scroll-mt-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/70",
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
  compact = false,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        compact ? "mb-2" : "mb-3",
      )}
    >
      <h2
        className={cn(
          "text-sm font-semibold text-territory-ink",
          compact && "m-0 text-base leading-5",
        )}
      >
        {title}
      </h2>
      {actionHref && actionLabel ? (
        <Link
          to={actionHref}
          className="shrink-0 text-xs font-semibold text-territory-brand transition-colors hover:text-territory-brand-strong"
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
      className="flex min-w-0 gap-6 overflow-x-auto border-b border-territory-border bg-transparent px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            "relative inline-flex min-h-10 shrink-0 items-center gap-1.5 border-0 px-0 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-territory-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/70",
            activeContextTab === view
              ? "font-semibold text-territory-brand after:bg-territory-brand"
              : "text-territory-muted",
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

function CommunityConceptContextNavigation({
  activeContextTab,
  onContextTabChange,
}: {
  activeContextTab: CommunityFeedContextTab;
  onContextTabChange: (tab: CommunityFeedContextTab) => void;
}) {
  return (
    <div
      className="flex min-w-0 gap-7 overflow-x-auto border-b border-territory-border bg-transparent px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Navegação da comunidade"
    >
      {COMMUNITY_CONCEPT_CONTEXT_SHORTCUTS.map(({ view, label }) => (
        <button
          key={view}
          type="button"
          data-community-feed-shortcut={view}
          onClick={() => onContextTabChange(view)}
          aria-pressed={activeContextTab === view}
          className={cn(
            "relative inline-flex min-h-7 shrink-0 items-center border-0 px-0 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent hover:text-territory-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/70",
            activeContextTab === view
              ? "font-semibold text-territory-brand after:bg-territory-brand"
              : "text-territory-muted",
          )}
          aria-controls="community-feed-context-panel"
        >
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
      <span className="shrink-0 text-xs font-medium text-territory-muted">
        Ordenar:
      </span>
      {COMMUNITY_FEED_SORT_FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex min-h-8 shrink-0 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/70",
            value === id
              ? "border-territory-brand/35 bg-territory-brand/12 text-territory-brand"
              : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-brand/25 hover:text-territory-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CommunityConceptFeedFilters({
  value,
  onChange,
}: {
  value: CommunityFeedSortType;
  onChange: (sort: CommunityFeedSortType) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <label className="sr-only" htmlFor="community-concept-scope">
        Escopo das publicações
      </label>
      <select
        id="community-concept-scope"
        defaultValue="all"
        className="min-h-8 shrink-0 rounded-lg border border-territory-border bg-territory-raised px-2.5 text-xs font-medium text-territory-ink outline-none focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20"
      >
        <option value="all">Todos os bairros</option>
        <option value="territory">Complexo do Nordeste</option>
      </select>
      <label className="sr-only" htmlFor="community-concept-sort">
        Ordenação das publicações
      </label>
      <select
        id="community-concept-sort"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as CommunityFeedSortType)
        }
        className="min-h-8 shrink-0 rounded-lg border border-territory-border bg-territory-raised px-2.5 text-xs font-medium text-territory-ink outline-none focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20"
      >
        <option value="popular">Mais relevantes</option>
        <option value="recent">Mais recentes</option>
        <option value="commented">Mais comentadas</option>
      </select>
      <button
        type="button"
        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-territory-border bg-territory-raised text-territory-brand transition-colors hover:bg-territory-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/30"
        aria-label="Abrir filtros das publicações"
        onClick={() => document.getElementById("community-concept-scope")?.focus()}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CommunityVisitorParticipationCard({
  onRequireLogin,
}: {
  onRequireLogin: () => void;
}) {
  return (
    <SurfacePanel className="p-4 text-center sm:p-5">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-territory-brand/8 text-4xl">
        💬
      </div>
      <h2 className="mt-4 text-lg font-bold text-territory-ink">
        Conheça as conversas do lugar.
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-territory-muted">
        Você está vendo publicações públicas.
      </p>
      <button
        type="button"
        onClick={onRequireLogin}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 sm:w-auto"
      >
        Entrar para participar
      </button>
      <a
        href="#community-feed-context-panel"
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-territory-brand/35 px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/8 sm:w-auto"
      >
        Explorar publicações
      </a>
    </SurfacePanel>
  );
}

function CommunityPendingParticipationCard() {
  return (
    <SurfacePanel className="p-4 text-center sm:p-5">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-territory-brand/8 text-4xl">
        🕒
      </div>
      <h2 className="mt-4 text-lg font-bold text-territory-ink">
        Solicitação em análise
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-territory-muted">
        Acompanhe sua solicitação para saber quando poderá participar.
      </p>
      <Link
        to="/conta"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 sm:w-auto"
      >
        Ver meus vínculos
      </Link>
      <a
        href="#community-feed-context-panel"
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-territory-brand/35 px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/8 sm:w-auto"
      >
        Explorar conteúdo público
      </a>
      <p className="mx-auto mt-4 max-w-sm rounded-xl bg-territory-brand/6 px-3 py-3 text-left text-xs leading-5 text-territory-muted">
        Enquanto isso, você pode continuar explorando as publicações públicas
        da comunidade.
      </p>
    </SurfacePanel>
  );
}

function CommunityConceptFeedState({
  kind,
  onCreatePost,
}: {
  kind: "empty" | "error";
  onCreatePost: () => void;
}) {
  const isError = kind === "error";

  return (
    <SurfacePanel className="p-5 text-center sm:p-7">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-territory-brand/8 text-territory-brand">
        {isError ? (
          <CircleHelp className="h-10 w-10" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-10 w-10" aria-hidden="true" />
        )}
      </div>
      <h2 className="mt-4 text-lg font-bold text-territory-ink">
        {isError ? "Falha ao carregar" : "Sem publicações"}
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-territory-muted">
        {isError
          ? "Não conseguimos carregar as publicações."
          : "A conversa pode começar com você."}
      </p>
      {isError ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-territory-brand/35 px-4 text-sm font-semibold text-territory-brand hover:bg-territory-brand/8"
        >
          Tentar novamente
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreatePost}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-territory-sun px-5 text-sm font-bold text-territory-ink hover:bg-territory-sun/90"
        >
          Criar publicação
        </button>
      )}
      {!isError ? (
        <p className="mt-2 text-xs text-territory-muted">Para perfil autorizado.</p>
      ) : null}
    </SurfacePanel>
  );
}

function CommunityAlertsPreview({
  alerts,
}: {
  alerts: CommunityVisualAlert[];
}) {
  const [filter, setFilter] = useState<"all" | "relato" | "comunicado">("all");
  const visibleAlerts =
    filter === "all" ? alerts : alerts.filter((alert) => alert.kind === filter);

  return (
    <SurfacePanel className="p-3 sm:p-4">
      <SectionHeader title="Avisos da comunidade" />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          ["all", "Todos"],
          ["relato", "Relatos"],
          ["comunicado", "Comunicados"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value as "all" | "relato" | "comunicado")}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition-colors",
              filter === value
                ? "bg-territory-sun text-territory-ink"
                : "bg-territory-brand/8 text-territory-ink hover:bg-territory-brand/15",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <article
            key={alert.id}
            id={alert.id}
            className="rounded-xl border border-territory-border bg-territory-raised p-3"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  alert.kind === "comunicado"
                    ? "bg-territory-sun/30 text-territory-ink"
                    : "bg-territory-brand/10 text-territory-brand",
                )}
              >
                <Megaphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-territory-muted">
                  {alert.kind === "comunicado"
                    ? "Comunicado da organização"
                    : "Relato da comunidade"}
                </p>
                <p className="mt-1 text-xs text-territory-muted">
                  {alert.author_name} · {alert.territory_label}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-territory-ink">
                  {alert.title}
                </h3>
                <p className="mt-0.5 text-xs text-territory-muted">
                  {alert.detail}
                </p>
                <a
                  href={`#${alert.id}`}
                  className="mt-2 inline-flex min-h-8 items-center gap-1 rounded-lg border border-territory-brand/35 px-2.5 text-xs font-semibold text-territory-brand hover:bg-territory-brand/8"
                >
                  {alert.kind === "comunicado" ? "Ver comunicado" : "Ver relato"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SurfacePanel>
  );
}

function CommunityConceptSidebar({
  alerts,
  groups,
  events,
  eventsHref,
  groupsHref,
}: {
  alerts: CommunityVisualAlert[];
  groups: GroupRow[];
  events: PublicEvent[];
  eventsHref?: string;
  groupsHref?: string;
}) {
  const alert = alerts[0];
  const group = groups[0];
  const event = events[0];
  const eventDate = event ? getEventDateParts(event.date) : null;

  return (
    <div className="space-y-3">
      {alert ? (
        <SurfacePanel id="concept-sidebar-alert" className="p-3 px-4 pb-4">
          <SectionHeader title="Avisos da comunidade" compact />
          <div className="flex items-start gap-2.5">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-territory-sun" />
            <div className="min-w-0">
              <p className="mb-0 whitespace-nowrap text-[13px] font-semibold text-territory-ink">{alert.title}</p>
              <p className="mt-1 mb-0 text-xs text-territory-muted">
                {alert.kind === "relato" ? `Relato de ${alert.author_name}` : alert.author_name} · {alert.detail.replace("Ainda sem confirmação.", "Não confirmado")}
              </p>
              <a
                href="#concept-sidebar-alert"
                className="mt-3 inline-flex items-center gap-1 text-sm leading-4 font-semibold text-territory-brand hover:text-territory-brand-strong"
              >
                Ver aviso <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </SurfacePanel>
      ) : null}

      {group ? (
        <SurfacePanel className="p-3 px-4 pb-2.5">
          <SectionHeader title="Encontre seu grupo" compact />
          <div className="overflow-hidden rounded-xl border border-territory-border bg-territory-raised">
            <div className="flex h-[5.25rem] items-center justify-center overflow-hidden bg-territory-brand/10 text-territory-brand">
              {group.avatar_url ? (
                <SafeImage
                  src={group.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users className="h-8 w-8" />
              )}
            </div>
            <div className="px-0 py-2">
              <p className="mb-0 text-sm font-semibold text-territory-ink">{group.name}</p>
              <p className="mt-1 mb-0 line-clamp-2 text-[13px] leading-4 text-territory-muted">
                {group.description ?? "Troque ideias e participe das conversas do território."}
              </p>
              {groupsHref ? (
                <Link
                  to={groupsHref}
                  className="mt-2 inline-flex items-center gap-1 text-sm leading-4 font-semibold text-territory-brand hover:text-territory-brand-strong"
                >
                  Conhecer grupos <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        </SurfacePanel>
      ) : null}

      {event && eventDate ? (
        <SurfacePanel className="p-4 px-4">
          <SectionHeader title="Na agenda" compact />
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-territory-brand/8 text-territory-brand">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="mb-0 truncate text-sm font-semibold text-territory-ink">{event.title}</p>
              <p className="mt-1 mb-0 text-sm leading-4 text-territory-muted">Sábado · {event.location}</p>
            </div>
          </div>
          {eventsHref ? (
            <Link
              to={eventsHref}
              className="mt-2 inline-flex items-center gap-1 text-sm leading-4 font-semibold text-territory-brand hover:text-territory-brand-strong"
            >
              Ver agenda <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </SurfacePanel>
      ) : null}

      <nav
        aria-label="Links da comunidade"
        className="rounded-xl border border-territory-border bg-territory-raised px-3"
      >
        <Link to="/conta" className="flex min-h-9 items-center border-b border-territory-border text-sm leading-4 font-medium text-territory-ink">
          <Bookmark className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          Meus vínculos <ChevronRight className="ml-auto h-3.5 w-3.5 text-territory-muted" />
        </Link>
        <a href="#community-primary-content" className="flex min-h-9 items-center border-b border-territory-border text-sm leading-4 font-medium text-territory-ink">
          <Bookmark className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          Publicações salvas <ChevronRight className="ml-auto h-3.5 w-3.5 text-territory-muted" />
        </a>
        <a href="#regras-comunidade" className="flex min-h-9 items-center text-sm leading-4 font-medium text-territory-ink">
          <ShieldCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
          Regras da comunidade <ChevronRight className="ml-auto h-3.5 w-3.5 text-territory-muted" />
        </a>
      </nav>
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
              className="h-14 animate-pulse rounded-xl bg-territory-raised"
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
        <p className="text-sm leading-5 text-territory-muted">
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
              className="h-11 animate-pulse rounded-xl bg-territory-raised"
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
        <p className="text-sm leading-5 text-territory-muted">
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
      <div className="flex min-w-0 items-start gap-3 border-b border-territory-border px-3 py-3 sm:px-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-territory-ink">
              {title}
            </h2>
            <span className="text-xs font-medium text-territory-brand">
              {countLabel}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-territory-muted">
            {description}
          </p>
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
                className="h-[4.75rem] animate-pulse rounded-xl bg-territory-raised"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="rounded-xl border border-dashed border-territory-border px-3 py-8 text-center text-sm text-territory-muted">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </div>

      <div className="border-t border-territory-border p-3">
        <Link
          to={actionHref}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-territory-brand/25 bg-territory-brand/10 px-4 text-sm font-semibold text-territory-brand transition-colors hover:bg-territory-brand/15 hover:text-territory-brand-strong"
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
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-territory-border bg-category-business/12 text-category-business">
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
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase text-category-business">
          Negócio local
          {business.is_verified ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-label="Verificada" />
          ) : null}
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-territory-ink">
          {business.name}
        </strong>
        <span className="block truncate text-xs text-territory-muted">
          {normalizeCategoryLabel(business.category)}
          {business.rating > 0
            ? ` · ${business.rating.toFixed(1).replace(".", ",")}`
            : ""}
        </span>
      </span>
      {href ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" />
      ) : null}
    </>
  );

  return href ? (
    <Link
      to={href}
      className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-territory-border bg-territory-raised px-3 py-2 transition-colors hover:border-territory-brand/25 hover:bg-territory-brand/5"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-territory-border bg-territory-raised px-3 py-2">
      {content}
    </div>
  );
}

function ServicePreviewRow({ service }: { service: FeaturedService }) {
  return (
    <article className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-territory-border bg-territory-raised px-3 py-2">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-territory-border bg-category-discussion/12 text-category-discussion">
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
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase text-category-discussion">
          Serviço local
          {service.is_verified ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-label="Verificado" />
          ) : null}
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-territory-ink">
          {service.name}
        </strong>
        <span className="block truncate text-xs text-territory-muted">
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
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-territory-border bg-category-classified/12 text-category-classified">
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
        <span className="text-[0.68rem] font-semibold uppercase text-category-classified">
          Classificado local
        </span>
        <strong className="mt-0.5 block truncate text-sm font-semibold text-territory-ink">
          {item.titulo}
        </strong>
        <span className="block truncate text-xs text-territory-muted">
          {normalizeCategoryLabel(item.category)} ·{" "}
          {formatBrlNoCents(item.price)}
        </span>
      </span>
      {href ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" />
      ) : null}
    </>
  );

  return href ? (
    <Link
      to={href}
      className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-territory-border bg-territory-raised px-3 py-2 transition-colors hover:border-territory-brand/25 hover:bg-territory-brand/5"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-territory-border bg-territory-raised px-3 py-2">
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
    <div className="rounded-xl border border-dashed border-territory-border bg-territory-raised px-3 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-territory-ink">{title}</p>
          <p className="mt-1 text-sm leading-5 text-territory-muted">
            {description}
          </p>
          {ctaHref && ctaLabel ? (
            <Link
              to={ctaHref}
              className="mt-3 inline-flex min-h-8 items-center rounded-lg border border-territory-border bg-territory-surface px-3 text-xs font-semibold text-territory-brand transition-colors hover:bg-territory-brand/10"
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
  communityId = null,
  communityProfile = null,
  mode = "public",
  canCreatePost = false,
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
  const visualMockState = useMemo<CommunityVisualMockState>(() => {
    const value = new URLSearchParams(routeLocation.search).get("previewState");
    return value === "visitor" ||
      value === "pending" ||
      value === "empty" ||
      value === "error"
      ? value
      : "member";
  }, [routeLocation.search]);
  const visualMockEnabled = useMemo(() => {
    const params = new URLSearchParams(routeLocation.search);
    // Fixture estritamente local para revisão visual. Production sempre usa dados reais.
    return (
      import.meta.env.DEV &&
      params.get("visualMock") === COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE
    );
  }, [routeLocation.search]);
  const [feedContextTab, setFeedContextTab] =
    useState<CommunityFeedContextTab>("feed");
  const [postSort, setPostSort] = useState<CommunityFeedSortType>(() =>
    visualMockEnabled ? "recent" : "popular",
  );
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
  const displayPosts = useMemo<DiscussionPreviewPost[]>(
    () =>
      visualMockEnabled
        ? visualMockState === "empty"
          ? []
          : COMMUNITY_OVERVIEW_VISUAL_FIXTURE.posts
        : visiblePosts,
    [visualMockEnabled, visualMockState, visiblePosts],
  );
  const displayAlerts: CommunityVisualAlert[] = visualMockEnabled
    ? (COMMUNITY_OVERVIEW_VISUAL_FIXTURE.alerts as CommunityVisualAlert[])
    : [];
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
  const displayFeedError = visualMockEnabled
    ? visualMockState === "error"
    : isError;
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
      {
        key: "communication",
        label: "Comunicação",
        href: communityUrls.communication,
        icon: Newspaper,
        surface: "communityCommunication",
        isActive: activeSection === "communication",
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
    communityUrls.communication,
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
      void sharePost({ postId, title: communityTitle });
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
  const territoryLandingHref = moduleUrls.landing ?? "/";
  const territoryBaseHref = moduleUrls.base ?? "/";
  const desktopSidebarLinks: ModuleLink[] = [
    {
      key: "home",
      label: "Início",
      href: territoryLandingHref,
      icon: Home,
    },
    {
      key: "community",
      label: "Comunidade",
      view: "feed",
      icon: Users,
      isActive: !activeSection && selectedView === "feed",
    },
    {
      key: "explore",
      label: "Explorar",
      href: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryBaseHref),
      icon: Compass,
    },
    ...moduleLinks.filter((item) => item.key !== "feed"),
  ];
  const visibleDesktopSidebarLinks: ModuleLink[] = visualMockEnabled
    ? [
        {
          key: "home",
          label: "Início",
          href: territoryLandingHref,
          icon: Home,
        },
        {
          key: "community",
          label: "Comunidade",
          view: "feed",
          icon: Users,
          isActive: true,
        },
        {
          key: "explore",
          label: "Explorar",
          href: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryBaseHref),
          icon: Compass,
        },
        {
          key: "conversations",
          label: "Conversas",
          href: "#community-feed-context-panel",
          icon: MessageCircle,
        },
        {
          key: "account",
          label: "Conta",
          href: "/conta",
          icon: UserRound,
        },
      ]
    : desktopSidebarLinks;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 text-territory-ink",
        visualMockEnabled
          ? "max-w-[63.25rem] px-4 py-4 sm:px-6 sm:py-4 min-[1000px]:pl-1.5 min-[1000px]:pr-3.5"
          : "max-w-[76rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8",
      )}
      data-community-overview="community-first"
      data-community-state="active"
      data-visual-mock={
        visualMockEnabled
          ? COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE
          : undefined
      }
    >
      <main
        className={cn(
          "min-w-0 space-y-4 xl:space-x-0",
          visualMockEnabled
            ? "max-[999px]:space-y-0 min-[1000px]:grid min-[1000px]:grid-cols-[10.875rem_minmax(0,1fr)_15.25rem] min-[1000px]:gap-x-6 min-[1000px]:gap-y-3 min-[1000px]:space-y-0 min-[1000px]:pt-1"
            : "xl:grid xl:grid-cols-[10.75rem_minmax(0,1fr)_20rem] xl:gap-x-5 xl:gap-y-4 xl:space-y-0",
        )}
      >
        <aside
          className={cn(
            "hidden",
            visualMockEnabled
              ? "min-[1000px]:col-start-1 min-[1000px]:row-span-3 min-[1000px]:flex min-[1000px]:flex-col min-[1000px]:gap-5"
              : "xl:col-start-1 xl:row-span-3 xl:flex xl:flex-col xl:gap-5",
          )}
        >
          <nav
            aria-label="Navegação do território"
            className="border-r border-territory-border pr-3"
          >
            <div className="space-y-1">
              {visibleDesktopSidebarLinks.map((item) => (
                <ModuleNavLink
                  key={item.key}
                  item={item}
                  onViewChange={handleViewChange}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    item.isActive
                      ? "bg-territory-brand/12 text-territory-brand-strong"
                      : "text-territory-ink hover:bg-territory-brand/8",
                  )}
                />
              ))}
            </div>
          </nav>
          <Link
            to="/?trocar=territorio"
            className="mt-auto flex min-h-10 items-center gap-3 border-t border-territory-border px-3 pt-4 text-sm font-medium text-territory-muted transition-colors hover:text-territory-ink"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>Trocar território</span>
          </Link>
        </aside>
        {selectedView === "feed" && !isEmbeddedModule ? (
          <section
            data-community-hero="true"
            className={cn(
              visualMockEnabled
                ? "min-[1000px]:col-start-2"
                : "xl:col-span-2 xl:col-start-2",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 items-start justify-between gap-4 border-b border-territory-border px-1 pb-3 sm:pb-4",
                    visualMockEnabled &&
                      "border-b-0 pb-0 sm:pb-0 min-[1000px]:px-0",
              )}
            >
              <div className="min-w-0">
                <h1
                  className={cn(
                    "font-heading text-[1.7rem] font-bold tracking-[-0.04em] text-territory-ink sm:text-3xl",
                    visualMockEnabled &&
                      "sm:mb-0 sm:text-[1.875rem] sm:leading-9",
                  )}
                >
                  Comunidade
                </h1>
                <p
                  className={cn(
                    "mt-1 text-sm text-territory-muted sm:text-base",
                    visualMockEnabled && "mt-0 mb-0 sm:text-base sm:leading-5",
                  )}
                >
                  Gente, histórias e ideias do nosso lugar.
                </p>
              </div>
            </div>
          </section>
        ) : null}
        <section
          data-community-hero-art="true"
          className={cn(
            "relative isolate overflow-hidden rounded-territory-highlight border border-territory-border bg-territory-image-overlay shadow-territory-highlight xl:col-span-2 xl:col-start-2 xl:row-start-1",
            selectedView === "feed" && !isEmbeddedModule && "hidden",
          )}
          style={{
            backgroundImage: `linear-gradient(90deg, hsl(var(--territory-image-overlay) / 0.84) 0%, hsl(var(--territory-image-overlay) / 0.64) 43%, hsl(var(--territory-image-overlay) / 0.16) 100%), url(${heroImage})`,
            backgroundPosition: "center 48%",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--territory-brand)/0.12),transparent_32%)]" />
          <div className="relative px-4 py-5 sm:min-h-[14rem] sm:px-6 sm:py-6 lg:px-8 xl:min-h-[13rem]">
            <div className="flex min-w-0 flex-col justify-between gap-5 xl:grid xl:h-full xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-center xl:gap-7">
              <div className="flex min-w-0 flex-row items-center gap-3 sm:gap-4 xl:gap-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-territory-on-image/20 bg-territory-on-image/10 shadow-xl shadow-territory-image-overlay/25 sm:h-20 sm:w-20 md:h-24 md:w-24 md:rounded-2xl xl:h-24 xl:w-24">
                  <SafeImage
                    src={heroImage}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="min-w-0 xl:max-w-[36rem]">
                  <h1 className="text-xl font-semibold leading-tight text-territory-on-image sm:text-3xl md:text-4xl xl:text-[1.75rem]">
                    {communityTitle}
                  </h1>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-normal text-territory-on-image/80 sm:mt-1 sm:gap-2 sm:text-sm xl:text-xs">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-territory-brand-strong sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {communityLocationLine}
                      {locationLabel !== communityLocationLine
                        ? ` - ${locationLabel}`
                        : ""}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 max-w-xl overflow-hidden text-xs font-normal leading-4 text-territory-on-image/70 sm:mt-2 sm:text-base sm:leading-6 xl:text-xs xl:leading-[1.15rem]">
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
                          "min-w-0 rounded-lg border border-territory-on-image/10 bg-territory-image-overlay/25 px-1.5 py-1 backdrop-blur sm:rounded-xl sm:px-2.5 md:rounded-2xl md:px-4 md:py-2 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:backdrop-blur-0",
                          index >= 2 ? "xl:hidden" : "",
                        )}
                      >
                        <div className="flex items-center gap-1 text-territory-on-image sm:gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-territory-brand-strong sm:h-4 sm:w-4 xl:text-territory-on-image/80" />
                          <strong className="truncate text-xs sm:text-sm md:text-base xl:text-xl">
                            {formatCount(item.value)}
                          </strong>
                        </div>
                        <p className="mt-0.5 truncate text-[0.55rem] leading-tight text-territory-on-image/60 sm:text-[0.66rem] md:text-xs xl:mt-1">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:flex-nowrap sm:gap-3 sm:overflow-x-auto sm:pb-1 sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] md:flex-wrap md:justify-end md:overflow-visible md:pb-0 xl:flex-col xl:gap-2 xl:pb-0 sm:[&::-webkit-scrollbar]:hidden">
                  {mode === "member" && canCreatePost ? (
                    <Button
                      type="button"
                      onClick={() => onOpenCreatePost?.()}
                      className="min-h-8 w-full rounded-lg bg-territory-brand px-2 text-xs font-semibold text-territory-image-overlay hover:bg-territory-brand-strong sm:min-h-9 sm:w-auto sm:shrink-0 sm:rounded-xl sm:px-3 sm:text-sm md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Criar publicação
                    </Button>
                  ) : mode === "public" ? (
                    <Link
                      to={loginHref}
                      className="inline-flex min-h-8 w-full items-center justify-center rounded-lg bg-territory-sun px-2 text-xs font-semibold text-territory-ink transition-colors hover:bg-territory-sun/90 sm:min-h-9 sm:w-auto sm:shrink-0 sm:rounded-xl sm:px-3 sm:text-sm md:min-h-11 md:px-5 xl:w-48 xl:text-xs"
                    >
                      <LogIn className="mr-2 h-4 w-4 xl:hidden" />
                      <span className="xl:hidden">Participar</span>
                      <span className="hidden xl:inline">
                        Participar da comunidade
                      </span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleShareCommunity}
                    className="inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-territory-on-image/20 bg-territory-image-overlay/15 px-3 text-xs font-semibold text-territory-on-image transition-colors hover:bg-territory-on-image/10 sm:w-auto xl:w-48"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convidar amigos
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="relative hidden border-t border-territory-on-image/10 px-4 py-2 xl:flex xl:min-h-12 xl:items-center xl:gap-5">
            {focusShortcutLinks.map((item) => {
              const Icon = item.icon;
              const view = item.view;
              const className = cn(
                "inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors",
                item.isActive
                  ? "bg-territory-brand/15 text-territory-on-image"
                  : "text-territory-on-image/70 hover:bg-territory-on-image/[0.06] hover:text-territory-on-image",
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

        <div
          className={cn(
            "sm:hidden",
            visualMockEnabled && "hidden",
            selectedView === "feed" && !isEmbeddedModule && "hidden",
          )}
          data-community-mobile-primary-nav="true"
        >
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
                    ? "border-territory-brand/40 bg-territory-brand/15 text-territory-brand-strong"
                    : "border-territory-border bg-territory-surface text-territory-muted hover:text-territory-ink",
                )}
              />
            ))}
            <button
              type="button"
              data-community-sections-trigger="true"
              onClick={() => setMobileSectionsExpanded((current) => !current)}
              className={cn(
                "inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-territory-border bg-territory-surface px-1 text-[0.625rem] font-semibold leading-none text-territory-muted transition-colors hover:text-territory-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-focus min-[360px]:text-[0.6875rem] min-[480px]:min-h-11 min-[480px]:flex-row min-[480px]:gap-1.5 min-[480px]:px-2",
                (mobileSectionsExpanded || isEmbeddedModule) &&
                  "border-territory-brand/35 bg-territory-brand/10 text-territory-brand-strong",
              )}
              aria-expanded={mobileSectionsExpanded}
              aria-controls={mobileSectionsId}
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Seções</span>
            </button>
          </div>
          {mobileSectionsExpanded ? (
            <nav
              id={mobileSectionsId}
              data-community-sections-menu="true"
              className="mt-2 grid grid-cols-2 gap-1.5 rounded-2xl border border-territory-border bg-territory-raised p-2 shadow-territory-highlight"
              aria-label="Outras seções da comunidade"
            >
              {moduleLinks.slice(3).map((item) => (
                <ModuleNavLink
                  key={item.key}
                  item={item}
                  onViewChange={handleViewChange}
                  onNavigate={handleModuleNavigate}
                  className={cn(
                    "flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 text-xs font-medium transition-colors hover:bg-territory-brand/10 hover:text-territory-ink",
                    item.isActive
                      ? "bg-territory-brand/12 text-territory-brand-strong"
                      : "text-territory-muted",
                  )}
                />
              ))}
            </nav>
          ) : null}
        </div>

        <div
          className={cn(
            "hidden gap-2 overflow-x-auto pb-1 sm:flex xl:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            visualMockEnabled && "sm:hidden",
          )}
        >
          {moduleLinks.map((item) => (
            <ModuleNavLink
              key={item.key}
              item={item}
              onViewChange={handleViewChange}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors",
                item.isActive
                  ? "border-territory-brand/40 bg-territory-brand/15 text-territory-brand-strong"
                  : "border-territory-border bg-territory-surface text-territory-muted hover:text-territory-ink",
              )}
            />
          ))}
        </div>

        <div
          className={cn(
            "hidden gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:hidden [&::-webkit-scrollbar]:hidden",
            visualMockEnabled && "sm:hidden",
          )}
        >
          {focusShortcutLinks.map((item) => {
            const Icon = item.icon;
            const view = item.view;
            const className = cn(
              "group flex min-h-14 min-w-[13.5rem] items-center gap-3 rounded-2xl border px-3 py-2.5 text-territory-ink shadow-territory-highlight backdrop-blur transition-colors hover:border-territory-brand/30 hover:bg-territory-brand/[0.06] sm:min-w-0",
              item.isActive
                ? "border-territory-brand/35 bg-territory-brand/12"
                : "border-territory-border bg-territory-raised",
            );
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/12 text-territory-brand-strong transition-colors group-hover:bg-territory-brand/20">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-territory-muted">
                    {item.detail}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" />
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
            "grid min-w-0 gap-4",
            visualMockEnabled
              ? "min-[1000px]:col-start-2 min-[1000px]:row-start-2"
              : "xl:col-start-2 xl:row-start-2",
            (isEmbeddedModule || selectedView !== "feed") &&
              (visualMockEnabled
                ? "min-[1000px]:col-span-2"
                : "xl:col-span-2"),
          )}
          aria-live="polite"
          data-community-module-content={
            isEmbeddedModule ? activeSection : undefined
          }
        >
          <div
            className={cn(
              "order-1 min-w-0 space-y-4",
              visualMockEnabled
                ? "min-[1000px]:space-y-3"
                : "xl:space-y-2",
            )}
          >
            {selectedView === "feed" ? (
              children ? (
                children
              ) : (
                <>
                  {visualMockEnabled ? (
                    <CommunityConceptContextNavigation
                      activeContextTab={feedContextTab}
                      onContextTabChange={handleFeedContextTabChange}
                    />
                  ) : (
                    <CommunityFeedContextNavigation
                      activeContextTab={feedContextTab}
                      onContextTabChange={handleFeedContextTabChange}
                    />
                  )}

                  {visualMockEnabled && visualMockState === "visitor" ? (
                    <CommunityVisitorParticipationCard
                      onRequireLogin={onRequireLogin}
                    />
                  ) : visualMockEnabled && visualMockState === "pending" ? (
                    <CommunityPendingParticipationCard />
                  ) : (!visualMockEnabled || feedContextTab === "feed") &&
                    (!visualMockEnabled || visualMockState === "member") ? (
                    canCreatePost ? (
                      <CommunityComposerEntry
                        id="feed"
                        communityName={communityTitle}
                        onOpenCreatePost={handleOpenComposer}
                        avatarUrl={visualMockEnabled ? personaMorador : undefined}
                        variant={visualMockEnabled ? "concept" : "default"}
                        profileLabel="Ana · Pessoal"
                        className={
                          visualMockEnabled
                            ? "min-[1000px]:p-2"
                            : "xl:p-3"
                        }
                      />
                    ) : null
                  ) : null}

                  <div
                    id="community-feed-context-panel"
                    className="space-y-3"
                    data-community-feed-context-panel={feedContextTab}
                  >
                    {feedContextTab === "feed" ? (
                      visualMockEnabled &&
                      (visualMockState === "empty" ||
                        visualMockState === "error") ? (
                        <CommunityConceptFeedState
                          kind={visualMockState}
                          onCreatePost={() => handleOpenComposer()}
                        />
                      ) : (
                        <>
                        <SurfacePanel
                          className={cn(
                            "p-2.5",
                            visualMockEnabled &&
                              "rounded-none border-0 bg-transparent p-0 shadow-none",
                          )}
                        >
                          {visualMockEnabled ? (
                            <CommunityConceptFeedFilters
                              value={postSort}
                              onChange={setPostSort}
                            />
                          ) : (
                            <CommunityPostSortControls
                              value={postSort}
                              onChange={setPostSort}
                            />
                          )}
                          {displayLoadingFeed ? (
                            <div className="mt-3 space-y-2">
                              {[0, 1, 2].map((index) => (
                                <div
                                  key={index}
                                  className="h-32 animate-pulse rounded-2xl border border-territory-border bg-territory-raised"
                                />
                              ))}
                            </div>
                          ) : displayFeedError ? (
                            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-4 text-sm text-destructive">
                              Erro ao carregar feed:{" "}
                              {error?.message ??
                                "tente novamente em instantes."}
                            </p>
                          ) : displayPosts.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-territory-border bg-territory-raised px-3 py-8 text-center text-sm text-territory-muted">
                              Nenhuma publicação pública encontrada neste
                              território.
                            </p>
                          ) : (
                            <div
                              className={cn(
                                "space-y-3",
                                visualMockEnabled && "mt-3 space-y-4",
                              )}
                            >
                              {sortedDisplayPosts.map((post) => {
                                if (visualMockEnabled && post.type === "aviso") {
                                  return (
                                    <article
                                      id={`post-${post.id}`}
                                      key={post.id}
                                      data-feed-post-id={post.id}
                                      className="rounded-xl border border-territory-sun/55 bg-territory-sun/20 px-3 py-2.5 shadow-territory-highlight"
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-territory-sun/70 text-territory-ink">
                                          <Megaphone className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-territory-ink/70">
                                            Aviso da comunidade
                                          </p>
                                          <h3 className="mt-0.5 text-[0.87rem] font-semibold leading-4 text-territory-ink">
                                            {getPublicPostTitle(post)}
                                          </h3>
                                          <p className="mt-0.5 text-[0.68rem] text-territory-ink/70">
                                            {formatPublicPostDate(
                                              post.created_at,
                                            )}{" "}
                                            atrás
                                          </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-territory-ink" />
                                      </div>
                                    </article>
                                  );
                                }

                                const Icon = getPublicPostTypeIcon(post.type);
                                const avatarUrl = getPublicPostAvatar(post);
                                const summary = getPublicPostSummary(post);
                                const postImages = getPublicPostImages(post);
                                return (
                                  <article
                                    id={`post-${post.id}`}
                                    key={post.id}
                                    data-feed-post-id={post.id}
                                    className={cn(
                                      "rounded-xl border border-territory-border bg-territory-raised px-3 py-2.5 shadow-territory-highlight [content-visibility:auto] [contain-intrinsic-size:0_520px]",
                                      visualMockEnabled && "px-4 py-2",
                                      post.type === "aviso" &&
                                        "border-territory-sun/55 bg-territory-sun/20",
                                    )}
                                  >
                                    <div className="flex min-w-0 items-start gap-3">
                                      <span
                                        className={cn(
                                          "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-territory-border bg-territory-brand/12 text-territory-brand-strong",
                                          visualMockEnabled && "h-9 w-9",
                                        )}
                                      >
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
                                        {visualMockEnabled ? (
                                          <>
                                            <p className="mb-0 truncate text-sm font-semibold leading-4 text-territory-ink">
                                              {getPublicPostAuthor(post)}
                                            </p>
                                            <p className="mt-0.5 mb-0 text-xs leading-4 text-territory-muted">
                                              {post.territory_label ??
                                                getPublicPostRole(post)}{" "}
                                              · há {getCommunityConceptPostAge(post.id)}
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            <p className="truncate text-xs font-semibold text-territory-ink">
                                              {getPublicPostAuthor(post)}
                                              <span className="mx-1.5 font-normal text-territory-muted/60">
                                                •
                                              </span>
                                              <span className="font-normal text-territory-muted">
                                                {getPublicPostRole(post)}
                                              </span>
                                            </p>
                                            <p className="mt-0.5 text-[0.68rem] text-territory-muted">
                                              {formatPublicPostDate(
                                                post.created_at,
                                              )}{" "}
                                              atrás
                                            </p>
                                          </>
                                        )}
                                      </div>
                                      {visualMockEnabled && post.type === "pergunta" ? (
                                        <span className="mt-0.5 inline-flex min-h-5 shrink-0 items-center rounded bg-territory-sun/25 px-2 text-xs font-medium text-territory-ink ring-1 ring-inset ring-territory-sun/45">
                                          {getPublicPostTypeLabel(post.type)}
                                        </span>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={onRequireLogin}
                                        className="px-1 text-lg leading-none text-territory-muted hover:text-territory-ink"
                                        aria-label="Mais opções"
                                      >
                                        •••
                                      </button>
                                    </div>
                                    <div className={cn("mt-1.5", visualMockEnabled && "mt-1") }>
                                      {!visualMockEnabled &&
                                        post.type === "pergunta" && (
                                        <span
                                          className={cn(
                                            "inline-flex min-h-4 items-center rounded px-1.5 text-[0.61rem] font-medium text-territory-brand-strong ring-1 ring-inset ring-territory-brand/20",
                                            visualMockEnabled &&
                                              "min-h-5 bg-territory-sun/25 px-2 text-xs text-territory-ink ring-territory-sun/45",
                                          )}
                                        >
                                          {getPublicPostTypeLabel(post.type)}
                                        </span>
                                      )}
                                      <h3
                                        className={cn(
                                          "mt-1 text-[0.92rem] font-semibold leading-[1.15rem] text-territory-ink",
                                          visualMockEnabled &&
                                            "mb-0 text-base leading-5",
                                        )}
                                      >
                                        {getPublicPostTitle(post)}
                                      </h3>
                                      {summary ? (
                                        <p
                                          className={cn(
                                            "mt-0.5 text-[0.7rem] leading-4 text-territory-muted",
                                            visualMockEnabled &&
                                              "mb-0 text-sm leading-5",
                                          )}
                                        >
                                          {summary}
                                        </p>
                                      ) : null}
                                      {visualMockEnabled && post.response_preview ? (
                                        <div className="mt-1.5 flex min-w-0 items-center gap-2 rounded-lg bg-territory-brand/8 px-2 py-1.5 text-[13px] leading-4 text-territory-ink">
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-territory-brand/12 text-[0.58rem] font-semibold text-territory-brand">
                                            {post.response_preview.avatar_url ? (
                                              <SafeImage
                                                src={post.response_preview.avatar_url}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                              />
                                            ) : (
                                              post.response_preview.author_name.slice(0, 1)
                                            )}
                                          </span>
                                          <span className="min-w-0 truncate">
                                            <strong>{post.response_preview.author_name}:</strong>{" "}
                                            {post.response_preview.content}
                                          </span>
                                        </div>
                                      ) : null}
                                      {postImages.length > 0 ? (
                                        <ImageGallery
                                          images={postImages}
                                          className="mt-2"
                                        />
                                      ) : null}
                                    </div>
                                    {visualMockEnabled ? (
                                      <div className="mt-1 flex items-center gap-5 border-t border-territory-border pt-1 text-[13px] leading-4 text-territory-muted">
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className={cn(
                                            "inline-flex items-center gap-1.5 hover:text-territory-ink",
                                            visualMockEnabled &&
                                              "min-[1000px]:min-h-9",
                                          )}
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                          Ver {post.comments_count ?? 0} respostas
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className={cn(
                                            "ml-auto inline-flex items-center gap-1.5 hover:text-territory-ink",
                                            visualMockEnabled &&
                                              "min-[1000px]:min-h-9",
                                          )}
                                        >
                                          <Heart className="h-3.5 w-3.5" />
                                          Curtir
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className={cn(
                                            "inline-flex items-center gap-1.5 hover:text-territory-ink",
                                            visualMockEnabled &&
                                              "min-[1000px]:min-h-9",
                                          )}
                                          aria-label="Salvar publicação"
                                        >
                                          <Bookmark className="h-3.5 w-3.5" />
                                          Salvar
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-1.5 flex items-center gap-6 border-t border-territory-border pt-1.5 text-[0.7rem] text-territory-muted">
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="inline-flex items-center gap-1.5 hover:text-territory-ink"
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                          {post.comments_count ?? 0}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="inline-flex items-center gap-1.5 hover:text-territory-ink"
                                        >
                                          <Heart className="h-3.5 w-3.5" />
                                          {post.likes_count ?? 0}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSharePost(post.id)}
                                          className="inline-flex items-center gap-1.5 hover:text-territory-ink"
                                        >
                                          <Share2 className="h-3.5 w-3.5" />
                                          Compartilhar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={onRequireLogin}
                                          className="ml-auto inline-flex items-center hover:text-territory-ink"
                                          aria-label="Salvar publicação"
                                        >
                                          <Bookmark className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
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
                                className="rounded-xl border-territory-border bg-territory-raised text-territory-ink hover:bg-territory-brand/10"
                              >
                                {displayIsFetchingNextPage
                                  ? "Carregando..."
                                  : "Carregar mais"}
                              </Button>
                            </div>
                          ) : null}
                        </SurfacePanel>
                        </>
                      )
                    ) : feedContextTab === "alerts" ? (
                      <CommunityAlertsPreview alerts={displayAlerts} />
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
                    ) : feedContextTab === "events" ? (
                      <SurfacePanel className="p-3 sm:p-4">
                        <SectionHeader
                          title="Na agenda"
                          actionHref={fullEventsEnabled ? moduleUrls.events : undefined}
                          actionLabel={fullEventsEnabled ? "Ver agenda" : undefined}
                        />
                        <div className="space-y-2">
                          {displayEvents.slice(0, 3).map((event) => (
                            <EventPreviewItem key={event.id} event={event} />
                          ))}
                        </div>
                      </SurfacePanel>
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
                      <h2 className="text-base font-semibold text-territory-ink">
                        Grupos da comunidade
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-territory-muted">
                        Conversas organizadas por interesses e necessidades
                        locais.
                      </p>
                    </div>
                    {mode === "public" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onRequireLogin}
                        className="shrink-0 rounded-xl border-territory-brand/30 bg-territory-brand/10 text-xs text-territory-brand-strong hover:bg-territory-brand/15 hover:text-territory-ink"
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
                          className="h-16 animate-pulse rounded-xl border border-territory-border bg-territory-raised"
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
                  {canCreatePost ? (
                    <CommunityComposerEntry
                      communityName={communityTitle}
                      onOpenCreatePost={handleOpenComposer}
                      avatarUrl={visualMockEnabled ? personaMorador : undefined}
                    />
                  ) : null}
                  <SurfacePanel id="discussions-view" className="p-3 sm:p-4">
                    <div className="mb-4">
                      <h2 className="text-base font-semibold text-territory-ink">
                        Discussões da comunidade
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-territory-muted">
                        Perguntas, recomendações e assuntos com participação dos
                        moradores.
                      </p>
                    </div>
                    {displayLoadingFeed ? (
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className="h-14 animate-pulse rounded-xl border border-territory-border bg-territory-raised"
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
          <div
            className={cn(
              "min-w-0 space-y-4",
              visualMockEnabled
                ? "hidden min-[1000px]:col-start-3 min-[1000px]:row-start-1 min-[1000px]:row-span-3 min-[1000px]:block min-[1000px]:space-y-3"
                : "xl:col-start-3 xl:row-start-2 xl:space-y-3",
            )}
          >
            {visualMockEnabled ? (
              <CommunityConceptSidebar
                alerts={displayAlerts}
                groups={displayGroups}
                events={displayEvents}
                eventsHref={fullEventsEnabled ? moduleUrls.events : undefined}
                groupsHref={communityUrls.groups}
              />
            ) : (
              <>
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
                      className="h-20 animate-pulse rounded-xl border border-territory-border bg-territory-raised"
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
                <div className="h-24 animate-pulse rounded-xl border border-territory-border bg-territory-raised" />
              ) : campaign ? (
                <SponsoredAdCard
                  campaign={campaign}
                  variant="compact"
                  className="border-territory-brand/20 bg-territory-brand/10 text-territory-ink"
                />
              ) : (
                <p className="rounded-xl border border-dashed border-territory-border bg-territory-raised px-3 py-4 text-sm text-territory-muted">
                  Nenhuma campanha patrocinada ativa para este território.
                </p>
              )}
                </SurfacePanel>
              </>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
