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
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

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

type ProfileKind = "personal" | "business" | "professional" | "other";

interface InboxProfile {
  key: string;
  kind: ProfileKind;
  id: string;
  name: string;
  typeLabel: string;
  avatarUrl: string;
  unread: number;
  profile: SessionProfileView;
}

interface InboxConversation {
  id: string;
  name: string;
  avatarUrl: string;
  preview: string;
  time: string;
  unread?: number;
  closed?: boolean;
  contextTitle?: string;
}

type ConversationFilter = "all" | "unread" | "closed";

function getProfileKind(profileType: string | undefined): ProfileKind {
  if (profileType === "personal") return "personal";
  if (profileType === "business") return "business";
  if (profileType === "professional") return "professional";
  return "other";
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

function formatMessagingTimestamp(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(
    "pt-BR",
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
  ).format(date);
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

function InboxProfileIcon({
  profile,
  size = "md",
}: {
  profile: InboxProfile;
  size?: "sm" | "md" | "lg";
}) {
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
      <InboxProfileIcon profile={profile} size="sm" />
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
        <Link
          to="/notificacoes"
          aria-label="Notificações"
          className="flex h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
        </Link>
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
  return profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt=""
      className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white"
    />
  ) : (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-territory-raised text-sm font-bold text-territory-brand ring-2 ring-white">
      {getInitials(profile.name)}
    </span>
  );
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
            <span className="max-w-full text-[0.8125rem] font-semibold leading-tight">{profile.kind === "personal" ? "Pessoal" : profile.name}</span>
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
  conversation: InboxConversation;
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
      {conversation.unread ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-territory-error px-1 text-[0.6875rem] font-bold text-white">
          {conversation.unread}
        </span>
      ) : null}
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
  conversations: InboxConversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  conversationFilter: ConversationFilter;
  onFilterChange: (filter: ConversationFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.name.toLowerCase().includes(search.toLowerCase()) || conversation.preview.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = conversationFilter === "all" || (conversationFilter === "unread" ? Boolean(conversation.unread) : Boolean(conversation.closed));
    return matchesSearch && matchesFilter;
  });
  const filterOptions: Array<{ value: ConversationFilter; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "unread", label: "Não lidas" },
    { value: "closed", label: "Encerradas" },
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

      </div>
      <div className="mt-4">
        {filteredConversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            selected={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
        {!filteredConversations.length ? (
          <p className="rounded-xl border border-dashed border-territory-border px-4 py-6 text-center text-sm text-territory-muted">
            Você ainda não tem conversas nesta caixa.
          </p>
        ) : null}
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
  conversation: InboxConversation;
  selectedProfile: InboxProfile;
  messages?: Array<{ id: string; body: string; time: string; mine: boolean }>;
  onSend: (body: string) => Promise<boolean> | boolean;
  canSend: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !canSend || sending) return;

    setSending(true);
    try {
      const sent = await onSend(body);
      if (sent) setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-territory-canvas lg:flex">
      <div className="flex min-h-[5.25rem] items-center gap-4 border-b border-territory-border px-7">
        <ProfileAvatar profile={conversation} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-[1.35rem] font-bold tracking-[-0.03em] text-territory-ink">{conversation.name}</h2>
          <p className="truncate text-sm text-territory-muted">Conversa como {selectedProfile.name}</p>
        </div>

      </div>
      <div className="flex min-h-0 flex-1 flex-col px-7 py-5">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--territory-success)/0.1)] px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-territory-surface text-territory-brand" aria-hidden="true"><MessageCircle className="h-4 w-4" strokeWidth={2} /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-territory-ink">{conversation.contextTitle ? `Sobre: ${conversation.contextTitle}` : "Conversa direta"}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto pb-5">
          {(messages ?? []).map((message) => <MessageBubble key={message.id} body={message.body} time={message.time} mine={message.mine} />)}
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-territory-border bg-territory-surface p-3 shadow-territory-subtle">
          <div className="mb-3 flex items-center gap-3 px-1">
            <InboxProfileIcon profile={selectedProfile} size="sm" />
            <span className="text-sm text-territory-muted">Respondendo como <strong className="font-semibold text-territory-ink">{selectedProfile.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">

            <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!canSend} placeholder="Escreva uma mensagem" className="h-11 min-w-0 flex-1 rounded-full border border-territory-border bg-territory-canvas px-4 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || !canSend || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-ink transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-5 w-5" aria-hidden="true" /></button>
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
  conversation: InboxConversation;
  selectedProfile: InboxProfile;
  messages?: Array<{ id: string; body: string; time: string; mine: boolean }>;
  onSend: (body: string) => Promise<boolean> | boolean;
  canSend: boolean;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !canSend || sending) return;

    setSending(true);
    try {
      const sent = await onSend(body);
      if (sent) setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex h-[100dvh] min-h-0 flex-col bg-territory-canvas pt-[env(safe-area-inset-top)]">
      <header className="flex min-h-16 items-center gap-3 border-b border-territory-border bg-territory-surface px-4">
        <button type="button" onClick={onBack} aria-label="Voltar para conversas" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
        <ProfileAvatar profile={conversation} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-base font-bold text-territory-ink">{conversation.name}</h1>
          <p className="truncate text-xs text-territory-muted">Conversa como {selectedProfile.name}</p>
        </div>

      </header>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="flex min-h-12 items-center gap-3 rounded-xl bg-[hsl(var(--territory-success)/0.1)] px-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-territory-surface text-territory-brand" aria-hidden="true"><MessageCircle className="h-4 w-4" strokeWidth={2} /></span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-territory-ink">{conversation.contextTitle ? `Sobre: ${conversation.contextTitle}` : "Conversa direta"}</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto pb-4">
          {(messages ?? []).map((message) => <MessageBubble key={message.id} body={message.body} time={message.time} mine={message.mine} />)}
        </div>
        <form onSubmit={submit} className="mt-3 shrink-0 rounded-2xl border border-territory-border bg-territory-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-territory-subtle">
          <div className="mb-3 flex items-center gap-3 px-1"><InboxProfileIcon profile={selectedProfile} size="sm" /><span className="min-w-0 truncate text-sm text-territory-muted">Respondendo como <strong className="font-semibold text-territory-ink">{selectedProfile.name}</strong></span></div>
          <div className="flex items-center gap-2">

            <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!canSend} placeholder="Escreva uma mensagem" className="h-11 min-w-0 flex-1 rounded-full border border-territory-border bg-territory-canvas px-4 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20 disabled:cursor-not-allowed disabled:opacity-60" />
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || !canSend || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-ink disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-5 w-5" aria-hidden="true" /></button>
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

