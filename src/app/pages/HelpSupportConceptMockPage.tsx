import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Headphones,
  Info,
  Lock,
  MessageCircle,
  Package,
  Paperclip,
  Plus,
  Search,
  Send,
  Shield,
  Store,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type SupportView = "hub" | "new" | "tickets" | "conversation";

const TICKET = {
  id: "#AT1043",
  title: "Não consigo confirmar a coleta",
  context: "Entrega #1043 · Sabores da Ana",
};

const NAV_ITEMS: Array<{ id: SupportView; label: string; icon: typeof CircleHelp }> = [
  { id: "hub", label: "Central de ajuda", icon: CircleHelp },
  { id: "tickets", label: "Meus chamados", icon: FileText },
];

function Brand() {
  return <span className="font-heading text-xl font-bold tracking-[-0.07em] text-territory-brand">achegue-se<span className="text-territory-sun">.</span></span>;
}

function ProfileBadge({ compact = false }: { compact?: boolean }) {
  return <div className={cn("flex items-center gap-2", compact ? "text-xs" : "text-sm")}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-territory-sun text-territory-ink"><UserRound className="h-5 w-5" aria-hidden="true" /></span><span><strong className="block text-territory-ink">Carlos Santos</strong><span className="block text-xs text-territory-muted">Motoboy</span></span><ChevronRight className="ml-auto h-4 w-4 text-territory-muted" aria-hidden="true" /></div>;
}

function MobileHeader({ view, onBack }: { view: SupportView; onBack: () => void }) {
  return <header className="flex h-14 shrink-0 items-center justify-between border-b border-territory-border bg-territory-surface px-4 md:hidden"><button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-territory-brand" aria-label="Voltar"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button><Brand /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-territory-brand" aria-hidden="true"><UserRound className="h-5 w-5" /></span><span className="sr-only">{view === "hub" ? "Central de ajuda" : view === "new" ? "Solicitar atendimento" : view === "tickets" ? "Meus chamados" : "Conversa do chamado"}</span></header>;
}

function SearchField({ placeholder }: { placeholder: string }) {
  return <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" /><input className="h-11 w-full rounded-lg border border-territory-border bg-territory-surface pl-9 pr-3 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand" placeholder={placeholder} /></label>;
}

function DeliveryContextCard({ compact = false }: { compact?: boolean }) {
  return <section className={cn("rounded-xl border border-territory-border bg-territory-surface", compact ? "p-3" : "p-4")}><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-territory-brand"><Package className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">Entrega #1043 <span className="font-normal text-territory-muted">· Sabores da Ana</span></p><p className="text-xs text-territory-muted">Equipe da loja integrada</p>{compact ? null : <p className="mt-1 text-xs text-territory-ink">Preciso de ajuda nesta entrega</p>}</div><ChevronRight className="h-5 w-5 shrink-0 text-territory-muted" aria-hidden="true" /></div></section>;
}

function HelpCategory({ icon: Icon, label, desktopOnly = false }: { icon: typeof Truck; label: string; desktopOnly?: boolean }) {
  return <button type="button" className={cn("flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-2 text-center text-xs font-semibold text-territory-ink hover:border-territory-brand", desktopOnly ? "hidden md:flex" : null)}><Icon className="h-6 w-6 text-territory-brand" aria-hidden="true" />{label}</button>;
}

