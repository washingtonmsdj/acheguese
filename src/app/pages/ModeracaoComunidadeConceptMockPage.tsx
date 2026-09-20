import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Flag,
  Home,
  Info,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import { cn } from "@/shared/utils/cn";

const MODERATION_PATH = "/moderacao";
type ModerationView = "queue" | "analysis" | "confirm" | "done" | "permission" | "conflict" | "appeal";

function viewHref(view: ModerationView) {
  return `${MODERATION_PATH}?concept-mock=1&view=${view}`;
}

function initialView(search: string): ModerationView {
  const value = new URLSearchParams(search).get("view");
  return ["analysis", "confirm", "done", "permission", "conflict", "appeal"].includes(value ?? "") ? (value as ModerationView) : "queue";
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link to={viewHref("queue")} className={cn("font-heading text-[1.55rem] font-bold tracking-[-0.06em]", light ? "text-white" : "text-territory-brand")} aria-label="Achegue-se — central de moderação">achegue-se<span className="text-territory-sun">.</span></Link>;
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-territory-border bg-territory-surface", className)}>{children}</section>;
}

function StatusPill({ children, tone = "pending" }: { children: ReactNode; tone?: "pending" | "success" | "blue" | "danger" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tone === "pending" && "bg-territory-sun/65 text-territory-ink", tone === "success" && "bg-emerald-100 text-emerald-800", tone === "blue" && "bg-sky-100 text-sky-800", tone === "danger" && "bg-red-100 text-red-800")}>{children}</span>;
}

function Shell({ view, children, onView }: { view: ModerationView; children: ReactNode; onView: (view: ModerationView) => void }) {
  const items = [[Home, "Visão geral"], [Flag, "Denúncias"], [CalendarDays, "Histórico"], [FileText, "Regras"]] as const;
  return <div className="min-h-[100dvh] bg-territory-canvas text-territory-ink"><div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] lg:border-x lg:border-territory-border"><aside className="hidden w-[196px] shrink-0 bg-territory-brand px-3 py-5 text-white lg:block"><Brand light /><nav className="mt-8 space-y-1" aria-label="Navegação da moderação">{items.map(([Icon,label], index)=><button type="button" key={label} onClick={() => onView(index===1?"queue":index===2?"done":"queue")} className={cn("relative flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-white/90 hover:bg-white/10", label === "Denúncias" && "bg-white/15 font-semibold text-white")}><Icon className={cn("h-[18px] w-[18px]",label === "Denúncias" && "text-territory-sun")} />{label}</button>)}</nav><div className="mt-auto pt-8 text-xs leading-4 text-white/65">Acesso restrito à equipe autorizada.</div></aside><div className="min-w-0 flex-1"><header className="hidden h-16 items-center justify-between border-b border-territory-border bg-territory-surface px-6 lg:flex"><span className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-5 w-5 text-territory-brand" />Complexo do Nordeste de Amaralina</span><div className="flex items-center gap-3 text-sm font-semibold"><Bell className="h-5 w-5 text-territory-muted" /><span className="grid h-8 w-8 place-items-center rounded-full bg-territory-brand text-xs text-white">C</span>Carla · Moderadora<ChevronDown className="h-4 w-4" /></div></header><header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden"><button type="button" onClick={() => onView(view === "queue" ? "queue" : "queue")} aria-label="Abrir menu" className="flex h-11 w-11 items-center justify-center rounded-full"><Menu className="h-5 w-5" /></button><Brand /><span className="grid h-8 w-8 place-items-center rounded-full bg-territory-brand text-xs text-white">C</span></header><main className="mx-auto w-full max-w-[1230px] px-4 pb-8 pt-5 sm:px-6 lg:px-7 lg:pt-8">{children}</main></div></div></div>;
}

function Tabs({ active, onView }: { active: "queue" | "analysis" | "done"; onView: (view: ModerationView) => void }) {
  return <div className="flex items-center gap-5 border-b border-territory-border text-sm"><button type="button" onClick={() => onView("queue")} className={cn("min-h-11 font-semibold", active === "queue" && "border-b-2 border-territory-sun")}>Pendentes <span className="ml-1 rounded-full bg-territory-sun px-2 py-1 text-xs">12</span></button><button type="button" onClick={() => onView("analysis")} className={cn("min-h-11 font-semibold text-territory-muted", active === "analysis" && "border-b-2 border-territory-sun text-territory-ink")}>Em análise <span className="ml-1 rounded-full bg-territory-raised px-2 py-1 text-xs">3</span></button><button type="button" onClick={() => onView("done")} className={cn("min-h-11 font-semibold text-territory-muted", active === "done" && "border-b-2 border-territory-sun text-territory-ink")}>Histórico</button></div>;
}

