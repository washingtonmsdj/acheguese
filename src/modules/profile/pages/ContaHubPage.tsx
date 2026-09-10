import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Accessibility,
  Bell,
  Bookmark,
  Building2,
  ChevronRight,
  CircleAlert,
  Compass,
  FileText,
  Globe2,
  HelpCircle,
  Home,
  LockKeyhole,
  MessageCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Star,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { ContaHubLayout } from "./ContaHubLayout";
import { getProfileTypeLabel } from "@/core/profiles/utils/profileDomainRules";
import type { Profile as RuntimeProfile } from "@/core/profiles/services/multi-profile/types";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import marketImage from "@/assets/complexo-comercio.jpg";
import personalImage from "@/assets/persona-comerciante.jpg";
import professionalImage from "@/assets/persona-prestador.jpg";
import { cn } from "@/shared/utils/cn";

function GuardCard({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
      <section className="w-full max-w-lg rounded-territory-highlight border border-territory-border bg-territory-surface p-6 text-center sm:p-8">
        {icon}
        <h1 className="mt-4 font-heading text-xl font-semibold text-territory-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-territory-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      </section>
    </div>
  );
}

function AccountAction({
  icon: Icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[4.75rem] w-full items-center gap-3 border-b border-territory-border px-1 py-3 text-left last:border-b-0 focus-visible:rounded-territory"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-brand/10 text-territory-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-territory-ink">{title}</span>
          {meta ? (
            <span className="rounded-full bg-territory-raised px-2 py-0.5 text-[0.6875rem] font-semibold text-territory-muted">
              {meta}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-territory-muted">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

type ConceptProfileCategory = "personal" | "business" | "professional";
type ConceptProfileFilter = "all" | ConceptProfileCategory;

interface ConceptManagedProfile {
  id: string;
  name: string;
  category: ConceptProfileCategory;
  categoryLabel: string;
  contextLabel: string;
  permissionLabel: string;
  avatarUrl?: string;
  favorite: boolean;
  status?: "published";
  pending?: string;
  conversationCount?: number;
  primaryAction: string;
  secondaryAction: string;
  messageAction?: string;
}

const conceptManagedProfiles: ConceptManagedProfile[] = [
  {
    id: "concept-ana-oliveira",
    name: "Ana Oliveira",
    category: "personal",
    categoryLabel: "Pessoal",
    contextLabel: "Seu perfil na comunidade",
    permissionLabel: "",
    avatarUrl: personalImage,
    favorite: true,
    primaryAction: "Editar perfil",
    secondaryAction: "Ver perfil público",
  },
  {
    id: "concept-sabores-da-ana",
    name: "Sabores da Ana",
    category: "business",
    categoryLabel: "Negócio · Gastronomia",
    contextLabel: "Proprietária",
    permissionLabel: "Proprietária",
    avatarUrl: foodImage,
    favorite: true,
    status: "published",
    conversationCount: 12,
    primaryAction: "Gerenciar",
    secondaryAction: "Ver página",
    messageAction: "Conversas",
  },
  {
    id: "concept-ana-servicos",
    name: "Ana Serviços",
    category: "professional",
    categoryLabel: "Profissional",
    contextLabel: "Proprietária",
    permissionLabel: "Proprietária",
    favorite: false,
    pending: "Falta definir a região de atendimento",
    primaryAction: "Completar perfil",
    secondaryAction: "Editar informações",
  },
  {
    id: "concept-mercado-da-praca",
    name: "Mercado da Praça",
    category: "business",
    categoryLabel: "Negócio",
    contextLabel: "Integrante da equipe",
    permissionLabel: "Integrante da equipe",
    avatarUrl: marketImage,
    favorite: false,
    status: "published",
    conversationCount: 3,
    primaryAction: "Abrir atendimento",
    secondaryAction: "",
    messageAction: "Conversas",
  },
];

function ConceptManagedProfileAvatar({ profile }: { profile: ConceptManagedProfile }) {
  if (profile.avatarUrl) {
    return <img src={profile.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-[4.5rem] sm:w-[4.5rem]" />;
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-territory-sun text-territory-brand sm:h-[4.5rem] sm:w-[4.5rem]">
      <Wrench className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

function ConceptAccountHeader() {
  return (
    <header className="hidden h-16 items-center border-b border-territory-border bg-territory-surface px-6 lg:flex xl:px-8">
      <Link to="/" className="font-heading text-2xl font-bold tracking-[-0.06em] text-territory-brand" aria-label="Achegue-se — início">
        achegue-se<span className="text-territory-sun">.</span>
      </Link>
      <div className="ml-8 flex items-center gap-3 border-l border-territory-border pl-8 text-sm text-territory-ink">
        <MapPin className="h-5 w-5 text-territory-brand" aria-hidden="true" />
        <span>
          <strong className="block font-semibold">Complexo do Nordeste de Amaralina</strong>
          <span className="block text-xs text-territory-muted">Salvador, BA</span>
        </span>
        <ChevronRight className="h-4 w-4 rotate-90 text-territory-muted" aria-hidden="true" />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button type="button" aria-label="Notificações" className="flex h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 border-l border-territory-border pl-4 text-sm font-semibold text-territory-ink">
          <img src={personalImage} alt="" className="h-9 w-9 rounded-full object-cover" />
          Ana Oliveira
          <ChevronRight className="h-4 w-4 rotate-90 text-territory-muted" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}

function ConceptAccountSidebar() {
  const primaryItems = [
    { label: "Início", href: "/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Home },
    { label: "Explorar", href: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Compass },
    { label: "Comunidade", href: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Users },
    { label: "Conversas", href: "/mensagens?concept-mock=1", icon: MessageCircle },
    { label: "Conta", href: "/conta?concept-mock=1", icon: UserRound, active: true },
  ];
  const accountItems = [
    { label: "Meus perfis", href: "/conta?concept-mock=1", icon: UserRound, active: true },
    { label: "Publicações e anúncios", href: "/conta?concept-mock=1", icon: FileText },
    { label: "Salvos", href: "/conta?concept-mock=1", icon: Bookmark },
    { label: "Comunidades", href: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Users },
    { label: "Notificações", href: "/conta/notificacoes", icon: Bell },
    { label: "Privacidade e segurança", href: "/conta/privacidade", icon: Shield },
    { label: "Acessibilidade", href: "/conta?concept-mock=1", icon: Accessibility },
    { label: "Ajuda", href: "/conta?concept-mock=1", icon: HelpCircle },
  ];

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[4.5rem] flex-col border-r border-territory-border bg-territory-surface px-2 py-4 md:flex xl:hidden" aria-label="Navegação da conta">
        <nav className="flex flex-1 flex-col gap-1">
          {primaryItems.map(({ label, href, icon: Icon, active }) => <Link key={label} to={href} aria-label={label} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center justify-center rounded-xl text-territory-muted hover:bg-territory-raised", active && "bg-[hsl(var(--territory-brand)/0.12)] text-territory-brand")}><Icon className="h-5 w-5" aria-hidden="true" /></Link>)}
        </nav>
      </aside>
      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-44 flex-col border-r border-territory-border bg-territory-surface px-3 py-5 xl:flex" aria-label="Navegação da conta">
        <nav className="flex flex-col gap-1">
          {primaryItems.map(({ label, href, icon: Icon, active }) => <Link key={label} to={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-territory-ink hover:bg-territory-raised", active && "bg-[hsl(var(--territory-success)/0.16)] font-semibold text-territory-brand")}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{label}</span></Link>)}
        </nav>
        <div className="my-4 border-t border-territory-border" />
        <nav className="flex flex-col gap-1">
          {accountItems.map(({ label, href, icon: Icon, active }) => <Link key={label} to={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-territory-ink hover:bg-territory-raised", active && "border-l-2 border-territory-brand bg-[hsl(var(--territory-success)/0.16)] font-semibold text-territory-brand")}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span></Link>)}
        </nav>
      </aside>
    </>
  );
}

function ConceptManagedProfileCard({
  profile,
  favorite,
  onToggleFavorite,
  onPrimary,
  onSecondary,
  onMessages,
}: {
  profile: ConceptManagedProfile;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPrimary: () => void;
  onSecondary: () => void;
  onMessages: () => void;
}) {
  const isPersonal = profile.category === "personal";
  return (
    <article className="relative rounded-2xl border border-territory-border bg-territory-surface p-3 sm:p-4 md:flex md:items-center md:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <ConceptManagedProfileAvatar profile={profile} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate font-heading text-base font-bold tracking-[-0.025em] text-territory-ink sm:text-[1.05rem]">{profile.name}</h2>
          <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-[hsl(var(--territory-info)/0.14)] px-2.5 py-1 text-xs font-semibold text-territory-brand">{profile.categoryLabel}</span>
          <p className="mt-1 text-sm text-territory-muted">{profile.contextLabel}</p>
          {profile.status ? <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-territory-success"><span className="h-2 w-2 rounded-full bg-territory-success" aria-hidden="true" />Publicado</p> : null}
          {profile.pending ? <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-territory-warm"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{profile.pending}</p> : null}
        </div>
      </div>
      <button type="button" onClick={onToggleFavorite} aria-pressed={favorite} aria-label={favorite ? `Remover ${profile.name} dos favoritos` : `Favoritar ${profile.name}`} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-territory-sun hover:bg-[hsl(var(--territory-sun)/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:static md:order-1 md:shrink-0">
        <Star className="h-6 w-6" fill={favorite ? "currentColor" : "none"} strokeWidth={favorite ? 2 : 1.6} aria-hidden="true" />
      </button>
      <div className={cn("relative mt-4 grid gap-2 md:order-2 md:mt-0 md:flex md:shrink-0", isPersonal ? "grid-cols-2 md:w-[20rem]" : "grid-cols-1 md:max-w-[25rem]")}>
        <button type="button" onClick={onPrimary} className="min-h-10 rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-ink transition-colors hover:bg-[hsl(var(--territory-brand)/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:min-h-11 md:min-w-[8.8rem]">{profile.primaryAction}</button>
        {profile.secondaryAction ? <button type="button" onClick={onSecondary} className={cn("min-h-10 rounded-xl border border-territory-border bg-territory-raised px-4 text-sm font-medium text-territory-ink hover:border-territory-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:min-h-11", profile.category !== "personal" && "hidden md:block")}>{profile.secondaryAction}</button> : null}
        {profile.messageAction ? <button type="button" onClick={onMessages} className="relative min-h-10 rounded-xl border border-territory-border bg-territory-raised px-4 text-sm font-medium text-territory-ink hover:border-territory-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand md:min-h-11">{profile.messageAction}{profile.conversationCount ? <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-territory-sun px-1.5 text-xs font-bold text-territory-ink">{profile.conversationCount}</span> : null}</button> : null}
      </div>
    </article>
  );
}

function ConceptAccountBottomNavigation() {
  const items = [
    { label: "Início", href: "/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Home },
    { label: "Explorar", href: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Search },
    { label: "Comunidade", href: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina", icon: Users },
    { label: "Conversas", href: "/mensagens?concept-mock=1", icon: MessageCircle },
    { label: "Conta", href: "/conta?concept-mock=1", icon: UserRound, active: true },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação principal mobile">
      {items.map(({ label, href, icon: Icon, active }) => <Link key={label} to={href} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand", active && "font-semibold text-territory-brand")}><Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  );
}

function AccountConceptPreviewPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConceptProfileFilter>("all");
  const [favorites, setFavorites] = useState(() => new Set(conceptManagedProfiles.filter((profile) => profile.favorite).map((profile) => profile.id)));
  const [teamInvitesOpen, setTeamInvitesOpen] = useState(false);
  const filteredProfiles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return conceptManagedProfiles.filter((profile) => {
      const matchesFilter = filter === "all" || profile.category === filter;
      const matchesSearch = !normalizedSearch || `${profile.name} ${profile.categoryLabel} ${profile.contextLabel}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);
  const openMessages = () => navigate("/mensagens?concept-mock=1");
  const editProfile = () => navigate("/conta/editar");

  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <ConceptAccountSidebar />
      <ConceptAccountHeader />
      <main className="mx-auto w-full max-w-[68rem] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-6 lg:pb-8 lg:pt-6 xl:px-8">
        <div className="lg:hidden">
          <button type="button" onClick={() => navigate(-1)} className="flex min-h-10 items-center gap-2 text-sm font-medium text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Minha conta
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:mt-5 lg:mt-0 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div>
            <h1 className="font-heading text-[1.75rem] font-bold tracking-[-0.045em] text-territory-ink sm:text-3xl">Meus perfis</h1>
            <p className="mt-1 hidden text-base text-territory-muted lg:block">Gerencie sua presença e os espaços que você administra.</p>
          </div>
          <button type="button" onClick={() => navigate("/conta/editar")} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-territory-sun px-5 text-sm font-bold text-territory-ink shadow-territory-subtle hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand lg:w-auto">
            <Plus className="h-5 w-5" aria-hidden="true" />
            Adicionar perfil
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:mt-6">
          <label className="relative block">
            <span className="sr-only">Buscar perfil pelo nome</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Buscar perfil pelo nome" className="h-11 w-full rounded-xl border border-territory-border bg-territory-surface pl-11 pr-4 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand focus:ring-2 focus:ring-territory-brand/20" />
          </label>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Filtrar perfis">
              {(["all", "personal", "business", "professional"] as ConceptProfileFilter[]).map((option) => {
                const label = option === "all" ? "Todos" : option === "personal" ? "Pessoal" : option === "business" ? "Negócios" : "Profissionais";
                const selected = filter === option;
                return <button key={option} type="button" role="tab" aria-selected={selected} onClick={() => setFilter(option)} className={cn("min-h-10 shrink-0 whitespace-nowrap rounded-xl px-3 text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand lg:px-4 lg:text-sm", selected ? "bg-territory-brand font-semibold text-white" : "bg-territory-raised text-territory-ink hover:bg-territory-border")}>{label}</button>;
              })}
            </div>
            <button type="button" onClick={openMessages} className="flex w-fit items-center gap-2 text-left text-sm text-territory-muted hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand lg:shrink-0">
              <Star className="h-5 w-5 shrink-0 text-territory-sun" fill="currentColor" aria-hidden="true" />
              Favoritos aparecem em Conversas.
            </button>
          </div>
        </div>
        <section className="mt-4 space-y-3 lg:mt-5" aria-live="polite">
          {filteredProfiles.map((profile) => (
            <ConceptManagedProfileCard
              key={profile.id}
              profile={profile}
              favorite={favorites.has(profile.id)}
              onToggleFavorite={() => setFavorites((current) => {
                const next = new Set(current);
                if (next.has(profile.id)) next.delete(profile.id); else next.add(profile.id);
                return next;
              })}
              onPrimary={profile.category === "business" && profile.name === "Sabores da Ana" ? () => navigate("/central") : editProfile}
              onSecondary={profile.category === "personal" ? () => navigate("/u/ana-oliveira") : editProfile}
              onMessages={openMessages}
            />
          ))}
          {!filteredProfiles.length ? <div className="rounded-2xl border border-dashed border-territory-border bg-territory-surface px-4 py-8 text-center text-sm text-territory-muted">Nenhum perfil encontrado.</div> : null}
        </section>
        <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-territory-border bg-[hsl(var(--territory-info)/0.07)] p-4 text-sm text-territory-muted sm:flex-row sm:items-center sm:justify-between lg:mt-5">
          <p className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />As ações disponíveis dependem da sua permissão em cada perfil.</p>
          <button type="button" onClick={() => setTeamInvitesOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 self-start whitespace-nowrap font-semibold text-territory-ink hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand sm:self-auto">
            <Users className="h-5 w-5" aria-hidden="true" />
            Convites para equipe
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-territory-sun px-1.5 text-xs font-bold text-territory-ink">1</span>
            <ChevronRight className={cn("h-4 w-4 transition-transform", teamInvitesOpen && "rotate-90")} aria-hidden="true" />
          </button>
        </section>
        {teamInvitesOpen ? <div className="mt-2 rounded-xl border border-territory-border bg-territory-surface p-4 text-sm text-territory-muted"><strong className="font-semibold text-territory-ink">Mercado da Praça</strong> convidou você para integrar a equipe. Acesse as notificações para revisar o convite.</div> : null}
        <footer className="mt-8 hidden items-center justify-between text-xs text-territory-muted lg:flex"><span className="font-heading text-base font-bold tracking-[-0.04em] text-territory-brand">achegue-se<span className="text-territory-sun">.</span></span><span>Conceito visual · Dados demonstrativos</span></footer>
      </main>
      <ConceptAccountBottomNavigation />
    </div>
  );
}

function ContaHubLivePage() {
  const navigate = useNavigate();
  const data = useProfileHub();
  const personalProfile: RuntimeProfile | null =
    data.allProfiles.find((profile) => profile.profile_type === "personal") ??
    data.activeProfile ??
    null;
  const editorProfileId = personalProfile?.id ?? data.profile?.id ?? null;

  useEffect(() => {
    if (!data.loading && !data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.loading, data.user, navigate, data.appUrls.auth.login]);

  if (data.loading) {
    return (
      <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
        <div className="space-y-3 text-center" role="status">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-territory-brand border-t-transparent" />
          <p className="text-sm text-territory-muted">
            Organizando sua conta...
          </p>
        </div>
      </div>
    );
  }

  if (data.error && !data.profile && !data.identity) {
    return (
      <GuardCard
        icon={<CircleAlert className="mx-auto h-10 w-10 text-territory-warm" />}
        title="Não foi possível carregar a conta"
        description="Seus dados privados não foram alterados. Tente carregar novamente."
        actions={
          <>
            <Button
              className="gap-2"
              onClick={() => void data.refreshWorkspace()}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(data.appUrls.home)}
            >
              Voltar ao início
            </Button>
          </>
        }
      />
    );
  }

  if (!data.activeProfile && !data.profile) {
    return (
      <GuardCard
        icon={<Users className="mx-auto h-10 w-10 text-territory-brand" />}
        title="Sua identidade ainda não está pronta"
        description="A conta existe, mas nenhum perfil ativo foi encontrado. A criação de empresa continua disponível pela Central."
        actions={
          <Button onClick={() => navigate("/central")}>Abrir Central</Button>
        }
      />
    );
  }

  return (
    <ContaHubLayout
      personalProfile={personalProfile}
      profile={data.profile}
      allProfiles={data.allProfiles}
      isVerified={data.isVerified}
      canOpenPublicProfile={data.canOpenPublicProfile}
      handle={data.handle}
      territoryLabel={data.territoryLabel}
      userEmail={data.user?.email || ""}
      accountSnapshot={
        data.account || {
          accountState: "inactive" as const,
          isBlocked: false,
          isSuspended: false,
          verificationStatus: data.verificationStatus,
          verificationRejectionReason: data.verificationRejectionReason,
        }
      }
      identity={data.identity}
      context={data.context}
      notifications={data.notifications}
      onAvatarChange={data.handleAvatarChange}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
        <div className="space-y-4">
          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6">
            <div className="border-b border-territory-border pb-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                Essencial
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-territory-ink">
                Seus dados e controles
              </h2>
              <p className="mt-1 text-sm leading-6 text-territory-muted">
                Cada ajuste abre sua superfície específica, com a mesma
                navegação do Achegue-se.
              </p>
            </div>

            <AccountAction
              icon={UserRound}
              title="Identidade e apresentação"
              description="Nome, foto, bio e campos do perfil ativo."
              onClick={() =>
                editorProfileId &&
                navigate(data.appUrls.profile.edit(editorProfileId))
              }
            />
            <AccountAction
              icon={MapPin}
              title="Território e residência"
              description="Endereço privado e contexto territorial autorizado."
              meta={data.territoryLabel || "Pendente"}
              onClick={() => navigate(data.appUrls.profile.addresses)}
            />
            <AccountAction
              icon={Bell}
              title="Notificações"
              description="Canais, frequência e avisos da conta."
              meta={
                data.notifications.unread > 0
                  ? `${data.notifications.unread} não lidas`
                  : "Em dia"
              }
              onClick={() => navigate(data.appUrls.profile.notifications)}
            />
            <AccountAction
              icon={SlidersHorizontal}
              title="Preferências"
              description="Privacidade, vínculos e ajustes pessoais."
              onClick={() => navigate(data.appUrls.profile.preferences)}
            />
            <AccountAction
              icon={LockKeyhole}
              title="Segurança e acesso"
              description="Senha, recuperação e ações sensíveis."
              onClick={() => navigate(data.appUrls.profile.account)}
            />
          </section>

          {data.allProfiles.length > 1 ? (
            <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                Identidades
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-territory-ink">
                Perfis disponíveis
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {data.allProfiles.map((profile) => {
                  const isActive = profile.id === data.activeProfile?.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => void data.handleSwitchProfile(profile.id)}
                      className="rounded-territory border border-territory-border bg-territory-raised p-3 text-left hover:border-territory-brand/40"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="block truncate font-semibold text-territory-ink">
                        {profile.display_name || "Perfil sem nome"}
                      </span>
                      <span className="mt-1 block text-xs text-territory-muted">
                        {getProfileTypeLabel(profile)}
                        {isActive ? " · ativo" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-brand/10 text-territory-brand">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-territory-ink">
                  Público e privado
                </h2>
                <p className="mt-1 text-sm leading-6 text-territory-muted">
                  Endereço, e-mail e dados de acesso ficam privados. Você
                  controla o que aparece no perfil público.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-start border-territory-border bg-territory-surface text-territory-ink"
                onClick={() =>
                  navigate(data.appUrls.profile.settings("privacy"))
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Revisar privacidade
              </Button>
              {data.canOpenPublicProfile ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full justify-start border-territory-border bg-territory-surface text-territory-ink"
                  onClick={() =>
                    navigate(data.appUrls.profile.public(data.handle))
                  }
                >
                  <Globe2 className="mr-2 h-4 w-4" />
                  Ver perfil público
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-warm/10 text-territory-warm">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-territory-ink">
                  Empresas e vínculos
                </h2>
                <p className="mt-1 text-sm leading-6 text-territory-muted">
                  {data.businessModules.length > 0
                    ? `${data.businessModules.length} vínculo operacional disponível na Central.`
                    : "Nenhuma empresa vinculada a esta conta."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full border-territory-border bg-territory-surface text-territory-ink"
              onClick={() => navigate(data.appUrls.profile.businesses)}
            >
              Abrir Central
            </Button>
          </section>

          {data.nextActions.length > 0 ? (
            <section className="rounded-territory-highlight border border-territory-border bg-territory-raised p-4 sm:p-5">
              <h2 className="font-heading text-lg font-semibold text-territory-ink">
                Próximos cuidados
              </h2>
              <div className="mt-3 space-y-3">
                {data.nextActions.slice(0, 3).map((action) => (
                  <div
                    key={action.title}
                    className="border-t border-territory-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm font-semibold text-territory-ink">
                      {action.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-territory-muted">
                      {action.description}
                    </p>
                    <button
                      type="button"
                      onClick={action.onClick}
                      className="mt-2 text-sm font-semibold text-territory-brand hover:text-territory-brand-strong"
                    >
                      {action.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </ContaHubLayout>
  );
}

export default function ContaHubPage() {
  const [searchParams] = useSearchParams();
  const conceptMockEnabled = import.meta.env.DEV && searchParams.get("concept-mock") === "1";

  return conceptMockEnabled ? <AccountConceptPreviewPage /> : <ContaHubLivePage />;
}
