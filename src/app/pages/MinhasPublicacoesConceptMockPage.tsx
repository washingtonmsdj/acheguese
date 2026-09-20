import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileClock,
  FileText,
  ImagePlus,
  Info,
  Link2,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const POSTS_PATH = "/conta/publicacoes";
type PostsView = "published" | "drafts" | "moderation" | "other" | "empty" | "error" | "delete";

function href(view?: PostsView) {
  return `${POSTS_PATH}?concept-mock=1${view && view !== "published" ? `&view=${view}` : ""}`;
}

function getInitial(search: string): PostsView {
  const value = new URLSearchParams(search).get("view");
  return ["drafts", "moderation", "other", "empty", "error", "delete"].includes(value ?? "") ? (value as PostsView) : "published";
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link to={href()} className={cn("font-heading text-[1.55rem] font-bold tracking-[-0.06em]", light ? "text-white" : "text-territory-brand")} aria-label="Achegue-se — minhas publicações">achegue-se<span className="text-territory-sun">.</span></Link>;
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-territory-border bg-territory-surface", className)}>{children}</section>;
}

function Status({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "muted" | "blue" | "red" | "amber" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tone === "success" && "bg-emerald-100 text-emerald-800", tone === "muted" && "bg-territory-raised text-territory-muted", tone === "blue" && "bg-sky-100 text-sky-800", tone === "red" && "bg-red-100 text-red-800", tone === "amber" && "bg-amber-300 text-amber-950")}>{children}</span>;
}

