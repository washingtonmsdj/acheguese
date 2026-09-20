import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  Home,
  Info,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Store,
  ThumbsUp,
  UsersRound,
} from "lucide-react";

import personalImage from "@/assets/persona-comerciante.jpg";
import providerImage from "@/assets/persona-prestador.jpg";
import { cn } from "@/shared/utils/cn";

const COMMUNITY_PATH = "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina";
type DetailView = "question" | "reply" | "poll" | "update" | "blocked";

function detailHref(view?: DetailView) {
  return `/publicacao/eletricista?concept-mock=1${view ? `&view=${view}` : ""}`;
}

function getInitialView(search: string): DetailView {
  const view = new URLSearchParams(search).get("view");
  return ["reply", "poll", "update", "blocked"].includes(view ?? "") ? (view as DetailView) : "question";
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link to={`${COMMUNITY_PATH}?visualMock=community-concept`} className={cn("font-heading text-[1.55rem] font-bold tracking-[-0.06em]", light ? "text-white" : "text-territory-brand")} aria-label="Achegue-se — início">achegue-se<span className="text-territory-sun">.</span></Link>;
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-territory-border bg-territory-surface", className)}>{children}</section>;
}

function PostBadge({ children, tone = "sun" }: { children: ReactNode; tone?: "sun" | "teal" | "blue" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tone === "sun" && "bg-territory-sun/65 text-territory-ink", tone === "teal" && "bg-territory-raised text-territory-brand", tone === "blue" && "bg-sky-100 text-sky-800")}>{children}</span>;
}

function Author({ name = "Ana Santos", time = "há 2 h", avatar = personalImage }: { name?: string; time?: string; avatar?: string }) {
  return <div className="flex items-center gap-3"><img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" /><div className="min-w-0"><p className="text-sm font-bold text-territory-ink">{name}</p><p className="text-xs text-territory-muted">Santa Cruz · {time}</p></div></div>;
}

function MetricActions({ onView, likes = "12", comments = "8" }: { onView: (view: DetailView) => void; likes?: string; comments?: string }) {
  return <div className="flex flex-wrap items-center gap-5 border-y border-territory-border py-3 text-sm text-territory-ink"><button type="button" className="flex items-center gap-1.5"><ThumbsUp className="h-5 w-5" />Curtir <span className="text-xs text-territory-muted">{likes}</span></button><button type="button" onClick={() => onView("reply")} className="flex items-center gap-1.5"><MessageCircle className="h-5 w-5" />Comentar <span className="text-xs text-territory-muted">{comments}</span></button><button type="button" className="flex items-center gap-1.5"><Bookmark className="h-5 w-5" />Salvar</button><button type="button" className="flex items-center gap-1.5"><Share2 className="h-5 w-5" />Compartilhar</button></div>;
}

function TerritoryBar({ onView }: { onView: (view: DetailView) => void }) {
  return <><header className="hidden h-16 items-center justify-between bg-territory-brand px-6 text-white lg:flex"><div className="flex items-center gap-7"><Brand light /><span className="flex items-center gap-2 text-sm"><span className="rounded-full bg-white/15 px-3 py-2"><Home className="mr-1 inline h-4 w-4" />Complexo do Nordeste de Amaralina <ChevronDown className="ml-2 inline h-4 w-4" /></span><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-territory-muted"><Search className="h-4 w-4" />Buscar na comunidade</span></span></div><div className="flex items-center gap-4"><Bell className="h-5 w-5" /><img src={personalImage} alt="" className="h-8 w-8 rounded-full object-cover" />Ana Santos<ChevronDown className="h-4 w-4" /></div></header><header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-between border-b border-territory-border bg-territory-surface/95 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur lg:hidden"><button type="button" onClick={() => onView("question")} className="flex h-11 items-center gap-1 rounded-full px-1 text-sm font-semibold"><ArrowLeft className="h-5 w-5" />Comunidade</button><Brand /><button type="button" aria-label="Mais opções" className="flex h-11 w-11 items-center justify-center rounded-full"><MoreHorizontal className="h-5 w-5" /></button></header><div className="flex items-center gap-2 border-b border-territory-border px-4 py-3 text-sm lg:hidden"><Home className="h-4 w-4 text-territory-brand" /><span className="min-w-0 flex-1 truncate">Complexo do Nordeste de Amaralina</span><ChevronRight className="h-4 w-4" /></div></>;
}