function HelpHub({ onView }: { onView: (view: SupportView) => void }) {
  return <div className="space-y-3"><h1 className="font-heading text-[1.65rem] font-bold tracking-[-0.05em] text-territory-brand md:text-2xl">Como podemos ajudar?</h1><div className="md:grid md:grid-cols-[minmax(0,1fr)_15rem] md:items-start md:gap-4"><div className="space-y-3"><button type="button" className="block w-full rounded-lg border border-territory-border bg-territory-surface p-3 text-left hover:border-territory-brand md:hidden"><ProfileBadge /></button><SearchField placeholder="Busque uma dúvida" /><button type="button" className="w-full text-left md:hidden" onClick={() => onView("conversation")}><DeliveryContextCard /></button><div className="grid grid-cols-2 gap-2 md:grid-cols-3"><HelpCategory icon={Truck} label="Entregas" /><HelpCategory icon={UserRound} label="Cadastro" /><HelpCategory icon={Store} label="Minhas lojas" /><HelpCategory icon={Wallet} label="Valores" /><HelpCategory icon={Shield} label="Segurança e conduta" /><HelpCategory icon={AlertTriangle} label="Problemas técnicos" desktopOnly /></div></div><div className="mt-3 flex flex-col gap-3 md:mt-0"><button type="button" className="hidden w-full text-left md:block" onClick={() => onView("conversation")}><DeliveryContextCard /></button><button type="button" onClick={() => onView("tickets")} className="order-1 flex w-full items-center gap-3 rounded-xl border border-territory-border bg-territory-surface p-3 text-left md:order-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-territory-brand"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-territory-ink">Meus chamados</strong><span className="text-xs text-territory-muted">Acompanhe suas solicitações</span></span><span className="rounded-full bg-territory-brand px-2 py-1 text-[0.68rem] font-bold text-white">1 resposta</span><ChevronRight className="h-4 w-4 text-territory-muted" aria-hidden="true" /></button><Button type="button" onClick={() => onView("new")} className="order-2 h-12 w-full rounded-xl bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85"><MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />Solicitar atendimento</Button></div></div><div className="flex items-center justify-center gap-6 border-t border-territory-border pt-3 text-xs font-semibold text-blue-700 md:mt-4"><button type="button" onClick={() => undefined}>Contato institucional</button><button type="button" onClick={() => undefined}><Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Privacidade e dados</button></div></div>;
}

function NewTicket({ onView }: { onView: (view: SupportView) => void }) {
  return <div className="space-y-3"><h1 className="font-heading text-[1.55rem] font-bold tracking-[-0.05em] text-territory-brand md:text-2xl">Solicitar atendimento</h1><div className="rounded-xl border border-territory-border bg-territory-surface p-3"><ProfileBadge /></div><label className="block text-xs font-bold text-territory-ink">Assunto <span className="text-rose-600">*</span><select defaultValue="app" className="mt-1.5 h-11 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal text-territory-ink outline-none focus:border-territory-brand"><option value="app">Problema no aplicativo</option><option value="delivery">Problema com entrega</option><option value="values">Dúvida sobre valores</option></select></label><DeliveryContextCard compact /><label className="block text-xs font-bold text-territory-ink">Título <span className="text-rose-600">*</span><input defaultValue={TICKET.title} className="mt-1.5 h-11 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal text-territory-ink outline-none focus:border-territory-brand" /></label><label className="block text-xs font-bold text-territory-ink">O que aconteceu? <span className="text-rose-600">*</span><textarea defaultValue="Conferi o pedido, mas a confirmação não foi concluída." className="mt-1.5 min-h-28 w-full resize-none rounded-lg border border-territory-border bg-territory-surface px-3 py-3 text-sm font-normal text-territory-ink outline-none focus:border-territory-brand" /></label><button type="button" className="flex items-center gap-2 text-sm font-semibold text-blue-700 underline"><Paperclip className="h-4 w-4" aria-hidden="true" />Adicionar anexo (opcional)</button><p className="flex items-center gap-2 text-xs text-territory-muted"><Info className="h-4 w-4 text-territory-brand" aria-hidden="true" />Não envie senhas ou códigos de entrega.</p><section className="flex items-center gap-3 rounded-xl bg-amber-50 p-3"><Headphones className="h-7 w-7 shrink-0 text-territory-brand" aria-hidden="true" /><div><p className="text-sm font-bold text-territory-ink">Atendimento: Achegue-se</p><p className="text-xs text-territory-muted">Falha técnica da plataforma.</p></div></section><div className="grid grid-cols-2 gap-2 pt-1"><Button type="button" variant="outline" onClick={() => onView("hub")} className="h-11 border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar</Button><Button type="button" onClick={() => onView("tickets")} className="h-11 bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Enviar chamado</Button></div></div>;
}