function ProfileSelector({ community = false, compact = false }: { community?: boolean; compact?: boolean }) {
  return <button type="button" className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl border border-territory-border bg-territory-surface px-3 text-left", compact && "min-h-12")}>
    {community ? <MapPin className="h-5 w-5 shrink-0 text-territory-brand" /> : <img src={personalImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />}
    <span className="min-w-0 flex-1">
      <span className={cn("block truncate text-sm", compact ? "font-semibold" : "font-bold")}>{community ? "Complexo do Nordeste de Amaralina" : "Ana Oliveira"}{compact && !community ? <span className="font-normal text-territory-muted"> · Pessoal</span> : null}</span>
      {!compact ? <span className="block text-xs text-territory-muted">{community ? "Comunidade · Salvador, BA" : "Pessoal"}</span> : null}
      {compact && community ? <span className="block text-xs text-territory-muted">Comunidade · Salvador, BA</span> : null}
    </span>
    <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted" />
  </button>;
}

const postRows = [
  { icon: CircleHelp, title: "Quem indica um eletricista por aqui?", type: "Pergunta", status: "Publicada", place: "Santa Cruz", meta: "8 comentários · 12 curtidas", tone: "success" as const },
  { icon: BarChart3, title: "Qual atividade você quer no encontro?", type: "Enquete", status: "Encerrada", place: "Chapada", meta: "40 votos · 6 comentários", tone: "muted" as const },
  { icon: Megaphone, title: "Iluminação na praça", type: "Aviso", status: "Atualizado", place: "Vale das Pedrinhas", meta: "4 comentários", tone: "blue" as const },
];

function PostCard({ row, onView }: { row: (typeof postRows)[number]; onView: (view: PostsView) => void }) {
  const Icon = row.icon;
  return <Surface className="p-3"><div className="flex items-start gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-raised text-territory-brand"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-xs text-territory-muted">{row.type}</span><Status tone={row.tone}>{row.status}</Status></div><h2 className="mt-1 text-sm font-bold leading-5">{row.title}</h2><p className="mt-1 text-xs text-territory-muted">{row.place} · 17 set.</p><p className="mt-1 text-xs text-territory-muted">{row.meta}</p><button type="button" onClick={() => onView(row.type === "Aviso" ? "moderation" : "published")} className="mt-3 flex items-center gap-1 text-sm font-bold text-territory-brand">{row.type === "Enquete" ? "Ver resultado" : row.type === "Aviso" ? "Ver atualização" : "Ver publicação"}<ChevronRight className="h-4 w-4" /></button></div><button type="button" onClick={() => onView("delete")} aria-label={`Opções de ${row.title}`} className="rounded-lg p-1 text-territory-muted"><MoreHorizontal className="h-5 w-5" /></button></div></Surface>;
}

function Tabs({ active, onView }: { active: PostsView; onView: (view: PostsView) => void }) {
  return <div className="flex gap-4 overflow-x-auto border-b border-territory-border text-sm"><button type="button" onClick={() => onView("published")} className={cn("min-h-11 whitespace-nowrap font-semibold", active === "published" && "border-b-2 border-territory-brand")}>Publicadas</button><button type="button" onClick={() => onView("drafts")} className={cn("min-h-11 whitespace-nowrap font-semibold", active === "drafts" && "border-b-2 border-territory-brand")}>Rascunho <span className="ml-1 rounded-full bg-territory-raised px-2 py-1 text-xs">1</span></button><button type="button" onClick={() => onView("moderation")} className={cn("min-h-11 whitespace-nowrap font-semibold", active === "moderation" && "border-b-2 border-territory-brand")}>Moderação</button></div>;
}

function MobilePublished({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="lg:hidden"><h1 className="font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Minhas publicações</h1><div className="mt-4 grid gap-2"><ProfileSelector /><ProfileSelector community /></div><div className="mt-4"><Tabs active="published" onView={onView} /></div><div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2"><div className="flex min-h-11 items-center gap-2 rounded-xl border border-territory-border px-3 text-sm text-territory-muted"><Search className="h-4 w-4" />Buscar publicação</div><button type="button" className="flex min-h-11 items-center gap-2 rounded-xl border border-territory-border px-3 text-sm font-semibold">Tipo <ChevronDown className="h-4 w-4" /></button></div><div className="mt-3 space-y-2">{postRows.map(row => <PostCard key={row.title} row={row} onView={onView} />)}</div><button type="button" onClick={() => onView("published")} className="mt-4 min-h-12 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold">+ Nova publicação</button></div>;
}

function DesktopShell({ children, onView }: { children: ReactNode; onView: (view: PostsView) => void }) {
  const nav = [[UserRound,"Minha conta","/conta?concept-mock=1"],[UsersRound,"Meus perfis","/conta?concept-mock=1#perfis"],[FileText,"Minhas publicações",href()],[Link2,"Meus vínculos","/conta/vinculos?concept-mock=1"],[Bell,"Notificações","/notifications?concept-mock=1"]] as const;
  return <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink"><div className="flex min-h-[100dvh] w-full lg:border-x lg:border-territory-border"><aside className="hidden w-[232px] shrink-0 bg-territory-brand px-2 py-5 text-white lg:block"><div className="flex items-center gap-3 px-3"><span aria-hidden="true" className="relative grid h-8 w-8 shrink-0 place-items-center"><span className="absolute left-1 top-0 h-5 w-3 rounded-sm bg-territory-sun" /><span className="absolute bottom-0 right-1 h-5 w-3 rounded-sm bg-territory-sun" /></span><span className="text-sm font-semibold leading-4">Complexo do<br />Nordeste de Amaralina</span></div><nav className="mt-8 space-y-1" aria-label="Navegação da conta">{nav.map(([Icon,label,target])=><Link key={label} to={target} className={cn("relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/90 hover:bg-white/10",label === "Minhas publicações" && "bg-white/15 font-semibold") }><Icon className={cn("h-[18px] w-[18px]",label === "Minhas publicações" && "text-territory-sun")} />{label}</Link>)}</nav></aside><div className="min-w-0 flex-1"><header className="hidden h-14 items-center justify-end border-b border-territory-border bg-territory-surface px-7 lg:flex"><div className="flex items-center gap-3 text-sm font-semibold"><Bell className="h-5 w-5 text-territory-muted" /><img src={personalImage} alt="" className="h-8 w-8 rounded-full object-cover" />Ana Oliveira<ChevronDown className="h-4 w-4" /></div></header><header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-start border-b border-territory-border bg-territory-surface/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden"><button type="button" onClick={() => onView("published")} className="flex h-11 items-center gap-1 rounded-full px-2 text-sm"><ArrowLeft className="h-5 w-5" />Conta</button></header><main className="mx-0 w-full max-w-none px-4 pb-8 pt-5 sm:px-6 lg:px-6 lg:pt-8">{children}</main></div></div></div>;
}

function DesktopPublished({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="hidden lg:block"><div className="flex items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-bold tracking-[-0.045em]">Minhas publicações</h1><p className="mt-1 text-base text-territory-muted">Acompanhe o conteúdo de cada perfil.</p></div><button type="button" onClick={() => onView("published")} className="min-h-11 rounded-xl bg-territory-sun px-4 text-sm font-bold">+ Nova publicação</button></div><div className="mt-5 max-w-[21rem]"><ProfileSelector compact /></div><div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]"><div className="min-w-0"><Tabs active="published" onView={onView} /><div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2"><div className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-territory-border px-3 text-sm text-territory-muted"><Search className="h-4 w-4 shrink-0" />Buscar publicação</div>{["Tipo","Bairro","Mais recentes"].map(label => <button key={label} type="button" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-territory-border px-3 text-sm font-semibold">{label}<ChevronDown className="h-4 w-4 shrink-0" /></button>)}</div><Surface className="mt-3 overflow-hidden"><div className="hidden grid-cols-[minmax(0,1.4fr)_6.5rem_8.5rem_9rem_5.5rem] gap-3 border-b border-territory-border px-4 py-3 text-xs font-semibold text-territory-muted sm:grid"><span>Publicação</span><span>Situação</span><span>Comunidade</span><span>Interações</span><span>Ações</span></div>{postRows.map(row=>{const Icon=row.icon;return <div key={row.title} className="grid min-w-0 gap-2 border-b border-territory-border px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_6.5rem_8.5rem_9rem_5.5rem] sm:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-raised text-territory-brand"><Icon className="h-5 w-5" /></span><span className="min-w-0"><b className="block truncate text-sm">{row.title}</b><span className="text-xs text-territory-muted">{row.type}</span></span></div><span><Status tone={row.tone}>{row.status}</Status></span><span className="truncate text-sm text-territory-muted">{row.place}</span><span className="truncate text-xs text-territory-muted">{row.meta}</span><button type="button" onClick={()=>onView(row.type === "Aviso" ? "moderation" : "published")} className="min-h-9 whitespace-nowrap rounded-lg border border-territory-border px-2 text-xs font-semibold">{row.type === "Enquete" ? "Ver resultado" : "Abrir"}</button></div>})}<button type="button" className="flex min-h-10 w-full items-center justify-center gap-1 bg-territory-raised text-sm font-semibold">Carregar mais</button></Surface></div><OtherContent /></div><PageStates onView={onView} /></div>;
}