function Filters() {
  return <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_minmax(10rem,.8fr)_minmax(10rem,.8fr)_minmax(9rem,.6fr)]"><div className="flex h-11 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-muted"><Search className="h-4 w-4" />Buscar denúncia</div>{["Publicações e comentários","Todos os motivos","Período"].map(label => <button key={label} type="button" className="flex h-11 items-center justify-between rounded-xl border border-territory-border bg-territory-surface px-3 text-left text-sm text-territory-muted">{label}<ChevronDown className="h-4 w-4" /></button>)}</div>;
}

const queueItems = [["DEN-1042", "Publicação", "Spam ou propaganda abusiva", "Santa Cruz", "3 denúncias"], ["DEN-1043", "Comentário", "Assédio ou ataque pessoal", "Chapada", "1 denúncia"], ["DEN-1044", "Publicação", "Link malicioso ou fraude", "Nordeste de Amaralina", "2 denúncias"] as const];

function QueueList({ onView }: { onView: (view: ModerationView) => void }) {
  return <div className="space-y-2">{queueItems.map(([id,type,reason,place,count], index)=><button key={id} type="button" onClick={() => onView("analysis")} className={cn("flex w-full items-center gap-3 rounded-xl border bg-territory-surface p-3 text-left hover:border-territory-brand", index===0 ? "border-amber-400" : "border-territory-border")}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-territory-raised text-territory-brand">{type === "Comentário" ? <MessageIcon /> : <FileText className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{id} <span className="font-normal text-territory-muted">· {type}</span></span><span className="block text-xs text-territory-ink">{reason}</span><span className="mt-1 block text-xs text-territory-muted"><span className="mr-1">⌖</span>{place} · {count}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-territory-muted" /><span className="hidden min-h-9 rounded-lg bg-territory-sun px-3 py-2 text-xs font-bold sm:inline-flex sm:items-center">Analisar</span></button>)}</div>;
}

function MessageIcon() { return <span className="text-lg">▢</span>; }

function ReasonBox() {
  return <div className="mt-4 rounded-xl bg-territory-raised p-3"><p className="text-xs text-territory-muted">Motivo informado</p><p className="mt-1 text-sm font-bold">Spam ou propaganda abusiva</p><p className="mt-1 text-xs text-territory-muted">3 denúncias agrupadas</p></div>;
}

function AnalysisCard({ onView }: { onView: (view: ModerationView) => void }) {
  return <Surface className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-heading text-xl font-bold">DEN-1042</p><p className="mt-1 flex items-center gap-1 text-sm text-territory-muted"><span>⌖</span> Santa Cruz</p></div><StatusPill>Em análise</StatusPill></div><div className="mt-4 flex gap-5 border-b border-territory-border text-sm font-semibold"><button type="button" className="min-h-10 border-b-2 border-territory-brand">Conteúdo</button><button type="button" className="min-h-10 text-territory-muted">Denúncias</button><button type="button" className="min-h-10 text-territory-muted">Histórico</button></div><div className="mt-4 rounded-xl border border-territory-border bg-territory-raised p-3"><div className="flex items-center gap-2 text-sm"><Store className="h-5 w-5 text-territory-brand" /><b>Loja Exemplo</b><span className="text-xs text-territory-muted">· Perfil comercial</span><MoreHorizontal className="ml-auto h-4 w-4" /></div><p className="mt-2 text-sm">Promoção da semana! Confira nosso catálogo.</p><Link to="#contexto" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-territory-brand">Ver contexto completo <ChevronRight className="h-4 w-4" /></Link></div><ReasonBox /><p className="mt-3 text-xs text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Quantidade de denúncias não determina a decisão.</p><h2 className="mt-5 text-sm font-bold">Sua decisão</h2><div className="mt-2 grid gap-2 sm:grid-cols-3">{["Manter","Ocultar","Remover"].map((label,index)=><button type="button" key={label} className={cn("flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm",index===0?"border-territory-brand bg-territory-raised font-semibold":"border-transparent")}><span className={cn("grid h-5 w-5 place-items-center rounded-full border",index===0?"border-territory-brand":"border-territory-muted")}>{index===0?<span className="h-2.5 w-2.5 rounded-full bg-territory-brand"/>:null}</span>{label}</button>)}</div><label className="mt-4 block text-sm font-bold">Justificativa <span className="text-red-700">*</span><textarea defaultValue="Conteúdo relacionado ao comércio local, sem repetição abusiva no contexto analisado." className="mt-2 min-h-24 w-full resize-y rounded-xl border border-territory-border bg-territory-surface p-3 text-sm font-normal" /><span className="block text-right text-xs font-normal text-territory-muted">71/1000</span></label><button type="button" onClick={() => onView("confirm")} className="mt-4 min-h-11 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Revisar decisão <ChevronRight className="ml-1 inline h-4 w-4" /></button></Surface>;
}

