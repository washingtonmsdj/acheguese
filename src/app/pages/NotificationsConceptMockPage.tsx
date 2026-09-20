import { useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Eye,
  Filter,
  Home,
  MoreHorizontal,
  Search,
  Settings,
  Settings2,
  ShoppingBag,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import { cn } from "@/shared/utils/cn";

const QUERY = "?concept-mock=1";

type MockView = "list" | "filter" | "detail" | "options" | "empty" | "error" | "unavailable" | "mark-all";

const notifications = [
  {
    id: "order-1042",
    profile: "Sabores da Ana",
    type: "Negócio",
    title: "Pedido #1042 atualizado",
    description: "Confira o andamento do pedido.",
    time: "há 5 min",
    clock: "10:24",
    action: "Ver pedido",
    image: foodImage,
    icon: ShoppingBag,
  },
  {
    id: "community-reply",
    profile: "Ana Oliveira",
    type: "Pessoal",
    title: "Mariana respondeu ao seu comentário",
    description: "Feira de empreendedores em Santa Cruz.",
    time: "há 20 min",
    clock: "09:18",
    action: "Ver resposta",
    image: personalImage,
    icon: UserRound,
  },
  {
    id: "service-agenda",
    profile: "Ana Serviços",
    type: "Profissional",
    title: "Novo agendamento",
    description: "Confira os detalhes da solicitação.",
    time: "há 1 h",
    clock: "08:47",
    action: "Ver agendamento",
    image: undefined,
    icon: UsersRound,
  },
] as const;

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to={`/${QUERY}`} className={cn("whitespace-nowrap font-heading text-[1.55rem] font-bold tracking-[-0.06em]", light ? "text-[1.35rem] text-white" : "text-territory-brand")} aria-label="Achegue-se — início">
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function getInitialView(search: string): MockView {
  const state = new URLSearchParams(search).get("state");
  return ["filter", "detail", "options", "empty", "error", "unavailable", "mark-all"].includes(state ?? "") ? state as MockView : "list";
}

function MockShell({ view, children, onView }: { view: MockView; children: ReactNode; onView: (next: MockView) => void }) {
  const navItems = [
    { label: "Início", icon: Home, target: "/ba/salvador/complexo-do-nordeste-de-amaralina" },
    { label: "Explorar", icon: Search, target: "/busca/ba/salvador/complexo-do-nordeste-de-amaralina" },
    { label: "Comunidade", icon: UsersRound, target: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina" },
    { label: "Conversas", icon: Bell, target: `/mensagens${QUERY}` },
    { label: "Conta", icon: UserRound, target: `/conta${QUERY}` },
  ];
  const current = view === "detail" || view === "options" || view === "unavailable" ? "Notificações" : "Notificações";
  return (
    <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] lg:border-x lg:border-territory-border">
        <aside className="hidden w-[160px] shrink-0 bg-territory-brand px-2.5 py-5 text-white lg:flex lg:flex-col">
          <Brand light />
          <nav aria-label="Navegação principal" className="mt-8 space-y-1">
            {navItems.map(({ label, icon: Icon, target }) => <Link key={label} to={target} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-[0.76rem] font-medium text-white/90 hover:bg-white/10", label === "Conta" && "bg-white/15 font-semibold")}><Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /><span>{label}</span></Link>)}
          </nav>
          <button type="button" onClick={() => undefined} className="mt-auto flex min-h-11 items-center gap-3 border-t border-white/15 px-2.5 pt-4 text-[0.76rem] font-medium text-white/90 hover:text-white"><CircleHelp className="h-[18px] w-[18px]" aria-hidden="true" />Ajuda</button>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="hidden h-16 items-center justify-between border-b border-territory-border bg-territory-surface px-6 lg:flex xl:px-8">
            <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-territory-brand" aria-hidden="true" /><span className="text-sm font-semibold">{current}</span></div>
            <div className="flex items-center gap-2 text-sm font-semibold"><span>Ana Oliveira</span><img src={personalImage} alt="" className="h-8 w-8 rounded-full object-cover" /></div>
          </header>
          <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden">
            <button type="button" onClick={() => onView("list")} aria-label="Voltar para notificações" className="flex h-11 w-11 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
            <Brand />
            <Link to={`/conta/notificacoes${QUERY}`} aria-label="Preferências de notificações" className="flex h-11 w-11 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised"><Settings className="h-5 w-5" aria-hidden="true" /></Link>
          </header>
          <main className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-7 lg:pt-7 xl:px-8">{children}</main>
        </div>
      </div>
      <nav aria-label="Navegação principal mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navItems.map(({ label, icon: Icon, target }) => { const active = label === "Conta"; return <Link key={label} to={target} aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium text-territory-muted", active && "font-semibold text-territory-brand")}><Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" /><span>{label}</span></Link>; })}
      </nav>
    </div>
  );
}

function PageHeading({ onFilter, onMarkAll }: { onFilter: () => void; onMarkAll: () => void }) {
  return <><div className="flex items-start justify-between gap-4"><div><h1 className="font-heading text-[1.7rem] font-bold leading-tight tracking-[-0.045em] text-territory-ink sm:text-3xl">Notificações</h1><p className="mt-1 text-sm leading-5 text-territory-muted">Visualize todas as suas notificações.</p></div><Link to={`/conta/notificacoes${QUERY}`} aria-label="Configurar notificações" className="hidden h-10 w-10 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised lg:flex"><Settings className="h-5 w-5" aria-hidden="true" /></Link></div><div className="mt-4 flex items-center gap-2"><button type="button" onClick={() => undefined} className="flex min-h-10 w-full items-center justify-between rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink lg:w-36"><span>Todos os perfis</span><ChevronDown className="h-4 w-4 text-territory-muted" aria-hidden="true" /></button></div><div className="mt-3 flex items-center gap-2"><button type="button" className="min-h-10 flex-1 rounded-xl bg-territory-brand px-3 text-sm font-semibold text-white lg:flex-none lg:w-20">Todas</button><button type="button" onClick={() => undefined} className="min-h-10 flex-1 rounded-xl bg-territory-raised px-3 text-sm font-semibold text-territory-ink lg:flex-none lg:w-24">Não lidas</button><button type="button" onClick={onFilter} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-territory-brand px-3 text-sm font-semibold text-territory-ink lg:ml-auto"><Filter className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Assuntos</span></button></div><button type="button" onClick={onMarkAll} className="mt-3 ml-auto block text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">Marcar todas como lidas</button></>;
}

function NotificationCard({ notification, onOpen, onOptions }: { notification: typeof notifications[number]; onOpen: () => void; onOptions: () => void }) {
  const Icon = notification.icon;
  return <article className="rounded-2xl border border-territory-border bg-territory-surface p-3 shadow-territory-subtle sm:p-4"><div className="flex items-start gap-2"><span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-territory-sun" aria-label="Não lida" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-territory-brand text-white">{notification.image ? <img src={notification.image} alt="" className="h-full w-full object-cover" /> : <Icon className="h-4 w-4" aria-hidden="true" />}</div><p className="min-w-0 truncate text-sm font-semibold text-territory-ink">{notification.profile} <span className="font-normal text-territory-muted">· {notification.type}</span></p></div><button type="button" onClick={onOpen} className="mt-2 block text-left"><h2 className="text-sm font-bold leading-5 text-territory-ink">{notification.title}</h2><p className="mt-0.5 text-sm leading-5 text-territory-muted">{notification.description}</p></button><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-territory-muted">{notification.time}</span><button type="button" onClick={onOpen} className="text-sm font-semibold text-territory-brand">{notification.action}<ChevronRight className="ml-1 inline h-4 w-4" aria-hidden="true" /></button></div></div><button type="button" onClick={onOptions} aria-label={`Opções de ${notification.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-territory-muted hover:bg-territory-raised"><MoreHorizontal className="h-5 w-5" aria-hidden="true" /></button></div></article>;
}

function DetailPanel({ onView }: { onView: (next: MockView) => void }) {
  return <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5"><div className="flex items-center gap-2"><img src={foodImage} alt="" className="h-9 w-9 rounded-full object-cover" /><p className="text-sm font-semibold text-territory-ink">Sabores da Ana <span className="font-normal text-territory-muted">· Negócio</span></p></div><h2 className="mt-5 font-heading text-2xl font-bold tracking-[-0.04em] text-territory-ink">Pedido #1042 atualizado</h2><p className="mt-1 text-sm leading-5 text-territory-ink">O pedido teve uma atualização. Abra os detalhes para consultar a situação atual.</p><p className="mt-2 text-sm text-territory-muted">Hoje, 12:35</p><div className="mt-5 rounded-2xl bg-territory-raised p-3"><div className="flex items-center gap-3"><img src={foodImage} alt="" className="h-10 w-10 rounded-xl object-cover" /><p className="text-sm text-territory-muted">Você acessará este pedido como<br /><strong className="text-territory-ink">Sabores da Ana</strong></p></div><button type="button" onClick={() => undefined} className="mt-3 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">Ver pedido</button><p className="mt-2 flex items-center gap-2 text-xs text-territory-muted"><CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />A situação atual será consultada ao abrir.</p></div><div className="mt-5 divide-y divide-territory-border rounded-2xl border border-territory-border"><button type="button" onClick={() => undefined} className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm font-semibold"><Eye className="h-5 w-5" aria-hidden="true" />Marcar como lida<ChevronRight className="ml-auto h-4 w-4 text-territory-muted" aria-hidden="true" /></button><button type="button" onClick={() => onView("options")} className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm font-semibold"><Trash2 className="h-5 w-5" aria-hidden="true" />Remover notificação<ChevronRight className="ml-auto h-4 w-4 text-territory-muted" aria-hidden="true" /></button></div><p className="mt-3 text-xs leading-4 text-territory-muted">Remover este aviso não apaga o pedido.</p><div className="mt-5 border-t border-territory-border pt-4"><Link to={`/conta/notificacoes${QUERY}`} className="flex min-h-11 items-center gap-3 text-sm font-semibold text-territory-brand"><Settings2 className="h-5 w-5" aria-hidden="true" />Preferências de notificações<ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" /></Link></div></section>;
}

function EmptyState({ kind, onView }: { kind: "empty" | "error" | "unavailable"; onView: (next: MockView) => void }) {
  const content = kind === "empty" ? { title: "Nenhuma notificação não lida", description: "Você pode consultar os avisos anteriores na aba Todas.", primary: "Ver todas", icon: CheckCircle2 } : kind === "error" ? { title: "Não foi possível carregar", description: "Verifique sua conexão e tente novamente.", primary: "Tentar novamente", icon: Bell } : { title: "Esta publicação não está disponível", description: "Ela pode ter sido removida ou você pode não ter mais acesso.", primary: "Voltar às notificações", icon: FileUnavailable };
  const Icon = content.icon;
  return <section className="flex min-h-[30rem] flex-col items-center justify-center rounded-2xl border border-territory-border bg-territory-surface px-6 py-10 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-territory-raised text-territory-brand"><Icon className="h-10 w-10" aria-hidden="true" /></span><h2 className="mt-5 max-w-sm font-heading text-xl font-bold tracking-[-0.03em] text-territory-ink">{content.title}</h2><p className="mt-2 max-w-sm text-sm leading-5 text-territory-muted">{content.description}</p><button type="button" onClick={() => onView(kind === "error" ? "list" : "list")} className="mt-5 min-h-11 w-full max-w-xs rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">{content.primary}</button>{kind === "empty" ? <Link to={`/conta/notificacoes${QUERY}`} className="mt-4 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">Preferências de notificações</Link> : null}{kind === "error" ? <button type="button" onClick={() => undefined} className="mt-4 text-sm font-semibold text-territory-brand underline-offset-4 hover:underline">Preciso de ajuda</button> : null}{kind === "unavailable" ? <button type="button" onClick={() => undefined} className="mt-3 min-h-11 w-full max-w-xs rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-ink">Explorar a comunidade</button> : null}</section>;
}

function FileUnavailable({ className = "" }: { className?: string }) { return <Trash2 className={className} aria-hidden="true" />; }

function FilterPanel({ onClose, onApply }: { onClose: () => void; onApply: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/40 lg:flex lg:items-stretch lg:justify-end"><section role="dialog" aria-modal="true" aria-labelledby="filter-title" className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-territory-surface p-5 shadow-2xl lg:static lg:h-full lg:w-[28rem] lg:rounded-none lg:p-7"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-territory-border lg:hidden" /><div className="flex items-center justify-between"><h2 id="filter-title" className="font-heading text-xl font-bold text-territory-ink">Filtrar notificações</h2><button type="button" onClick={onClose} aria-label="Fechar filtros" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-territory-raised"><X className="h-5 w-5" /></button></div><label className="mt-5 block text-sm font-semibold text-territory-ink" htmlFor="profile-filter">Perfil relacionado</label><div className="relative mt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" /><input id="profile-filter" placeholder="Buscar meus perfis" className="h-11 w-full rounded-xl border border-territory-border bg-territory-surface pl-9 pr-3 text-sm focus:border-territory-brand focus:outline-none focus:ring-2 focus:ring-territory-brand/15" /></div><div className="mt-4 space-y-3">{["Todos os perfis", "Ana Oliveira", "Sabores da Ana", "Ana Serviços"].map((label, index) => <button type="button" key={label} className="flex w-full items-center gap-3 text-left text-sm"><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", index === 0 ? "border-territory-brand" : "border-territory-muted")}>{index === 0 ? <span className="h-2.5 w-2.5 rounded-full bg-territory-brand" /> : null}</span><span><span className="block font-semibold text-territory-ink">{label}</span>{index > 0 ? <span className="block text-xs text-territory-muted">{index === 1 ? "Pessoal" : index === 2 ? "Negócio" : "Profissional"}</span> : null}</span></button>)}</div><h3 className="mt-6 text-sm font-semibold text-territory-ink">Assunto</h3><div className="mt-2 flex flex-wrap gap-2">{["Todos", "Pedidos e serviços", "Comunidade", "Mobilidade", "Conta e sistema", "Ofertas"].map((label, index) => <button type="button" key={label} className={cn("min-h-9 rounded-full border px-3 text-xs font-semibold", index === 0 ? "border-territory-brand bg-territory-sun/25 text-territory-ink" : "border-territory-border text-territory-ink")}>{label}</button>)}</div><button type="button" onClick={onApply} className="mt-6 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink hover:brightness-95">Aplicar filtros</button><button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-xl border border-territory-border px-4 text-sm font-semibold text-territory-ink">Limpar filtros</button><p className="mt-4 flex items-start gap-2 text-xs leading-4 text-territory-muted"><CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />Os filtros não alteram suas preferências de recebimento.</p></section></div>;
}

function OptionsPanel({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/40 lg:flex lg:items-center lg:justify-center lg:p-6"><section role="dialog" aria-modal="true" aria-labelledby="options-title" className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-territory-surface p-5 shadow-2xl lg:static lg:w-full lg:max-w-md lg:rounded-2xl lg:p-6"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-territory-border lg:hidden" /><div className="flex items-center justify-between"><h2 id="options-title" className="font-heading text-xl font-bold text-territory-ink">Opções da notificação</h2><button type="button" onClick={onClose} aria-label="Fechar opções" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-territory-raised"><X className="h-5 w-5" /></button></div><div className="mt-5 divide-y divide-territory-border rounded-2xl border border-territory-border"><button type="button" onClick={onClose} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-semibold"><Eye className="h-5 w-5" aria-hidden="true" />Marcar como lida<ChevronRight className="ml-auto h-4 w-4 text-territory-muted" aria-hidden="true" /></button><button type="button" onClick={onClose} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-semibold"><Trash2 className="h-5 w-5" aria-hidden="true" />Remover notificação<ChevronRight className="ml-auto h-4 w-4 text-territory-muted" aria-hidden="true" /></button></div><p className="mt-3 text-xs leading-4 text-territory-muted">Esta ação remove apenas o aviso da sua central.</p><div className="mt-5 border-t border-territory-border pt-4"><Link to={`/conta/notificacoes${QUERY}`} onClick={onClose} className="flex min-h-11 items-center gap-3 text-sm font-semibold text-territory-brand"><Settings2 className="h-5 w-5" aria-hidden="true" />Configurar recebimento<ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" /></Link></div></section></div>;
}

function MarkAllDialog({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="mark-title" className="w-full max-w-md rounded-2xl bg-territory-surface p-5 shadow-2xl sm:p-6"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-territory-sun text-territory-ink"><Check className="h-7 w-7" aria-hidden="true" /></div><h2 id="mark-title" className="mt-4 text-center font-heading text-xl font-bold text-territory-ink">Marcar todas como lidas?</h2><p className="mt-2 text-center text-sm leading-5 text-territory-muted">Esta ação inclui todas as notificações da sua conta, mesmo as que estão fora dos filtros atuais.</p><div className="mt-4 rounded-xl bg-territory-raised p-3 text-sm text-territory-muted">Pedidos, mensagens e convites não serão concluídos.</div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-territory-border px-4 text-sm font-semibold text-territory-ink">Cancelar</button><button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl bg-territory-sun px-4 text-sm font-bold text-territory-ink">Marcar todas</button></div></section></div>;
}

export default function NotificationsConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setViewState] = useState<MockView>(() => getInitialView(location.search));
  const setView = (next: MockView) => { setViewState(next); const params = new URLSearchParams(QUERY.slice(1)); if (next !== "list") params.set("state", next); navigate(`/notificacoes?${params.toString()}`, { replace: true }); };
  const isList = view === "list" || view === "filter" || view === "mark-all" || view === "options";
  return <><Helmet><title>Notificações | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet><MockShell view={view} onView={setView}><PageHeading onFilter={() => setView("filter")} onMarkAll={() => setView("mark-all")} /><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.95fr)]">{isList ? <section><h2 className="mb-2 text-sm font-bold text-territory-ink">Hoje</h2><div className="space-y-3">{notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} onOpen={() => setView("detail")} onOptions={() => setView("options")} />)}</div><button type="button" onClick={() => undefined} className="mt-4 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Carregar anteriores</button></section> : <section className="lg:col-span-2">{view === "detail" ? <DetailPanel onView={setView} /> : <EmptyState kind={view as "empty" | "error" | "unavailable"} onView={setView} />}</section>}{isList ? <div className="hidden lg:block"><DetailPanel onView={setView} /></div> : null}</div>{view === "filter" ? <FilterPanel onClose={() => setView("list")} onApply={() => setView("list")} /> : null}{view === "options" ? <OptionsPanel onClose={() => setView("list")} /> : null}{view === "mark-all" ? <MarkAllDialog onClose={() => setView("list")} /> : null}</MockShell></>;
}