function Sidebar() {
  const items = [[Home, "Início", COMMUNITY_PATH], [UsersRound, "Comunidade", `${COMMUNITY_PATH}?visualMock=community-concept`], [Search, "Explorar", "/busca/ba/salvador/complexo-do-nordeste-de-amaralina"], [MessageCircle, "Conversas", "/mensagens?concept-mock=1"], [UsersRound, "Conta", "/conta?concept-mock=1"]] as const;
  return <aside className="hidden w-[160px] shrink-0 border-r border-territory-border bg-territory-surface px-3 py-5 lg:flex lg:flex-col"><Brand /><nav className="mt-8 space-y-1" aria-label="Navegação principal">{items.map(([Icon, label, target]) => <Link key={label} to={target} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium text-territory-ink hover:bg-territory-raised", label === "Comunidade" && "bg-territory-raised font-semibold text-territory-brand")}><Icon className="h-[18px] w-[18px]" /><span>{label}</span></Link>)}</nav><div className="mt-auto space-y-1 border-t border-territory-border pt-3"><button type="button" className="flex min-h-10 items-center gap-3 px-2 text-xs font-semibold text-territory-muted"><Info className="h-4 w-4" />Mais vizinhança</button><p className="px-2 text-xs leading-4 text-territory-muted">Mais possibilidades.</p></div></aside>;
}

function QuestionPost({ onView }: { onView: (view: DetailView) => void }) {
  return <Surface className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><Author /><PostBadge>Pergunta</PostBadge></div><h1 className="mt-4 font-heading text-[1.35rem] font-bold leading-tight tracking-[-0.035em] sm:text-2xl">Quem indica um eletricista por aqui?</h1><p className="mt-2 text-sm leading-5 text-territory-ink sm:text-base">Preciso revisar duas tomadas. Alguém tem uma indicação de confiança em Santa Cruz?</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-territory-raised px-3 py-1 text-xs font-semibold text-territory-brand">#Indicações</span><span className="rounded-full bg-territory-raised px-3 py-1 text-xs font-semibold text-territory-brand">#SantaCruz</span></div><div className="mt-4"><MetricActions onView={onView} /></div></Surface>;
}

function ServiceReply({ author = "Marcos Lima", time = "há 35 min" }: { author?: string; time?: string }) {
  return <div className="flex items-start gap-3 border-b border-territory-border py-4"><img src={providerImage} alt="" className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-bold">{author}</p><span className="text-xs text-territory-muted">{time}</span><MoreHorizontal className="ml-auto h-4 w-4 text-territory-muted" /></div><p className="mt-1 text-sm leading-5">O João me atendeu muito bem. Ele tem perfil em Serviços.</p><div className="mt-3 flex items-center gap-3 rounded-xl border border-territory-border bg-territory-raised p-2.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-territory-brand text-xl text-territory-sun">⚡</span><span className="min-w-0 flex-1"><b className="block text-sm">João Elétrica</b><span className="text-xs text-territory-muted">Serviços elétricos no bairro</span></span><button type="button" className="text-xs font-bold text-territory-brand">Ver serviço <ChevronRight className="inline h-4 w-4" /></button></div><div className="mt-2 flex gap-4 text-xs text-territory-muted"><button type="button">♡ Curtir · 3</button><button type="button">Responder</button></div></div></div>;
}

function Comment({ name, text, author = false }: { name: string; text: string; author?: boolean }) {
  return <div className="flex items-start gap-3 border-b border-territory-border py-4"><img src={author ? personalImage : providerImage} alt="" className="h-9 w-9 rounded-full object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-bold">{name}</p>{author ? <span className="rounded-full bg-territory-sun/65 px-2 py-0.5 text-[0.65rem] font-bold">Autora</span> : null}<span className="text-xs text-territory-muted">há 20 min</span><MoreHorizontal className="ml-auto h-4 w-4 text-territory-muted" /></div><p className="mt-1 text-sm leading-5">{text}</p><div className="mt-2 flex gap-4 text-xs text-territory-muted"><button type="button">♡ Curtir</button><button type="button">Responder</button></div></div></div>;
}

function Conversation({ view, onView }: { view: DetailView; onView: (view: DetailView) => void }) {
  return <Surface className="mt-4 overflow-hidden"><div className="flex items-center justify-between border-b border-territory-border px-4 py-3"><h2 className="font-heading text-base font-bold">Conversa · {view === "poll" ? "6" : "8"}</h2><button type="button" className="flex items-center gap-1 text-xs text-territory-muted">Mais recentes <ChevronDown className="h-4 w-4" /></button></div><div className="px-4"><ServiceReply /><Comment name="Ana Santos" text="Obrigada, Marcos! Vou conferir." author /><Comment name="Carla Menezes" text="Também recomendo o João. É atencioso e explica tudo direitinho." /><button type="button" className="mx-auto my-3 flex items-center gap-1 rounded-full border border-territory-border px-3 py-2 text-xs font-semibold text-territory-muted">Carregar mais comentários <ChevronDown className="h-4 w-4" /></button></div><Composer view={view} onView={onView} /></Surface>;
}

function Composer({ view, onView }: { view: DetailView; onView: (view: DetailView) => void }) {
  const blocked = view === "blocked";
  return <div className="border-t border-territory-border p-3"><div className="flex items-center gap-2"><img src={personalImage} alt="" className="h-9 w-9 rounded-full object-cover" /><span className="min-w-0 flex-1"><span className="block text-xs text-territory-muted">Respondendo como Ana Santos</span><input aria-label="Escreva uma resposta" placeholder={blocked ? "Confirme seu vínculo para responder..." : "Escreva uma resposta..."} disabled={blocked} className="mt-1 h-10 w-full rounded-full border border-territory-border bg-territory-surface px-4 text-sm outline-none focus:border-territory-brand" /></span><button type="button" onClick={() => onView("reply")} disabled={blocked} aria-label="Enviar resposta" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-territory-brand text-white disabled:bg-territory-raised disabled:text-territory-muted"><Send className="h-4 w-4" /></button></div>{view === "reply" ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-800"><AlertCircle className="mr-1 inline h-4 w-4" />Não foi possível enviar. Seu texto foi mantido.</div> : null}</div>;
}

function PollPost({ onView }: { onView: (view: DetailView) => void }) {
  return <Surface className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><Author name="Marina Costa" time="há 3 dias" avatar={providerImage} /><PostBadge tone="teal">Enquete · Encerrada</PostBadge></div><h1 className="mt-4 font-heading text-[1.35rem] font-bold leading-tight tracking-[-0.035em] sm:text-2xl">Qual atividade você quer no próximo encontro?</h1><p className="mt-2 text-sm leading-5">Resultado da votação da comunidade.</p><div className="mt-4 space-y-3">{[["Oficina de leitura","50%","bg-territory-sun"],["Cineclube","30%","bg-slate-300"],["Roda de conversa","20%","bg-slate-300"]].map(([label,value,color])=><div key={label}><div className="flex justify-between text-sm font-semibold"><span>{label}</span><span>{value}</span></div><div className="mt-1 h-2 rounded-full bg-territory-raised"><span className={cn("block h-2 rounded-full",color)} style={{width:value}} /></div></div>)}</div><p className="mt-3 text-xs text-territory-muted">40 votos · Votação encerrada</p><div className="mt-4 rounded-xl bg-territory-sun/30 p-3 text-sm font-semibold"><Check className="mr-1 inline h-4 w-4" />Seu voto: Oficina de leitura</div><div className="mt-4"><MetricActions onView={onView} likes="6" comments="6" /></div></Surface>;
}

function UpdatedPost({ onView }: { onView: (view: DetailView) => void }) {
  return <Surface className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><Author name="Paulo Souza" time="hoje" avatar={providerImage} /><PostBadge tone="teal"><ShieldCheck className="h-3.5 w-3.5" />Relato de morador</PostBadge></div><h1 className="mt-4 font-heading text-[1.35rem] font-bold leading-tight tracking-[-0.035em] sm:text-2xl">Iluminação na praça</h1><p className="mt-2 text-sm leading-5">A iluminação voltou a funcionar nesta noite.</p><div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><Check className="mr-1 inline h-5 w-5" />Normalizado <span className="font-normal">· atualizado às 19h20</span></div><div className="mt-4 space-y-3 border-l-2 border-territory-border pl-4 text-sm"><p><span className="font-semibold">18h10</span> · Falta de iluminação relatada</p><p><span className="font-semibold text-emerald-700">19h20</span> · Autor informou normalização</p></div><p className="mt-4 rounded-xl bg-territory-raised p-3 text-xs leading-4 text-territory-muted"><Info className="mr-1 inline h-4 w-4" />Atualização do autor. Não é comunicado oficial.</p><div className="mt-4"><MetricActions onView={onView} likes="15" comments="4" /></div></Surface>;
}

function BlockedPrompt({ onView }: { onView: (view: DetailView) => void }) {
  return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center sm:p-5"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-territory-sun text-territory-ink"><ShieldCheck className="h-6 w-6" /></span><h2 className="mt-3 font-heading text-base font-bold">Participe da sua comunidade</h2><p className="mt-1 text-sm leading-5 text-territory-muted">Para responder, confirme seu vínculo com este território.</p><button type="button" onClick={() => onView("question")} className="mt-4 min-h-11 w-full rounded-xl bg-territory-sun px-4 text-sm font-bold">Confirmar vínculo</button><button type="button" className="mt-2 min-h-11 w-full rounded-xl border border-territory-brand px-4 text-sm font-semibold text-territory-brand">Continuar explorando</button><p className="mt-3 text-xs text-territory-muted"><LockIcon />Seu endereço não aparece na publicação.</p></div>;
}

function LockIcon() { return <span className="mr-1 inline-block text-territory-brand">⌕</span>; }

function ContextPanel() {
  return <aside className="hidden space-y-4 lg:block"><Surface className="p-4"><h2 className="font-heading text-base font-bold">Sobre esta conversa</h2><p className="mt-4 flex gap-2 text-sm"><Home className="h-5 w-5 shrink-0 text-territory-brand" /><span>Santa Cruz<br /><span className="text-xs text-territory-muted">Complexo do Nordeste de Amaralina</span></span></p><div className="mt-3"><PostBadge>Pergunta</PostBadge></div><div className="mt-4 border-t border-territory-border pt-4"><p className="flex gap-2 text-sm font-semibold"><UsersRound className="h-5 w-5 shrink-0 text-territory-brand" />Boas conversas começam com respeito</p><p className="mt-1 pl-7 text-xs leading-4 text-territory-muted">Compartilhe indicações sem expor dados pessoais.</p></div><Link to="#regras" className="mt-4 flex items-center gap-2 text-sm font-semibold text-territory-brand"><Flag className="h-5 w-5" />Denunciar publicação</Link></Surface><Surface className="p-4"><p className="flex items-center gap-2 text-sm font-bold"><Store className="h-5 w-5 text-territory-brand" />Explore os serviços do bairro</p><p className="mt-2 text-sm leading-5 text-territory-muted">Encontre profissionais e negócios locais, apoiando a economia da sua comunidade.</p><Link to="/servicos/ba/salvador/complexo-do-nordeste-de-amaralina" className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-territory-sun text-sm font-bold">Ver serviços <ChevronRight className="h-4 w-4" /></Link></Surface></aside>;
}

export default function PublicacaoDetalheConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<DetailView>(() => getInitialView(location.search));
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const onView = (next: DetailView) => { setView(next); navigate(detailHref(next), { replace: true }); };
  const post = view === "poll" ? <PollPost onView={onView} /> : view === "update" ? <UpdatedPost onView={onView} /> : <QuestionPost onView={onView} />;
  return <><Helmet><title>Publicação e conversa | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[100dvh] bg-territory-canvas text-territory-ink"><div className="mx-auto flex min-h-[100dvh] w-full max-w-[1536px] lg:border-x lg:border-territory-border"><Sidebar /><div className="min-w-0 flex-1"><TerritoryBar onView={onView} /><main className="mx-auto w-full max-w-[1100px] px-4 pb-8 pt-0 sm:px-6 lg:px-7 lg:pt-5"><div className="mb-4 hidden items-center gap-1 text-sm font-semibold text-territory-brand lg:flex"><ArrowLeft className="h-4 w-4" /><Link to={`${COMMUNITY_PATH}?visualMock=community-concept`}>Voltar à comunidade</Link></div><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">{view === "blocked" ? <><div>{post}<div className="mt-4"><BlockedPrompt onView={onView} /></div></div><ContextPanel /></> : <><div>{post}<Conversation view={view} onView={onView} /></div><ContextPanel /></>}</div></main></div></div></div></>;
}