function QueueView({ onView }: { onView: (view: ModerationView) => void }) {
  return <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-territory-brand">Acesso autorizado</p><h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em] lg:text-3xl">Denúncias da comunidade</h1><p className="mt-1 text-sm text-territory-muted lg:text-base">Atue somente nos territórios sob sua responsabilidade</p></div><div className="hidden items-center gap-2 text-sm text-territory-muted lg:flex"><ShieldCheck className="h-5 w-5 text-territory-brand" />Complexo do Nordeste de Amaralina</div></div><div className="mt-5"><Tabs active="queue" onView={onView} /><Filters /></div><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.35fr)]"><Surface className="p-3"><QueueList onView={onView} /><button type="button" className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-territory-raised text-sm font-semibold">Carregar mais <ChevronDown className="h-4 w-4" /></button><p className="mt-3 flex items-start gap-2 px-1 text-xs leading-4 text-territory-muted"><Info className="h-4 w-4 shrink-0" />Uma denúncia inicia a análise; não comprova uma infração.</p></Surface><div className="hidden lg:block"><AnalysisCard onView={onView} /></div></div><div className="mt-5 grid gap-3 lg:grid-cols-3"><MiniState icon={AlertCircle} title="Outro moderador já decidiu" text="Atualize o caso antes de continuar." onClick={() => onView("conflict")} tone="blue" /><MiniState icon={LockKeyhole} title="Sem permissão neste território" text="Seu acesso não autoriza esta comunidade." onClick={() => onView("permission")} tone="sun" /><MiniState icon={FileText} title="Contestação · quando habilitada" text="Aguardando nova análise." onClick={() => onView("appeal")} tone="purple" /></div><div className="mt-5 lg:hidden"><BottomNav onView={onView} /></div></>;
}

function MiniState({ icon: Icon, title, text, onClick, tone }: { icon: typeof AlertCircle; title: string; text: string; onClick: () => void; tone: "blue" | "sun" | "purple" }) {
  return <Surface className={cn("p-4",tone === "blue" && "border-sky-200",tone === "sun" && "border-amber-200",tone === "purple" && "border-violet-200")}><h2 className="font-heading text-base font-bold">{title}</h2><p className="mt-2 rounded-xl bg-territory-raised p-3 text-xs text-territory-muted"><Icon className="mr-1 inline h-4 w-4" />{text}</p><button type="button" onClick={onClick} className="mt-3 min-h-10 w-full rounded-xl border border-territory-brand px-3 text-sm font-semibold text-territory-brand">Ver estado</button></Surface>;
}

function BottomNav({ onView }: { onView: (view: ModerationView) => void }) {
  return <nav aria-label="Navegação mobile da moderação" className="flex h-16 items-center justify-around border-t border-territory-border bg-territory-surface"><button type="button" className="flex flex-col items-center gap-1 text-[0.65rem] text-territory-muted"><Home className="h-5 w-5" />Início</button><button type="button" onClick={() => onView("queue")} className="flex flex-col items-center gap-1 text-[0.65rem] font-bold text-territory-brand"><ShieldCheck className="h-5 w-5" />Moderação</button><button type="button" className="flex flex-col items-center gap-1 text-[0.65rem] text-territory-muted"><UserRound className="h-5 w-5" />Comunidade</button><button type="button" className="flex flex-col items-center gap-1 text-[0.65rem] text-territory-muted"><MoreHorizontal className="h-5 w-5" />Mais</button></nav>;
}

function ConfirmView({ onView }: { onView: (view: ModerationView) => void }) {
  return <div className="mx-auto max-w-[40rem]"><p className="text-xs font-semibold text-territory-brand">DEN-1042</p><h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.045em]">Revisar decisão</h1><StatusPill>Manter conteúdo</StatusPill><p className="mt-3 text-sm leading-5 text-territory-muted">As denúncias serão encerradas sem ocultar a publicação.</p><Surface className="mt-5 p-4"><label className="block text-sm font-bold">Justificativa <span className="text-red-700">*</span><textarea defaultValue="O conteúdo está relacionado ao comércio local e não apresenta repetição abusiva no contexto analisado." className="mt-2 min-h-32 w-full resize-y rounded-xl border border-territory-border bg-territory-surface p-3 text-sm font-normal" /><span className="block text-right text-xs font-normal text-territory-muted">100/1000</span></label><button type="button" className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl border border-territory-border px-3 text-sm font-semibold">Nota interna (opcional)<ChevronDown className="h-4 w-4" /></button><p className="mt-3 rounded-xl bg-territory-raised p-3 text-xs leading-4 text-territory-muted"><Info className="mr-1 inline h-4 w-4" />A justificativa comunicável não deve expor denunciantes.</p></Surface><button type="button" onClick={() => onView("done")} className="mt-5 min-h-12 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Confirmar decisão</button><button type="button" onClick={() => onView("analysis")} className="mt-3 w-full py-2 text-sm font-semibold text-territory-brand underline">Voltar à análise</button></div>;
}

