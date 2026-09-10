import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  Check,
  Grid3X3,
  Home,
  MapPin,
  MessageCircle,
  MoreVertical,
  Pin,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
  Utensils,
  Wrench,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import communityImage from "@/assets/complexo-cultura.jpg";
import merchantImage from "@/assets/persona-comerciante.jpg";
import residentImage from "@/assets/persona-morador.jpg";
import workerImage from "@/assets/persona-emprego.jpg";
import providerImage from "@/assets/persona-prestador.jpg";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useCommunityDirectMessages } from "@/core/messaging/hooks/useCommunityDirectMessages";
import type { CommunityDirectMessage, CommunityDirectThreadPreview } from "@/core/messaging";
import {
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";
import { useSessionContext } from "@/core/session";
import type { SessionProfileView } from "@/core/session/types";
import { cn } from "@/shared/utils/cn";

type ProfileKind = "personal" | "business" | "professional";

interface InboxProfile {
  key: ProfileKind;
  id?: string;
  name: string;
  typeLabel: string;
  avatarUrl: string;
  unread: number;
  profile?: SessionProfileView;
}

interface ConceptConversation {
  id: string;
  name: string;
  avatarUrl: string;
  preview: string;
  time: string;
  unread?: number;
  pinned?: boolean;
  archived?: boolean;
}

type ConversationFilter = "all" | "unread" | "archived";

const conceptConversations: ConceptConversation[] = [
  {
    id: "concept-mariana-costa",
    name: "Mariana Costa",
    avatarUrl: merchantImage,
    preview: "Pode ser às 12h?",
    time: "10:24",
    pinned: true,
  },
  {
    id: "concept-associacao-local",
    name: "Associação local",
    avatarUrl: communityImage,
    preview: "Confirmamos para sábado.",
    time: "09:50",
    pinned: true,
  },
  {
    id: "concept-lucas-almeida",
    name: "Lucas Almeida",
    avatarUrl: providerImage,
    preview: "Vocês entregam em Santa Cruz?",
    time: "10:18",
    unread: 3,
  },
  {
    id: "concept-beatriz-santos",
    name: "Beatriz Santos",
    avatarUrl: merchantImage,
    preview: "Obrigada pelo atendimento!",
    time: "09:42",
  },
  {
    id: "concept-pedro-souza",
    name: "Pedro Souza",
    avatarUrl: workerImage,
    preview: "Gostaria de ver o cardápio.",
    time: "09:30",
    unread: 2,
  },
  {
    id: "concept-carla-lima",
    name: "Carla Lima",
    avatarUrl: merchantImage,
    preview: "Pode separar duas porções?",
    time: "09:12",
    unread: 1,
  },
  {
    id: "concept-rafael-alves",
    name: "Rafael Alves",
    avatarUrl: residentImage,
    preview: "Combinado, obrigado!",
    time: "Ontem",
  },
];

const conceptConversationIdsByProfile: Record<ProfileKind, string[]> = {
  personal: ["concept-mariana-costa", "concept-lucas-almeida", "concept-beatriz-santos"],
  business: conceptConversations.map((conversation) => conversation.id),
  professional: ["concept-associacao-local", "concept-pedro-souza", "concept-rafael-alves"],
};

const conceptMessages = [
  { id: "incoming-1", body: "Olá! Vocês têm opção vegetariana hoje?", time: "10:21", mine: false },
  { id: "outgoing-1", body: "Olá, Mariana! Temos sim: legumes assados, arroz e feijão.", time: "10:23", mine: true },
  { id: "incoming-2", body: "Ótimo! Quero reservar uma porção para retirar. Pode ser às 12h?", time: "10:24", mine: false },
];

function getProfileKind(profileType: string | undefined): ProfileKind {
  if (profileType === "business") return "business";
  if (profileType === "professional") return "professional";
  return "personal";
}

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTerritoryLabel(value: string): string {
  return value
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
    .join(" ");
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: Pick<InboxProfile, "name" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return profile.avatarUrl ? (
    <img src={profile.avatarUrl} alt="" className={cn(sizeClass, "shrink-0 rounded-full object-cover")} />
  ) : (
    <span className={cn(sizeClass, "flex shrink-0 items-center justify-center rounded-full bg-territory-raised text-sm font-bold text-territory-brand")}>
      {getInitials(profile.name)}
    </span>
  );
}

function ConceptProfileIcon({ profile, size = "md" }: { profile: InboxProfile; size?: "sm" | "md" | "lg" }) {
  if (profile.key === "business") {
    const sizeClass = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
    return <img src={profile.avatarUrl || foodImage} alt="" className={cn(sizeClass, "shrink-0 rounded-xl object-cover")} />;
  }
  return <ProfileAvatar profile={profile} size={size} />;
}

function ProfileSelectorRow({
  profile,
  selected,
  onSelect,
}: {
  profile: InboxProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-[4.25rem] w-full items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
        selected ? "bg-[hsl(var(--territory-success)/0.12)]" : "hover:bg-territory-raised",
      )}
      aria-pressed={selected}
    >
      <ConceptProfileIcon profile={profile} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-semibold leading-5 text-territory-ink">{profile.name}</span>
        <span className="block text-[0.8125rem] leading-5 text-territory-muted">{profile.typeLabel}</span>
      </span>
      {selected ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-territory-brand text-white" aria-label="Perfil ativo">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      {profile.unread > 0 ? (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-territory-sun px-1.5 text-xs font-bold text-territory-ink">
          {profile.unread}
        </span>
      ) : null}
    </button>
  );
}