function buildInboxProfiles(sessionProfiles: SessionProfileView[]): InboxProfile[] {
  return sessionProfiles.map((profile) => {
    const kind = getProfileKind(profile.profileType);
    const typeLabel =
      kind === "personal"
        ? "Pessoal"
        : kind === "business"
          ? "Negócio"
          : kind === "professional"
            ? "Profissional"
            : "Perfil";

    return {
      key: profile.id,
      kind,
      id: profile.id,
      name: profile.displayName || profile.name || "Perfil sem nome",
      typeLabel,
      avatarUrl: profile.avatarUrl || "",
      unread: 0,
      profile,
    };
  });
}

function toInboxConversation(thread: CommunityDirectThreadPreview): InboxConversation {
  return {
    id: thread.id,
    name: thread.other_profile_name,
    avatarUrl: thread.other_profile_avatar || "",
    preview: thread.last_message_text,
    time: formatMessagingTimestamp(thread.last_message_at),
    unread: thread.unread_count || undefined,
    closed: Boolean(thread.closed_at),
    contextTitle: thread.post_title || undefined,
  };
}

function mapLiveMessage(message: CommunityDirectMessage, profileId: string | undefined) {
  return {
    id: message.id,
    body: message.body,
    time: formatMessagingTimestamp(message.created_at),
    mine: message.sender_profile_id === profileId,
  };
}