function TicketCard({ secondary = false, onView }: { secondary?: boolean; onView: (view: SupportView) => void }) {
  const id = secondary ? "#AT1038" : TICKET.id;
  const title = secondary ? "Dúvida sobre valor combinado" : TICKET.title;
  return <article className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-territory-ink">{id}</p><h2 className="mt-1 text-sm font-bold text-territory-ink">{title}</h2><p className="mt-2 flex items-center gap-2 text-xs text-territory-muted"><Headphones className="h-4 w-4 text-territory-brand" aria-hidden="true" />Atendimento: Achegue-se</p><p className="mt-1 flex items-center gap-2 text-xs text-territory-muted"><Package className="h-4 w-4 text-territory-brand" aria-hidden="true" />{secondary ? "Entrega #1038 · Mercado da Praça" : TICKET.context}</p></div><span className={cn("rounded-full px-2 py-1 text-[0.68rem] font-bold", secondary ? "bg-emerald-100 text-emerald-800" : "bg-territory-sun/60 text-territory-ink")}>{secondary ? "Em atendimento" : "Aguardando sua resposta"}</span></div>{secondary ? null : <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-territory-brand"><MessageCircle className="h-4 w-4" aria-hidden="true" />1 mensagem nova</p>}<button type="button" onClick={() => onView(secondary ? "conversation" : "conversation")} className="mt-3 text-xs font-semibold text-blue-700 underline">Ver chamado</button></article>;
}

function TicketList({ onView }: { onView: (view: SupportView) => void }) {
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h1 className="font-heading text-[1.55rem] font-bold tracking-[-0.05em] text-territory-brand md:text-2xl">Meus chamados</h1><button type="button" onClick={() => onView("new")} className="hidden items-center gap-1 text-xs font-semibold text-blue-700 md:flex"><Plus className="h-4 w-4" aria-hidden="true" />Novo chamado</button></div><SearchField placeholder="Buscar protocolo ou assunto" /><div className="grid grid-cols-2 border-b border-territory-border text-sm"><button type="button" className="border-b-2 border-territory-brand pb-3 font-bold text-territory-brand">Abertos <span className="ml-1 rounded-full bg-territory-brand px-1.5 py-0.5 text-[0.68rem] text-white">2</span></button><button type="button" className="pb-3 text-territory-muted">Resolvidos <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[0.68rem] text-territory-ink">1</span></button></div><TicketCard onView={onView} /><TicketCard secondary onView={onView} /><Button type="button" onClick={() => onView("new")} className="h-12 w-full bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85"><Plus className="mr-2 h-5 w-5" aria-hidden="true" />Novo chamado</Button></div>;
}

function Conversation({ onView }: { onView: (view: SupportView) => void }) {
  return <div className="space-y-3"><div className="flex items-start justify-between gap-3"><div><h1 className="font-heading text-[1.55rem] font-bold tracking-[-0.05em] text-territory-brand md:text-2xl">Chamado #AT1043</h1><span className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-600" />Em atendimento</span></div><button type="button" onClick={() => onView("tickets")} className="hidden text-xs font-semibold text-blue-700 md:block">Voltar aos chamados</button></div><DeliveryContextCard compact /><div className="relative space-y-4 border-l border-territory-border pl-4"><div className="relative"><span className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-territory-brand" /><p className="text-xs text-territory-muted">Chamado recebido · Hoje · 10:12</p></div><div className="relative"><span className="absolute -left-[1.35rem] top-1 flex h-7 w-7 -translate-y-1/4 items-center justify-center rounded-full bg-slate-100 text-territory-brand"><UserRound className="h-4 w-4" aria-hidden="true" /></span><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold text-territory-ink">Carlos Santos</p><p className="mt-1 text-sm text-territory-ink">Não consigo confirmar a coleta.</p></div></div><div className="relative"><span className="absolute -left-[1.35rem] top-1 flex h-7 w-7 -translate-y-1/4 items-center justify-center rounded-full bg-territory-brand text-white"><Headphones className="h-4 w-4" aria-hidden="true" /></span><div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold text-territory-ink">Equipe Achegue-se</p><p className="mt-1 text-sm text-territory-ink">A coleta aparece como confirmada agora?</p></div></div><div className="relative"><span className="absolute -left-[1.35rem] top-1 flex h-7 w-7 -translate-y-1/4 items-center justify-center rounded-full bg-slate-100 text-territory-brand"><UserRound className="h-4 w-4" aria-hidden="true" /></span><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold text-territory-ink">Carlos Santos</p><p className="mt-1 text-sm text-territory-ink">Sim, agora aparece confirmada.</p></div></div></div><div className="flex items-center gap-2"><button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-territory-border bg-territory-surface text-territory-brand" aria-label="Adicionar anexo"><Paperclip className="h-5 w-5" aria-hidden="true" /></button><input className="h-11 min-w-0 flex-1 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm outline-none placeholder:text-territory-muted" placeholder="Escreva uma mensagem..." /><Button type="button" className="h-11 w-11 shrink-0 rounded-full bg-territory-brand p-0 text-white hover:bg-territory-brand/90" aria-label="Enviar mensagem"><Send className="h-5 w-5" aria-hidden="true" /></Button></div><Button type="button" variant="outline" onClick={() => onView("tickets")} className="h-11 w-full border-territory-brand text-sm font-bold text-territory-brand"><CheckCircle2 className="mr-2 h-5 w-5" aria-hidden="true" />Meu problema foi resolvido</Button><button type="button" className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-blue-700 underline"><Clock3 className="h-4 w-4" aria-hidden="true" />Ver histórico do atendimento</button><p className="flex items-start gap-2 rounded-lg bg-slate-100 px-3 py-3 text-xs text-territory-muted"><Info className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />Este atendimento não altera o pedido automaticamente.</p></div>;
}