function DesktopNavigation({ territoryHref }: { territoryHref: string }) {
  const items = [
    { label: "Início", href: territoryHref, icon: Home },
    { label: "Explorar", href: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryHref), icon: Search },
    { label: "Comunidade", href: buildCommunityTerritoryUrl(territoryHref), icon: Users },
    { label: "Conversas", href: "/mensagens", icon: MessageCircle, active: true },
    { label: "Conta", href: "/conta", icon: UserRound },
  ];

  return (
    <aside className="hidden w-[5.75rem] shrink-0 border-r border-territory-border bg-territory-surface px-1.5 py-4 lg:block">
      <nav aria-label="Navegação principal" className="flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "relative flex min-h-[4.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.6875rem] font-medium leading-tight text-territory-ink transition-colors hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
                item.active && "bg-[hsl(var(--territory-success)/0.16)] font-semibold text-territory-brand before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-territory-sun",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={item.active ? 2.1 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DesktopHeader({
  territoryName,
  contextLabel,
  account,
  accountMenuOpen,
  onToggleAccount,
  profileOptions,
  onSelectProfile,
}: {
  territoryName: string;
  contextLabel: string;
  account: InboxProfile;
  accountMenuOpen: boolean;
  onToggleAccount: () => void;
  profileOptions: InboxProfile[];
  onSelectProfile: (profile: InboxProfile) => void;
}) {
  return (
    <header className="relative z-30 hidden h-[4.875rem] items-center border-b border-territory-border bg-territory-surface px-7 lg:flex">
      <Link to="/" aria-label="Achegue-se — início" className="shrink-0 font-heading text-[1.7rem] font-bold tracking-[-0.06em] text-territory-brand">
        achegue-se<span className="text-territory-sun">.</span>
      </Link>
      <span className="mx-6 h-8 w-px bg-territory-border" aria-hidden="true" />
      <Link to="/?trocar=territorio" className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <MapPin className="h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />
        <span className="min-w-0 leading-tight">
          <span className="block max-w-[18rem] truncate text-sm font-semibold text-territory-ink">{territoryName}</span>
          <span className="block text-xs text-territory-muted">{contextLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-territory-ink" aria-hidden="true" />
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <button type="button" aria-label="Notificações" className="flex h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Abrir menu do perfil" onClick={onToggleAccount} className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <ProfileAvatar profile={account} size="sm" />
          <span className="max-w-28 truncate text-sm font-semibold text-territory-ink">{account.name}</span>
          <ChevronDown className={cn("h-4 w-4 text-territory-ink transition-transform", accountMenuOpen && "rotate-180")} aria-hidden="true" />
        </button>
        {accountMenuOpen ? (
          <div className="absolute right-7 top-[4.4rem] w-64 rounded-2xl border border-territory-border bg-territory-surface p-2 shadow-territory-card">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-territory-muted">Escolha a caixa de entrada</p>
            {profileOptions.map((profile) => (
              <ProfileSelectorRow key={`header-${profile.key}`} profile={profile} selected={profile.key === account.key} onSelect={() => onSelectProfile(profile)} />
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ProfileStripVisual({ profile }: { profile: InboxProfile }) {
  if (profile.key === "business") {
    return <img src={profile.avatarUrl || foodImage} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white" />;
  }
  if (profile.key === "professional") {
    return <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--territory-info)/0.14)] text-territory-brand ring-2 ring-white"><Wrench className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" /></span>;
  }
  return profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-territory-raised text-sm font-bold text-territory-brand">{getInitials(profile.name)}</span>;
}

function ProfileStrip({
  selected,
  profiles,
  onSelect,
}: {
  selected: InboxProfile;
  profiles: InboxProfile[];
  onSelect: (profile: InboxProfile) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-1 lg:mt-5 lg:gap-2" aria-label="Perfis de conversa">
      {profiles.map((profile) => {
        const isSelected = profile.key === selected.key;
        return (
          <button
            key={profile.key}
            type="button"
            onClick={() => onSelect(profile)}
            className={cn(
              "relative flex min-h-[7.15rem] flex-col items-center justify-start gap-2 rounded-xl px-1.5 pt-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand",
              isSelected ? "bg-[hsl(var(--territory-success)/0.18)] text-territory-brand after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-territory-brand" : "text-territory-ink hover:bg-territory-raised",
            )}
            aria-pressed={isSelected}
          >
            <span className="relative">
              <ProfileStripVisual profile={profile} />
              {profile.unread > 0 ? <span className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-error px-1 text-[0.6875rem] font-bold text-white">{profile.unread}</span> : null}
            </span>
            <span className="max-w-full text-[0.8125rem] font-semibold leading-tight">{profile.key === "personal" ? "Pessoal" : profile.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProfileDirectoryRow({
  profile,
  selected,
  onSelect,
}: {
  profile: InboxProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className={cn("flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand", selected ? "bg-[hsl(var(--territory-success)/0.12)]" : "hover:bg-territory-raised")} aria-pressed={selected}>
      <ProfileStripVisual profile={profile} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-territory-ink">{profile.name}</span>
        <span className="block text-xs text-territory-muted">{profile.typeLabel}</span>
      </span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-territory-brand" aria-label="Perfil ativo" /> : null}
      {profile.unread > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-error px-1 text-[0.6875rem] font-bold text-white">{profile.unread}</span> : null}
    </button>
  );
}

function ConversationListItem({
  conversation,
  selected,
  onClick,
}: {
  conversation: ConceptConversation;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-[4.25rem] w-full items-center gap-3 border-b border-territory-border px-1 text-left transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", selected ? "rounded-xl bg-[hsl(var(--territory-success)/0.14)]" : "hover:bg-territory-raised")}>
      <ProfileAvatar profile={conversation} size="md" />
      <span className="min-w-0 flex-1 py-2">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-territory-ink">{conversation.name}</span>
          <span className="shrink-0 text-xs text-territory-muted">{conversation.time}</span>
        </span>
        <span className="mt-1 block truncate text-sm text-territory-muted">{conversation.preview}</span>
      </span>
      <span className="flex shrink-0 flex-col items-center gap-1">
        {conversation.pinned ? <Pin className="h-4 w-4 text-territory-brand" fill="currentColor" strokeWidth={1.7} aria-label="Fixada" /> : null}
        {conversation.unread ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-territory-error px-1 text-[0.6875rem] font-bold text-white">{conversation.unread}</span> : null}
      </span>
    </button>
  );
}

function ConversationColumn({
  selectedProfile,
  profiles,
  profileDirectoryOpen,
  onToggleProfileDirectory,
  onSelectProfile,
  conversations,
  selectedConversationId,
  onSelectConversation,
  conversationFilter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  selectedProfile: InboxProfile;
  profiles: InboxProfile[];
  profileDirectoryOpen: boolean;
  onToggleProfileDirectory: () => void;
  onSelectProfile: (profile: InboxProfile) => void;
  conversations: ConceptConversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  conversationFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.name.toLowerCase().includes(search.toLowerCase()) || conversation.preview.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = conversationFilter === "all" || (conversationFilter === "unread" ? Boolean(conversation.unread) : Boolean(conversation.archived));
    return matchesSearch && matchesFilter;
  });
  const pinnedConversations = filteredConversations.filter((conversation) => conversation.pinned);
  const recentConversations = filteredConversations.filter((conversation) => !conversation.pinned);
  const filterOptions: Array<{ value: ConversationFilter; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "Não lidas" },
    { value: "archived", label: "Arquivadas" },
  ];

  return (
    <section className="min-h-0 min-w-0 border-r-0 border-territory-border bg-territory-canvas px-4 py-5 sm:px-5 lg:w-[24.75rem] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:px-5 lg:py-4">
      <h1 className="font-heading text-[1.5rem] font-bold tracking-[-0.04em] text-territory-ink lg:text-[1.75rem]">Conversas</h1>
      <ProfileStrip selected={selectedProfile} profiles={profiles} onSelect={onSelectProfile} />
      <button type="button" onClick={onToggleProfileDirectory} aria-expanded={profileDirectoryOpen} aria-controls="all-inbox-profiles" className="mx-auto mt-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-territory-brand transition-colors hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <Grid3X3 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Todos os perfis
        <ChevronRight className={cn("h-4 w-4 transition-transform", profileDirectoryOpen && "rotate-90")} aria-hidden="true" />
      </button>
      {profileDirectoryOpen ? (
        <div id="all-inbox-profiles" className="mt-2 rounded-2xl border border-territory-border bg-territory-surface p-2 shadow-territory-subtle">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-territory-muted">Todos os perfis</p>
          {profiles.map((profile) => <ProfileDirectoryRow key={`directory-${profile.key}`} profile={profile} selected={profile.key === selectedProfile.key} onSelect={() => onSelectProfile(profile)} />)}
        </div>
      ) : null}
      <button type="button" onClick={onToggleProfileDirectory} className="mt-3 flex w-full items-center gap-2 rounded-lg px-1 text-left text-sm text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
        <span>Caixa de entrada: </span><strong className="truncate font-semibold">{selectedProfile.name}</strong><ChevronDown className="ml-auto h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
      </button>
      <label className="relative mt-3 block">
        <span className="sr-only">Buscar conversa</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} type="search" placeholder="Buscar pessoa ou mensagem" className="h-11 w-full rounded-xl border border-territory-border bg-territory-surface pl-11 pr-10 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20" />
        {search ? <button type="button" onClick={() => onSearchChange("")} aria-label="Limpar busca" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-raised"><X className="h-4 w-4" aria-hidden="true" /></button> : null}
      </label>
      <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Filtro de conversas">
        {filterOptions.map((option) => {
          const active = conversationFilter === option.value;
          return <button key={option.value} type="button" role="tab" aria-selected={active} onClick={() => onFilterChange(option.value)} className={cn("min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand", active ? "border-territory-brand bg-territory-brand font-semibold text-white" : "border-transparent bg-territory-raised text-territory-ink hover:border-territory-border")}>{option.label}</button>;
        })}
        <button type="button" aria-label="Abrir filtros" className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full border border-territory-border px-3 text-xs font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Filtros</button>
      </div>
      <div className="mt-4">
        {pinnedConversations.length ? <div><h2 className="mb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-territory-muted">Fixadas</h2>{pinnedConversations.map((conversation) => <ConversationListItem key={conversation.id} conversation={conversation} selected={conversation.id === selectedConversationId} onClick={() => onSelectConversation(conversation.id)} />)}</div> : null}
        {recentConversations.length ? <div className={cn(pinnedConversations.length && "mt-4")}><h2 className="mb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-territory-muted">Recentes</h2>{recentConversations.map((conversation) => <ConversationListItem key={conversation.id} conversation={conversation} selected={conversation.id === selectedConversationId} onClick={() => onSelectConversation(conversation.id)} />)}</div> : null}
        {!filteredConversations.length ? <p className="rounded-xl border border-dashed border-territory-border px-4 py-6 text-center text-sm text-territory-muted">Você ainda não tem conversas nesta caixa.</p> : null}
      </div>
    </section>
  );
}

function MessageBubble({ body, time, mine }: { body: string; time: string; mine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[82%] rounded-2xl border px-4 py-3", mine ? "rounded-br-md border-transparent bg-[hsl(var(--territory-success)/0.18)]" : "rounded-bl-md border-territory-border bg-territory-surface")}>
        <p className="text-[0.9375rem] leading-6 text-territory-ink">{body}</p>
        <p className="mt-1 text-right text-xs text-territory-muted">{time}{mine ? "  ✓✓" : ""}</p>
      </div>
    </div>
  );
}

function ConversationDetail({
  conversation,
  selectedProfile,
  messages,
  onSend,
  canSend,
}: {
  conversation: ConceptConversation;
  selectedProfile: InboxProfile;
  messages?: Array<{ id: string; body: string; time: string; mine: boolean }>;
  onSend: (body: string) => Promise<void> | void;
  canSend: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages ?? conceptMessages);

  useEffect(() => {
    setLocalMessages(messages ?? conceptMessages);
  }, [conversation.id, messages]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setLocalMessages((current) => [...current, { id: `local-${Date.now()}`, body, time: "agora", mine: true }]);
    setDraft("");
    void onSend(body);
  };

  return (
    <section className="hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-territory-canvas lg:flex">
      <div className="flex min-h-[5.25rem] items-center gap-4 border-b border-territory-border px-7">
        <ProfileAvatar profile={conversation} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-[1.35rem] font-bold tracking-[-0.03em] text-territory-ink">{conversation.name}</h2>
          <p className="truncate text-sm text-territory-muted">Cliente · conversa com Sabores da Ana</p>
        </div>
        <button type="button" aria-label="Mais opções da conversa" className="flex h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"><MoreVertical className="h-5 w-5" aria-hidden="true" /></button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-7 py-5">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--territory-success)/0.1)] px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-territory-surface text-territory-brand" aria-hidden="true"><Utensils className="h-4 w-4" strokeWidth={2} /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-territory-ink">Sobre: almoço caseiro</span>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-territory-brand hover:underline">Ver anúncio <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="my-6 flex items-center gap-4 text-xs text-territory-muted"><span className="h-px flex-1 bg-territory-border" />Hoje<span className="h-px flex-1 bg-territory-border" /></div>
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto pb-5">
          {localMessages.map((message) => <MessageBubble key={message.id} body={message.body} time={message.time} mine={message.mine} />)}
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-territory-border bg-territory-surface p-3 shadow-territory-subtle">
          <div className="mb-3 flex items-center gap-3 px-1">
            <ConceptProfileIcon profile={selectedProfile} size="sm" />
            <span className="text-sm text-territory-muted">Respondendo como <strong className="font-semibold text-territory-ink">{selectedProfile.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Adicionar anexo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-raised text-territory-brand hover:bg-[hsl(var(--territory-brand)/0.12)]"><Plus className="h-5 w-5" aria-hidden="true" /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!canSend} placeholder="Escreva uma mensagem" className="h-11 min-w-0 flex-1 rounded-full border border-territory-border bg-territory-canvas px-4 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || !canSend} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-ink transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        </form>
      </div>
    </section>
  );
}

function MobileConversationDetail({
  conversation,
  selectedProfile,
  messages,
  onSend,
  canSend,
  onBack,
}: {
  conversation: ConceptConversation;
  selectedProfile: InboxProfile;
  messages?: Array<{ id: string; body: string; time: string; mine: boolean }>;
  onSend: (body: string) => Promise<void> | void;
  canSend: boolean;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages ?? conceptMessages);

  useEffect(() => {
    setLocalMessages(messages ?? conceptMessages);
  }, [conversation.id, messages]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setLocalMessages((current) => [...current, { id: `mobile-local-${Date.now()}`, body, time: "agora", mine: true }]);
    setDraft("");
    void onSend(body);
  };

  return (
    <section className="flex h-[100dvh] min-h-0 flex-col bg-territory-canvas pt-[env(safe-area-inset-top)]">
      <header className="flex min-h-16 items-center gap-3 border-b border-territory-border bg-territory-surface px-4">
        <button type="button" onClick={onBack} aria-label="Voltar para conversas" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
        <ProfileAvatar profile={conversation} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-base font-bold text-territory-ink">{conversation.name}</h1>
          <p className="truncate text-xs text-territory-muted">Cliente · conversa com Sabores da Ana</p>
        </div>
        <button type="button" aria-label="Mais opções da conversa" className="flex h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><MoreVertical className="h-5 w-5" aria-hidden="true" /></button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--territory-success)/0.1)] px-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-territory-surface text-territory-brand" aria-hidden="true"><Utensils className="h-4 w-4" strokeWidth={2} /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-territory-ink">Sobre: almoço caseiro</span>
          <button type="button" className="text-sm font-semibold text-territory-brand hover:underline">Ver anúncio</button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-territory-muted"><span className="h-px flex-1 bg-territory-border" />Hoje<span className="h-px flex-1 bg-territory-border" /></div>
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto pb-4">
          {localMessages.map((message) => <MessageBubble key={message.id} body={message.body} time={message.time} mine={message.mine} />)}
        </div>
        <form onSubmit={submit} className="mt-3 shrink-0 rounded-2xl border border-territory-border bg-territory-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-territory-subtle">
          <div className="mb-3 flex items-center gap-3 px-1"><ConceptProfileIcon profile={selectedProfile} size="sm" /><span className="min-w-0 truncate text-sm text-territory-muted">Respondendo como <strong className="font-semibold text-territory-ink">{selectedProfile.name}</strong></span></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Adicionar anexo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-raised text-territory-brand hover:bg-[hsl(var(--territory-brand)/0.12)]"><Plus className="h-5 w-5" aria-hidden="true" /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!canSend} placeholder="Escreva uma mensagem" className="h-11 min-w-0 flex-1 rounded-full border border-territory-border bg-territory-canvas px-4 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || !canSend} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-ink disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        </form>
      </div>
    </section>
  );
}

function MobileBottomNavigation({ territoryHref }: { territoryHref: string }) {
  const items = [
    { label: "Início", href: territoryHref, icon: Home },
    { label: "Explorar", href: buildModuleTerritoryUrl(MODULE_SLUGS.search, territoryHref), icon: Search },
    { label: "Comunidade", href: buildCommunityTerritoryUrl(territoryHref), icon: Users },
    { label: "Conversas", href: "/mensagens", icon: MessageCircle, active: true },
    { label: "Conta", href: "/conta", icon: UserRound },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] border-t border-territory-border bg-territory-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegação principal mobile">
      {items.map((item) => {
        const Icon = item.icon;
        return <Link key={item.label} to={item.href} className={cn("relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", item.active && "font-semibold text-territory-brand")} aria-current={item.active ? "page" : undefined}><span className="relative"><Icon className="h-5 w-5" strokeWidth={item.active ? 2.2 : 1.8} aria-hidden="true" />{item.active ? <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-territory-sun" /> : null}</span><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}

function buildInboxProfiles(sessionProfiles: SessionProfileView[], conceptMockEnabled: boolean): InboxProfile[] {
  const profileByKind = new Map(sessionProfiles.map((profile) => [getProfileKind(profile.profileType), profile]));
  const fallback: Record<ProfileKind, InboxProfile> = {
    personal: { key: "personal", name: "Ana Silva", typeLabel: "Pessoal", avatarUrl: merchantImage, unread: 2 },
    business: { key: "business", name: "Sabores da Ana", typeLabel: "Negócio", avatarUrl: foodImage, unread: 12 },
    professional: { key: "professional", name: "Ana Serviços", typeLabel: "Profissional", avatarUrl: providerImage, unread: 0 },
  };
  return (["personal", "business", "professional"] as ProfileKind[]).map((key) => {
    const profile = profileByKind.get(key);
    if (!profile) return { ...fallback[key], unread: conceptMockEnabled ? fallback[key].unread : 0 };
    return {
      ...fallback[key],
      id: profile.id,
      profile,
      name: conceptMockEnabled ? fallback[key].name : profile.displayName || profile.name,
      avatarUrl: profile.avatarUrl || fallback[key].avatarUrl,
      unread: conceptMockEnabled ? fallback[key].unread : 0,
    };
  });
}

function toConceptConversation(thread: CommunityDirectThreadPreview): ConceptConversation {
  return {
    id: thread.id,
    name: thread.other_profile_name,
    avatarUrl: thread.other_profile_avatar || residentImage,
    preview: thread.last_message_text,
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(thread.last_message_at)),
    unread: thread.unread_count || undefined,
  };
}

function mapLiveMessage(message: CommunityDirectMessage, profileId: string | undefined) {
  return {
    id: message.id,
    body: message.body,
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at)),
    mine: message.sender_profile_id === profileId,
  };
}

export default function MensagensPage() {
  const [searchParams] = useSearchParams();
  const { active } = usePublicBrowsingCity();
  const { activeProfile, profiles, switchProfile } = useSessionContext();
  const conceptMockEnabled = import.meta.env.DEV && searchParams.get("concept-mock") === "1";
  const [profileDirectoryOpen, setProfileDirectoryOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [selectedProfileKey, setSelectedProfileKey] = useState<ProfileKind>(conceptMockEnabled ? "business" : "personal");
  const [selectedConversationId, setSelectedConversationId] = useState(conceptConversations[0].id);
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>("all");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { conversations: liveThreads, messages: liveMessages, fetchConversations, fetchMessages, sendMessage } = useCommunityDirectMessages();
  const inboxProfiles = useMemo(() => buildInboxProfiles(profiles, conceptMockEnabled), [conceptMockEnabled, profiles]);
  const selectedProfile = inboxProfiles.find((profile) => profile.key === selectedProfileKey) ?? inboxProfiles[0]!;
  const liveConversations = useMemo(() => liveThreads.map(toConceptConversation), [liveThreads]);
  const conversations = conceptMockEnabled ? conceptConversations : liveConversations;
  const profileConversations = conceptMockEnabled
    ? conversations.filter((conversation) => conceptConversationIdsByProfile[selectedProfileKey].includes(conversation.id))
    : conversations;
  const selectedConversation = profileConversations.find((conversation) => conversation.id === selectedConversationId) ?? profileConversations[0];
  const isLiveConversation = Boolean(selectedConversation && liveConversations.some((conversation) => conversation.id === selectedConversation.id));
  const liveDisplayMessages = useMemo(() => liveMessages.map((message) => mapLiveMessage(message, activeProfile?.id)), [activeProfile?.id, liveMessages]);
  const territoryName = conceptMockEnabled ? "Complexo do Nordeste de Amaralina" : active.city ? formatTerritoryLabel(active.city) : "Seu território";
  const contextLabel = `${active.city ? formatTerritoryLabel(active.city) : "Salvador"}, ${active.state.toUpperCase()}`;
  const territoryHref = conceptMockEnabled ? "/ba/salvador/complexo-do-nordeste-de-amaralina" : `/${active.state}/${active.city}`;
  const selectedConversationData = selectedConversation ?? conceptConversations[0];

  useEffect(() => {
    if (!conceptMockEnabled) void fetchConversations();
  }, [conceptMockEnabled, fetchConversations]);

  useEffect(() => {
    if (!conceptMockEnabled && profiles.length > 0) {
      const activeOption = inboxProfiles.find((profile) => profile.id === activeProfile?.id);
      if (activeOption) setSelectedProfileKey(activeOption.key);
    }
  }, [activeProfile?.id, conceptMockEnabled, inboxProfiles, profiles.length]);

  useEffect(() => {
    if (!liveConversations.length || conceptMockEnabled) return;
    setSelectedConversationId((current) => liveConversations.some((conversation) => conversation.id === current) ? current : liveConversations[0].id);
  }, [conceptMockEnabled, liveConversations]);

  useEffect(() => {
    if (!conceptMockEnabled && isLiveConversation && selectedConversation) void fetchMessages(selectedConversation.id);
  }, [conceptMockEnabled, fetchMessages, isLiveConversation, selectedConversation]);

  const handleSelectProfile = async (profile: InboxProfile) => {
    setSelectedProfileKey(profile.key);
    setProfileDirectoryOpen(false);
    setDesktopAccountMenuOpen(false);
    if (profile.id && profile.id !== activeProfile?.id) {
      try {
        await switchProfile(profile.id);
      } catch {
        // A server-side profile switch error remains available through session context.
      }
    }
  };

  const handleSend = async (body: string) => {
    if (isLiveConversation && selectedConversation) await sendMessage(selectedConversation.id, body);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMobileConversationOpen(true);
  };

  const mobileList = (
    <ConversationColumn
      selectedProfile={selectedProfile}
      profiles={inboxProfiles}
      profileDirectoryOpen={profileDirectoryOpen}
      onToggleProfileDirectory={() => setProfileDirectoryOpen((open) => !open)}
      onSelectProfile={handleSelectProfile}
      conversations={profileConversations}
      selectedConversationId={selectedConversationData.id}
      onSelectConversation={handleSelectConversation}
      conversationFilter={conversationFilter}
      onFilterChange={setConversationFilter}
      search={search}
      onSearchChange={setSearch}
    />
  );

  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="lg:hidden">
        {mobileConversationOpen && selectedConversation ? (
          <MobileConversationDetail conversation={selectedConversationData} selectedProfile={selectedProfile} messages={conceptMockEnabled ? undefined : liveDisplayMessages} onSend={handleSend} canSend={conceptMockEnabled || isLiveConversation} onBack={() => setMobileConversationOpen(false)} />
        ) : (
          <>
            <main className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[5.25rem]">{mobileList}</main>
            <MobileBottomNavigation territoryHref={territoryHref} />
          </>
        )}
      </div>

      <div className="hidden h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-territory-canvas lg:flex">
        <DesktopHeader territoryName={territoryName} contextLabel={contextLabel} account={inboxProfiles.find((profile) => profile.key === "personal") ?? selectedProfile} accountMenuOpen={desktopAccountMenuOpen} onToggleAccount={() => setDesktopAccountMenuOpen((open) => !open)} profileOptions={inboxProfiles} onSelectProfile={handleSelectProfile} />
        <main className="mx-auto flex min-h-0 w-full max-w-[68rem] flex-1 px-4 py-4 xl:px-0 xl:py-5">
          <div className="flex min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-territory-border bg-territory-canvas shadow-territory-subtle">
            <DesktopNavigation territoryHref={territoryHref} />
            {mobileList}
            {selectedConversation ? <ConversationDetail conversation={selectedConversationData} selectedProfile={selectedProfile} messages={conceptMockEnabled ? undefined : liveDisplayMessages} onSend={handleSend} canSend={conceptMockEnabled || isLiveConversation} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