function DoneView({ onView }: { onView: (view: ModerationView) => void }) {
  return <div className="mx-auto max-w-[38rem] text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-9 w-9" /></span><h1 className="mt-4 font-heading text-[1.75rem] font-bold leading-tight">Análise concluída</h1><p className="mt-1 font-semibold text-territory-brand">DEN-1042 · Conteúdo mantido</p><p className="mt-1 text-sm text-territory-muted">17 set. · 14h32</p><Surface className="mt-5 p-4 text-left"><div className="space-y-4 border-l-2 border-territory-brand pl-4"><p><b className="block text-sm">Denúncia recebida</b><span className="text-xs text-territory-muted">17 set. · 14h05</span></p><p><b className="block text-sm">Conteúdo analisado</b><span className="text-xs text-territory-muted">17 set. · 14h28</span></p><p><b className="block text-sm">Decisão registrada</b><span className="text-xs text-territory-muted">17 set. · 14h32</span></p></div></Surface><Surface className="mt-3 p-4 text-left"><p className="flex items-center gap-2 text-sm font-bold"><FileText className="h-5 w-5 text-territory-brand" />Registro da decisão</p><p className="mt-2 text-sm leading-5 text-territory-muted">Conteúdo mantido. O conteúdo está relacionado ao comércio local e não apresenta repetição abusiva no contexto analisado.</p></Surface><Surface className="mt-3 p-4 text-left"><p className="flex items-center gap-2 text-sm font-bold"><Send className="h-5 w-5 text-territory-brand" />Comunicação ao autor <StatusPill> Pendente de envio </StatusPill></p><p className="mt-2 text-sm leading-5 text-territory-muted">A comunicação será processada conforme integrações do sistema.</p></Surface><button type="button" onClick={() => onView("queue")} className="mt-5 min-h-12 w-full rounded-xl bg-territory-brand px-4 text-sm font-bold text-white">Voltar à fila</button></div>;
}

function StateView({ view, onView }: { view: "permission" | "conflict" | "appeal"; onView: (view: ModerationView) => void }) {
  const data = view === "permission" ? { title: "Sem permissão neste território", text: "Seu acesso não autoriza esta comunidade.", note: "Você pode atuar apenas nos territórios sob sua responsabilidade." } : view === "conflict" ? { title: "Outro moderador já decidiu", text: "Atualize o caso antes de continuar.", note: "Este caso já possui uma decisão registrada por outro moderador." } : { title: "Contestação · quando habilitada", text: "Aguardando nova análise.", note: "O autor contestou esta decisão e o caso aguarda uma nova análise da equipe de moderação." };
  return <div className="mx-auto max-w-[38rem]"><p className="text-xs font-semibold text-territory-brand">Central de moderação</p><h1 className="mt-1 font-heading text-[1.75rem] font-bold leading-tight">{data.title}</h1><Surface className="mt-5 p-5 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-territory-sun/35 text-territory-brand">{view === "permission" ? <LockKeyhole className="h-7 w-7" /> : view === "conflict" ? <AlertCircle className="h-7 w-7" /> : <FileText className="h-7 w-7" />}</span><h2 className="mt-4 font-heading text-base font-bold">{data.text}</h2><p className="mt-2 text-sm leading-5 text-territory-muted">{data.note}</p><button type="button" onClick={() => onView(view === "permission" ? "queue" : "analysis")} className="mt-5 min-h-11 rounded-xl bg-territory-brand px-5 text-sm font-bold text-white">{view === "permission" ? "Voltar aos meus territórios" : "Atualizar análise"}</button></Surface></div>;
}

export default function ModeracaoComunidadeConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<ModerationView>(() => initialView(location.search));
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const onView = (next: ModerationView) => { setView(next); navigate(viewHref(next), { replace: true }); };
  return <><Helmet><title>Moderação da comunidade | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet><Shell view={view} onView={onView}>{view === "queue" ? <QueueView onView={onView} /> : view === "analysis" ? <div><button type="button" onClick={() => onView("queue")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-territory-brand"><ArrowLeft className="h-4 w-4" />Fila</button><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.8fr)]"><div><p className="text-xs font-semibold text-territory-brand">DEN-1042</p><h1 className="mt-1 font-heading text-[1.75rem] font-bold">Analisar denúncia</h1><p className="mt-1 text-sm text-territory-muted">Complexo do Nordeste de Amaralina · Santa Cruz</p></div><AnalysisCard onView={onView} /></div></div> : view === "confirm" ? <ConfirmView onView={onView} /> : view === "done" ? <DoneView onView={onView} /> : <StateView view={view} onView={onView} />}</Shell></>;
}