function SupportSidebar({ view, onView }: { view: SupportView; onView: (view: SupportView) => void }) {
  return <aside className="hidden w-40 shrink-0 flex-col rounded-xl bg-territory-brand p-3 text-white md:flex"><div className="mb-5 px-1"><Brand /></div><nav className="space-y-1">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => onView(id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-semibold", view === id || (id === "tickets" && view === "conversation") ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10")}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}</button>)}<button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-semibold text-white/80"><MessageCircle className="h-4 w-4" aria-hidden="true" />Contato institucional</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-semibold text-white/80"><Shield className="h-4 w-4 shrink-0" aria-hidden="true" />Privacidade e dados</button></nav></aside>;
}

function HelpSupportDesktop({ view, onView }: { view: SupportView; onView: (view: SupportView) => void }) {
  const content = view === "hub" ? <HelpHub onView={onView} /> : view === "new" ? <NewTicket onView={onView} /> : view === "tickets" ? <TicketList onView={onView} /> : <Conversation onView={onView} />;
  return <div className="hidden min-h-[38rem] flex-1 gap-5 rounded-xl border border-territory-border bg-territory-surface p-4 md:flex lg:p-5"><SupportSidebar view={view} onView={onView} /><main className="min-w-0 flex-1"><div className="mb-4 flex items-start justify-between border-b border-territory-border pb-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-territory-muted">Ajuda e suporte</p><p className="mt-1 text-sm text-territory-muted">Central de chamados, conversa e encaminhamento</p></div><ProfileBadge compact /></div><div className={cn("mx-auto", view === "hub" ? "max-w-3xl" : "max-w-2xl")}>{content}</div></main></div>;
}

function HelpSupportMobile({ view, onView }: { view: SupportView; onView: (view: SupportView) => void }) {
  return <div className="md:hidden"><MobileHeader view={view} onBack={() => onView(view === "hub" ? "hub" : "hub")} /><main className="mx-auto min-h-[calc(100dvh-3.5rem)] max-w-[28rem] overflow-y-auto px-4 pb-6 pt-5">{view === "hub" ? <HelpHub onView={onView} /> : view === "new" ? <NewTicket onView={onView} /> : view === "tickets" ? <TicketList onView={onView} /> : <Conversation onView={onView} />}</main></div>;
}

export default function HelpSupportConceptMockPage() {
  const [view, setView] = useState<SupportView>("hub");
  return <><Helmet><title>Ajuda e suporte | achegue-se.</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-screen bg-[#fbfaf7] text-territory-ink"><header className="mx-auto hidden h-20 max-w-[1440px] items-center justify-between px-8 md:flex"><div className="flex items-center gap-5"><Brand /><span className="h-8 w-px bg-territory-border" /><h1 className="font-heading text-2xl font-bold tracking-[-0.05em] text-territory-ink">Ajuda e suporte</h1></div><div className="flex items-center gap-4"><ProfileBadge compact /><span className="h-8 w-px bg-territory-border" /><p className="max-w-28 text-xs text-territory-muted">Sempre em movimento com você.</p></div></header><div className="mx-auto max-w-[1440px] px-0 pb-8 md:px-7"><HelpSupportMobile view={view} onView={setView} /><HelpSupportDesktop view={view} onView={setView} /></div></div></>;
}