function OtherContent() {
  return <aside className="space-y-4"><Surface className="p-4"><h2 className="font-heading text-base font-bold">Gerenciar outros conteúdos</h2><div className="mt-3 divide-y divide-territory-border">{[[Tag,"Classificados"],[Wrench,"Serviços"],[UsersRound,"Vagas"],[CalendarDays,"Eventos"]].map(([Icon,label])=><button type="button" key={String(label)} className="flex min-h-12 w-full items-center gap-3 text-left text-sm"><Icon className="h-5 w-5 text-territory-brand" /><span className="flex-1">{String(label)}</span><ChevronRight className="h-4 w-4 text-territory-muted" /></button>)}</div><p className="mt-3 text-xs text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Abra o módulo responsável.</p></Surface><Surface className="p-4"><h2 className="font-heading text-base font-bold">Rascunho neste dispositivo</h2><button type="button" className="mt-3 flex min-h-12 w-full items-center gap-3 text-left text-sm"><FileClock className="h-5 w-5 text-territory-brand" /><span className="flex-1">Continuar pergunta</span><ChevronRight className="h-4 w-4" /></button><p className="mt-2 text-xs leading-4 text-territory-muted">Este rascunho fica apenas neste navegador ou dispositivo.</p></Surface></aside>;
}

function PageStates({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="mt-6 grid gap-3 lg:col-span-2 lg:grid-cols-3"><Surface className="p-4 text-center"><Pencil className="mx-auto h-7 w-7 text-territory-brand" /><h2 className="mt-3 font-heading text-base font-bold">Você ainda não publicou</h2><p className="mt-1 text-sm text-territory-muted">Compartilhe uma pergunta ou uma ideia com sua comunidade.</p><button type="button" onClick={() => onView("published")} className="mt-4 min-h-10 rounded-xl bg-territory-sun px-4 text-sm font-bold">Criar publicação</button></Surface><Surface className="p-4 text-center"><RefreshCw className="mx-auto h-7 w-7 text-territory-brand" /><h2 className="mt-3 font-heading text-base font-bold">Não foi possível carregar</h2><p className="mt-1 text-sm text-territory-muted">Suas publicações não puderam ser consultadas.</p><button type="button" onClick={() => onView("published")} className="mt-4 min-h-10 rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Tentar novamente</button></Surface><Surface className="p-4 text-center"><Trash2 className="mx-auto h-7 w-7 text-red-700" /><h2 className="mt-3 font-heading text-base font-bold">Excluir esta publicação?</h2><p className="mt-1 text-sm text-territory-muted">Confira as consequências antes de confirmar.</p><button type="button" onClick={() => onView("delete")} className="mt-4 min-h-10 rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-700">Ver confirmação</button></Surface></div>;
}

function DraftView({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="mx-auto max-w-[38rem]"><h1 className="font-heading text-[1.75rem] font-bold">Minhas publicações</h1><Surface className="mt-4 p-4"><ProfileSelector /><div className="mt-4 flex items-center gap-2 border-b border-territory-border pb-3 text-sm"><FileClock className="h-5 w-5 text-territory-brand" />Salvo neste dispositivo</div><p className="mt-4 text-xs text-territory-muted">Pergunta</p><h2 className="mt-1 font-heading text-lg font-bold">Alguém conhece uma oficina de bicicletas?</h2><p className="mt-1 text-sm text-territory-muted">Última atualização · hoje, 10h20</p><button type="button" className="mt-5 min-h-12 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Continuar rascunho</button><button type="button" onClick={() => onView("published")} className="mt-2 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand"><Trash2 className="mr-1 inline h-4 w-4" />Descartar</button></Surface><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm"><ImagePlus className="mr-2 inline h-5 w-5" />Imagens não são guardadas no rascunho. Ao continuar, adicione-as novamente.</div><p className="mt-3 rounded-2xl bg-territory-raised p-3 text-sm text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Um rascunho por perfil neste dispositivo.</p></div>;
}

function ModerationView({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="mx-auto max-w-[38rem]"><h1 className="font-heading text-[1.75rem] font-bold">Situação da publicação</h1><Surface className="mt-4 p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-territory-border"><FileText className="h-5 w-5 text-territory-brand" /></span><div><h2 className="font-bold">Divulgação de serviço</h2><p className="flex items-center gap-1 text-sm text-territory-muted"><MapPin className="h-4 w-4 text-territory-brand" />Santa Cruz</p><Status tone="red">Ocultada</Status></div></div><p className="mt-4 text-sm leading-5">Esta publicação não está visível para a comunidade.</p><div className="mt-3 rounded-xl border border-territory-border p-3"><p className="text-sm font-bold">Motivo</p><p className="mt-1 text-sm text-territory-muted">Divulgação repetida em várias publicações.</p></div><div className="mt-3 rounded-xl border border-territory-border p-3"><p className="text-sm font-bold">Orientação</p><p className="mt-1 text-sm text-territory-muted">Use a página de Serviços para divulgar sua atividade.</p></div><button type="button" onClick={() => onView("moderation")} className="mt-4 min-h-11 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Ver decisão</button><Link to="/servicos/cadastrar" className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-territory-brand text-sm font-semibold text-territory-brand">Ir para Serviços</Link></Surface><Surface className="mt-4 border-amber-300 p-4"><p className="text-xs text-territory-muted">Recurso proposto</p><p className="mt-2 flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-5 w-5" />Solicitar revisão <Status tone="amber">Quando habilitado</Status></p><p className="mt-1 text-sm text-territory-muted">A ação depende de política e autorização próprias.</p></Surface></div>;
}

function OtherView() {
  return <div className="mx-auto max-w-[38rem]"><h1 className="font-heading text-[1.75rem] font-bold">Gerenciar meu conteúdo</h1><ProfileSelector /><p className="mt-4 text-sm text-territory-muted">Cada conteúdo é gerenciado na sua área.</p><div className="mt-4 space-y-2">{[[Tag,"Classificados","Ver meus anúncios"],[Wrench,"Serviços","Gerenciar serviços"],[UsersRound,"Vagas","Gerenciar vagas"],[CalendarDays,"Eventos","Gerenciar eventos"]].map(([Icon,label,caption])=><button type="button" key={String(label)} className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-territory-border bg-territory-surface px-4 text-left"><Icon className="h-6 w-6 text-territory-brand" /><span className="flex-1"><b className="block text-sm">{String(label)}</b><span className="text-xs text-territory-muted">{String(caption)}</span></span><ChevronRight className="h-4 w-4" /></button>)}</div><p className="mt-4 rounded-2xl bg-territory-raised p-3 text-sm text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Compartilhamentos na comunidade apontam para o conteúdo original.</p></div>;
}

function EmptyOrError({ error, onView }: { error: boolean; onView: (view: PostsView) => void }) {
  return <div className="mx-auto max-w-[38rem] py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-territory-raised text-territory-brand">{error ? <AlertCircle className="h-7 w-7" /> : <Pencil className="h-7 w-7" />}</span><h1 className="mt-4 font-heading text-xl font-bold">{error ? "Não foi possível carregar" : "Você ainda não publicou"}</h1><p className="mt-2 text-sm leading-5 text-territory-muted">{error ? "Suas publicações não puderam ser consultadas." : "Compartilhe uma pergunta ou uma ideia com sua comunidade."}</p><button type="button" onClick={() => onView("published")} className="mt-5 min-h-11 rounded-xl bg-territory-brand px-5 text-sm font-bold text-white">{error ? "Tentar novamente" : "Criar publicação"}</button></div>;
}

function DeleteView({ onView }: { onView: (view: PostsView) => void }) {
  return <div className="mx-auto max-w-[34rem] py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-700"><Trash2 className="h-7 w-7" /></span><h1 className="mt-4 font-heading text-xl font-bold">Excluir esta publicação?</h1><p className="mt-2 text-sm leading-5 text-territory-muted">A publicação será removida do seu conteúdo. Confirme somente depois de verificar as consequências reais.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => onView("published")} className="min-h-11 rounded-xl border border-territory-brand px-4 text-sm font-semibold">Cancelar</button><button type="button" onClick={() => onView("published")} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white">Excluir</button></div></div>;
}

export default function MinhasPublicacoesConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<PostsView>(() => getInitial(location.search));
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const onView = (next: PostsView) => { setView(next); navigate(href(next), { replace: true }); };
  const body = view === "published" ? <><MobilePublished onView={onView} /><DesktopPublished onView={onView} /></> : view === "drafts" ? <DraftView onView={onView} /> : view === "moderation" ? <ModerationView onView={onView} /> : view === "other" ? <OtherView /> : view === "empty" ? <EmptyOrError error={false} onView={onView} /> : view === "error" ? <EmptyOrError error onView={onView} /> : <DeleteView onView={onView} />;
  return <><Helmet><title>Minhas publicações | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet><DesktopShell onView={onView}>{body}</DesktopShell></>;
}