export default function MensagensPage() {
  const { active } = usePublicBrowsingCity();
  const { activeProfile, profiles, switchProfile } = useSessionContext();
  const [profileDirectoryOpen, setProfileDirectoryOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(
    () => activeProfile?.id ?? "",
  );
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>("all");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    conversations: liveThreads,
    messages: liveMessages,
    fetchConversations,
    fetchMessages,
    sendMessage,
  } = useCommunityDirectMessages();
  const sessionProfiles = useMemo(
    () =>
      profiles.length > 0
        ? profiles
        : activeProfile
          ? [activeProfile]
          : [],
    [activeProfile, profiles],
  );
  const inboxProfiles = useMemo(
    () => buildInboxProfiles(sessionProfiles),
    [sessionProfiles],
  );
  const selectedProfile =
    inboxProfiles.find((profile) => profile.id === selectedProfileId) ??
    inboxProfiles.find((profile) => profile.id === activeProfile?.id) ??
    inboxProfiles[0];
  const liveConversations = useMemo(
    () => liveThreads.map(toInboxConversation),
    [liveThreads],
  );
  const profileConversations =
    selectedProfile?.id === activeProfile?.id ? liveConversations : [];
  const selectedConversation =
    profileConversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? profileConversations[0];
  const liveDisplayMessages = useMemo(
    () =>
      liveMessages.map((message) =>
        mapLiveMessage(message, activeProfile?.id),
      ),
    [activeProfile?.id, liveMessages],
  );
  const territoryName = active.city
    ? formatTerritoryLabel(active.city)
    : "Seu território";
  const contextLabel = `${active.city ? formatTerritoryLabel(active.city) : "Salvador"}, ${active.state.toUpperCase()}`;
  const territoryHref =
    active.state && active.city ? `/${active.state}/${active.city}` : "/";

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeProfile?.id) return;
    setSelectedProfileId(activeProfile.id);
    setSelectedConversationId("");
  }, [activeProfile?.id]);

  useEffect(() => {
    if (!liveConversations.length) {
      setSelectedConversationId("");
      return;
    }
    setSelectedConversationId((current) =>
      liveConversations.some((conversation) => conversation.id === current)
        ? current
        : liveConversations[0].id,
    );
  }, [liveConversations]);

  const activeConversationId = selectedConversation?.id;
  useEffect(() => {
    if (activeConversationId) void fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  if (!selectedProfile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-territory-canvas px-4">
        <div className="max-w-md rounded-2xl border border-territory-border bg-territory-surface p-6 text-center">
          <h1 className="font-heading text-xl font-semibold text-territory-ink">
            Nenhum perfil disponível
          </h1>
          <p className="mt-2 text-sm leading-6 text-territory-muted">
            As conversas ficam disponíveis quando sua conta possui um perfil ativo.
          </p>
          <Link
            to="/conta"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-territory-brand px-4 text-sm font-semibold text-white"
          >
            Abrir conta
          </Link>
        </div>
      </main>
    );
  }

  const handleSelectProfile = async (profile: InboxProfile) => {
    setSelectedProfileId(profile.id);
    setSelectedConversationId("");
    setProfileDirectoryOpen(false);
    setDesktopAccountMenuOpen(false);

    if (profile.id === activeProfile?.id) return;

    try {
      await switchProfile(profile.id);
    } catch {
      setSelectedProfileId(activeProfile?.id ?? "");
    }
  };

  const handleSend = async (body: string) => {
    if (!selectedConversation) return false;
    return sendMessage(selectedConversation.id, body);
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
      selectedConversationId={selectedConversation?.id ?? ""}
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
          <MobileConversationDetail conversation={selectedConversation} selectedProfile={selectedProfile} messages={liveDisplayMessages} onSend={handleSend} canSend={Boolean(selectedConversation)} onBack={() => setMobileConversationOpen(false)} />
        ) : (
          <>
            <main className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[5.25rem]">{mobileList}</main>
            <MobileBottomNavigation territoryHref={territoryHref} />
          </>
        )}
      </div>

      <div className="hidden h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-territory-canvas lg:flex">
        <DesktopHeader territoryName={territoryName} contextLabel={contextLabel} account={selectedProfile} accountMenuOpen={desktopAccountMenuOpen} onToggleAccount={() => setDesktopAccountMenuOpen((open) => !open)} profileOptions={inboxProfiles} onSelectProfile={handleSelectProfile} />
        <main className="mx-auto flex min-h-0 w-full max-w-[68rem] flex-1 px-4 py-4 xl:px-0 xl:py-5">
          <div className="flex min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-territory-border bg-territory-canvas shadow-territory-subtle">
            <DesktopNavigation territoryHref={territoryHref} />
            {mobileList}
            {selectedConversation ? <ConversationDetail conversation={selectedConversation} selectedProfile={selectedProfile} messages={liveDisplayMessages} onSend={handleSend} canSend={Boolean(selectedConversation)} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
