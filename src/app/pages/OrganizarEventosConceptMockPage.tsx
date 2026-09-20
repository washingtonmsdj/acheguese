import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  Image as ImageIcon,
  Info,
  ListFilter,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import eventImage from "@/assets/community-concept-encontro-rua.jpg";
import draftImage from "@/assets/community-concept-grupo-encontros.jpg";
import { cn } from "@/shared/utils/cn";

const ORGANIZER_PATH = "/organizar-eventos";
const ORGANIZER_RESET =
  "[&_p]:!mb-0 [&_h1]:!mb-0 [&_h2]:!mb-0 [&_h3]:!mb-0 [&_label]:!mb-0 [&_button]:!font-sans";

type OrganizerView =
  | "events"
  | "info"
  | "location"
  | "participation"
  | "review"
  | "participants"
  | "checkin"
  | "change"
  | "cancel";

const event = {
  title: "Encontro de leitura",
  date: "19 set. de 2026",
  time: "15h–17h",
  place: "Santa Cruz",
};

function route(view?: OrganizerView) {
  return `${ORGANIZER_PATH}?concept-mock=1${view ? `&view=${view}` : ""}`;
}

function getRequestedView(search: string): OrganizerView | null {
  const value = new URLSearchParams(search).get("view") as OrganizerView | null;
  return value &&
    [
      "events",
      "info",
      "location",
      "participation",
      "review",
      "participants",
      "checkin",
      "change",
      "cancel",
    ].includes(value)
    ? value
    : null;
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to={route()} aria-label="Achegue-se — Meus eventos" className={cn("font-heading text-[1.55rem] font-bold tracking-[-0.065em]", light ? "text-white" : "text-territory-brand")}>
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-territory-border bg-territory-surface", className)}>{children}</section>;
}

function StatusBadge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "muted" | "red" }) {
  return <span className={cn("inline-flex rounded-lg px-3 py-1 text-xs font-semibold", tone === "green" && "bg-[#c8f2de] text-[#126443]", tone === "muted" && "bg-[#e8ecee] text-territory-muted", tone === "red" && "bg-[#ffe0dc] text-[#9c201b]")}>{children}</span>;
}

function Avatar({ letter = "A", className = "" }: { letter?: string; className?: string }) {
  return <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-brand text-sm font-bold text-white", className)}>{letter}</span>;
}

function MobileHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return <header className="flex min-h-14 items-center gap-2 border-b border-territory-border bg-territory-surface px-4"><button type="button" onClick={onBack} aria-label="Voltar" className="-ml-2 rounded-lg p-2 text-territory-brand"><ArrowLeft className="h-5 w-5" /></button><h1 className="min-w-0 flex-1 truncate text-sm font-bold">{title}</h1>{right}</header>;
}

function MobileBottomNav({ onView }: { onView: (view: OrganizerView) => void }) {
  return <nav className="grid grid-cols-4 border-t border-territory-border bg-territory-surface px-2 pb-[env(safe-area-inset-bottom)]" aria-label="Navegação principal"><button type="button" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-bold text-territory-brand"><CalendarDays className="h-5 w-5" />Meus eventos</button><button type="button" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-territory-muted"><Search className="h-5 w-5" />Explorar</button><button type="button" onClick={() => onView("participants")} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-territory-muted"><UsersRound className="h-5 w-5" />Comunidade</button><button type="button" className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] text-territory-muted"><UserRound className="h-5 w-5" />Perfil</button></nav>;
}

function EventOwnerCard({ draft = false, onView }: { draft?: boolean; onView: (view: OrganizerView) => void }) {
  return <Surface className="overflow-hidden p-3"><div className="flex gap-3"><img src={draft ? draftImage : eventImage} alt="" className="h-[5.3rem] w-[5.3rem] shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><StatusBadge tone={draft ? "muted" : "green"}>{draft ? "Rascunho" : "Publicado"}</StatusBadge><h2 className="mt-1 truncate text-base font-bold">{draft ? "Oficina de escrita" : event.title}</h2></div><button type="button" aria-label="Mais opções" className="p-1 text-territory-muted"><MoreHorizontal className="h-5 w-5" /></button></div>{draft ? <p className="mt-2 text-xs text-territory-muted">Em edição</p> : <><p className="mt-2 flex items-center gap-1 text-xs text-territory-muted"><CalendarDays className="h-3.5 w-3.5" />{event.date.replace(" de 2026", "")} · 15h</p><p className="mt-1 flex items-center gap-1 text-xs text-territory-muted"><MapPin className="h-3.5 w-3.5" />{event.place}</p><p className="mt-1 flex items-center gap-1 text-xs text-territory-muted"><UsersRound className="h-3.5 w-3.5" />18 inscrições · Limite 30</p></>}</div></div>{draft ? <button type="button" onClick={() => onView("info")} className="mt-3 min-h-10 w-full rounded-lg border border-territory-brand text-sm font-semibold">Continuar edição</button> : <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onView("participants")} className="min-h-10 rounded-lg bg-territory-brand text-sm font-bold text-white">Gerenciar</button><button type="button" className="min-h-10 rounded-lg border border-territory-brand text-sm font-semibold">Ver página</button></div>}</Surface>;
}

function MobileEvents({ onView }: { onView: (view: OrganizerView) => void }) {
  return <div className={cn("min-h-[100dvh] bg-territory-canvas text-territory-ink", ORGANIZER_RESET)}><header className="flex items-center gap-3 px-4 pb-2 pt-5"><Avatar /><div className="min-w-0 flex-1"><h1 className="font-heading text-xl font-bold">Meus eventos</h1><button type="button" className="flex items-center gap-1 text-xs text-territory-muted">Coletivo de leitura <ChevronDown className="h-3.5 w-3.5" /></button></div><Bell className="h-5 w-5 text-territory-brand" /></header><div className="grid grid-cols-3 border-b border-territory-border px-4 text-sm"><button type="button" className="min-h-11 border-b-2 border-territory-sun font-bold">Publicados</button><button type="button" className="min-h-11 border-b-2 border-transparent text-territory-muted">Rascunhos</button><button type="button" className="min-h-11 border-b-2 border-transparent text-territory-muted">Encerrados</button></div><div className="px-4 pt-3"><div className="flex min-h-11 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-muted"><Search className="h-4 w-4" />Buscar evento</div></div><div className="space-y-3 px-4 pt-3"><EventOwnerCard onView={onView} /><EventOwnerCard draft onView={onView} /></div><button type="button" onClick={() => onView("info")} className="mx-4 mt-4 flex min-h-12 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl bg-territory-sun text-sm font-bold"><Plus className="h-5 w-5" />Criar evento</button><MobileBottomNav onView={onView} /></div>;
}

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return <div className="grid grid-cols-4 gap-1 px-4 pt-4 text-center text-[10px]"><Step label="Informações" number="1" active={step >= 1} current={step === 1} /><Step label="Local" number="2" active={step >= 2} current={step === 2} /><Step label="Participação" number="3" active={step >= 3} current={step === 3} /><Step label="Revisão" number="4" active={step >= 4} current={step === 4} /></div>;
}

function Step({ label, number, active, current }: { label: string; number: string; active: boolean; current: boolean }) {
  return <div className="relative"><span className={cn("mx-auto grid h-7 w-7 place-items-center rounded-full border text-xs font-bold", current ? "border-territory-sun bg-territory-sun text-territory-ink" : active ? "border-territory-brand bg-territory-brand text-white" : "border-territory-muted text-territory-muted")}>{number}</span><span className={cn("mt-1 block truncate", current && "font-bold")}>{label}</span></div>;
}

function Field({ label, value, icon, large = false }: { label: string; value: string; icon?: ReactNode; large?: boolean }) {
  return <label className="mt-3 block text-xs font-semibold">{label}<span className={cn("mt-1 flex items-center gap-2 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal", large ? "min-h-[4.5rem] items-start py-3" : "min-h-10")}>{icon}{value}</span></label>;
}

function Accordion({ label, icon }: { label: string; icon?: ReactNode }) {
  return <button type="button" className="flex min-h-11 w-full items-center gap-2 border-b border-territory-border text-left text-sm font-semibold">{icon}<span className="flex-1">{label}</span><ChevronDown className="h-4 w-4 text-territory-muted" /></button>;
}

function MobileForm({ step, onView }: { step: 1 | 2 | 3 | 4; onView: (view: OrganizerView) => void }) {
  const isInfo = step === 1;
  const isParticipation = step === 3;
  return <div className={cn("min-h-[100dvh] bg-territory-surface text-territory-ink", ORGANIZER_RESET)}><MobileHeader title="Criar evento" onBack={() => onView("events")} right={<button type="button" className="text-sm">Sair</button>} /><Stepper step={step} /><main className="px-4 pb-5 pt-4">{isInfo ? <><h2 className="text-sm font-bold">Título do evento</h2><Field label="" value="Encontro de leitura" /><Field label="Categoria *" value="Cultura" icon={<UsersRound className="h-4 w-4 text-territory-brand" />} /><Field label="Descrição" value="Uma tarde para trocar livros e histórias." large /><div className="grid grid-cols-3 gap-2"><Field label="Data" value="19/09/2026" icon={<CalendarDays className="h-4 w-4 text-territory-brand" />} /><Field label="Horário de início" value="15h" icon={<Clock3 className="h-4 w-4 text-territory-brand" />} /><Field label="Horário de término" value="17h" icon={<Clock3 className="h-4 w-4 text-territory-brand" />} /></div><Field label="Fuso horário" value="Salvador (GMT-3)" icon={<CircleHelp className="h-4 w-4 text-territory-brand" />} /><label className="mt-3 block text-xs font-semibold">Imagem de capa<span className="mt-1 grid min-h-28 place-items-center rounded-lg border border-dashed border-territory-border p-3 text-center text-sm font-normal"><ImageIcon className="h-7 w-7 text-territory-brand" /><span><b className="block">Adicionar imagem</b><small className="text-xs text-territory-muted">JPG ou PNG · conforme política vigente</small></span></span></label><div className="mt-3"><Accordion label="Programação, galeria e dúvidas" icon={<ImageIcon className="h-4 w-4 text-territory-brand" />} /></div></> : isParticipation ? <><h2 className="text-sm font-bold">Tipo de participação</h2><div className="mt-2 grid grid-cols-2 gap-2"><Choice title="Gratuito" description="" active /><Choice title="Pago" description="Conforme disponibilidade" /></div><div className="mt-5 flex items-center justify-between"><b className="text-sm">Exige inscrição</b><span className="h-6 w-11 rounded-full bg-territory-brand p-0.5"><span className="ml-5 block h-5 w-5 rounded-full bg-white" /></span></div><Field label="Capacidade de participantes" value="30" icon={<UsersRound className="h-4 w-4 text-territory-brand" />} /><div className="mt-2 flex items-start gap-2 rounded-xl bg-[#e9f3f4] p-3 text-xs text-[#315e68]"><Info className="mt-0.5 h-4 w-4 shrink-0" />A confirmação deve respeitar as vagas disponíveis.</div><div className="mt-5 flex items-center justify-between"><span><b className="block text-sm">Lista de espera</b><small className="text-xs text-territory-muted">Depende de integração com a plataforma.</small></span><span className="h-6 w-11 rounded-full bg-territory-raised p-0.5"><span className="block h-5 w-5 rounded-full bg-white shadow-sm" /></span></div><div className="mt-4 divide-y divide-territory-border"><Accordion label="Orientações e acessibilidade" icon={<CircleHelp className="h-4 w-4 text-territory-brand" />} /><Accordion label="Contatos do organizador" icon={<UserRound className="h-4 w-4 text-territory-brand" />} /><Accordion label="SEO e recursos adicionais" icon={<Settings className="h-4 w-4 text-territory-brand" />} /></div></> : <ReviewContent />}</main><div className="border-t border-territory-border bg-territory-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => onView(step === 1 ? "events" : step === 3 ? "location" : "participation")} className="min-h-11 rounded-lg border border-territory-brand text-sm font-semibold">{step === 1 ? "Salvar rascunho" : "Voltar"}</button><button type="button" onClick={() => onView(step === 1 ? "location" : step === 2 ? "participation" : step === 3 ? "review" : "events")} className={cn("min-h-11 rounded-lg text-sm font-bold", step === 3 || step === 4 ? "bg-territory-sun" : "bg-territory-brand text-white")}>{step === 1 ? "Continuar" : step === 2 ? "Continuar" : step === 3 ? "Revisar evento" : "Publicar evento"}</button></div></div></div>;
}

function Choice({ title, description, active = false }: { title: string; description: string; active?: boolean }) {
  return <div className={cn("rounded-xl border p-3", active ? "border-territory-brand bg-[#edf7f3]" : "border-territory-border")}><span className={cn("mr-2 inline-block h-5 w-5 rounded-full border align-middle", active ? "border-territory-brand bg-territory-brand ring-2 ring-[#d0e8df]" : "border-territory-muted")} /><b className="text-sm">{title}</b>{description ? <small className="mt-1 block pl-7 text-xs text-territory-muted">{description}</small> : null}</div>;
}

function ReviewContent() {
  return <div><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-[#238051]" /><div><h2 className="text-xl font-bold">Revise seu evento</h2><p className="text-xs text-territory-muted">Confira os dados antes de publicar.</p></div></div><Surface className="mt-4 p-4"><h3 className="font-bold">{event.title}</h3><p className="mt-2 text-sm text-territory-muted">{event.date} · {event.time}</p><p className="text-sm text-territory-muted">{event.place} · Gratuito · Exige inscrição</p><hr className="my-3 border-territory-border" /><p className="text-sm">30 vagas · Comunidade Complexo do Nordeste de Amaralina</p></Surface><div className="mt-3 flex items-start gap-2 rounded-xl bg-[#e9f3f4] p-3 text-xs text-[#315e68]"><Info className="h-4 w-4 shrink-0" />A publicação depende da confirmação do servidor e das políticas da comunidade.</div></div>;
}

function MobileParticipants({ onView }: { onView: (view: OrganizerView) => void }) {
  return <div className={cn("min-h-[100dvh] bg-territory-canvas text-territory-ink", ORGANIZER_RESET)}><MobileHeader title="Participantes" onBack={() => onView("events")} right={<MoreHorizontal className="h-5 w-5" />} /><main className="pb-5"><div className="flex gap-3 p-4"><img src={eventImage} alt="" className="h-20 w-24 rounded-xl object-cover" /><div className="min-w-0"><h1 className="font-heading text-base font-bold">{event.title}</h1><p className="mt-1 flex items-center gap-1 text-xs text-territory-muted"><CalendarDays className="h-3.5 w-3.5" />19 set. · 15h</p><p className="mt-1 flex items-center gap-1 text-xs text-territory-muted"><MapPin className="h-3.5 w-3.5" />Santa Cruz</p><p className="mt-1 flex items-center gap-1 text-xs text-territory-muted"><UsersRound className="h-3.5 w-3.5" />18 inscrições · Limite 30</p></div></div><div className="grid grid-cols-2 border-b border-territory-border px-4 text-sm"><button type="button" className="min-h-11 border-b-2 border-territory-sun font-bold">Inscritos (18)</button><button type="button" onClick={() => onView("checkin")} className="min-h-11 text-territory-muted">Check-in (6)</button></div><div className="p-4"><div className="flex min-h-11 items-center gap-2 rounded-xl border border-territory-border bg-territory-surface px-3 text-sm text-territory-muted"><Search className="h-4 w-4" />Buscar participante</div></div><div><Participant name="Ana Oliveira" status="Confirmada" detail="Inscrição às 10h20" onAction={() => onView("checkin")} /><Participant name="Rafael Lima" status="Check-in realizado" detail="Entrada às 15h05" done onAction={() => undefined} /></div><div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-[#e9f3f4] p-3 text-xs text-[#315e68]"><Info className="mt-0.5 h-4 w-4 shrink-0" />Confirmar presença é diferente de confirmar inscrição.</div><button type="button" onClick={() => onView("events")} className="mx-4 mt-4 min-h-11 w-[calc(100%-2rem)] rounded-lg border border-territory-brand text-sm font-semibold">Ver evento</button></main></div>;
}

function MobileActionState({ kind, onView }: { kind: "change" | "cancel"; onView: (view: OrganizerView) => void }) {
  const cancel = kind === "cancel";
  return <div className={cn("min-h-[100dvh] bg-territory-canvas text-territory-ink", ORGANIZER_RESET)}><MobileHeader title={cancel ? "Cancelar evento" : "Alterar data ou local"} onBack={() => onView("events")} /><main className="px-4 pb-6 pt-5"><Surface className={cn("p-4", cancel ? "border-[#ffc9c4]" : "border-[#eddcaa]")}><div className="flex items-center gap-3">{cancel ? <Trash2 className="h-8 w-8 text-[#c21f1a]" /> : <CalendarDays className="h-8 w-8 text-[#8b6300]" />}<div><h1 className="font-heading text-lg font-bold">{cancel ? "Cancelar evento" : "Alterar data ou local"}</h1><p className="mt-1 text-xs text-territory-muted">{event.title}</p></div></div><textarea aria-label={cancel ? "Motivo do cancelamento" : "Motivo da alteração"} className="mt-5 min-h-28 w-full rounded-lg border border-territory-border bg-territory-surface p-3 text-sm" placeholder={cancel ? "Motivo do cancelamento" : "Motivo da alteração"} /><div className="mt-3 flex items-start gap-2 rounded-xl bg-[#e9f3f4] p-3 text-xs text-[#315e68]"><Info className="mt-0.5 h-4 w-4 shrink-0" />{cancel ? "A ação afeta participantes inscritos e não apaga o histórico." : "A comunicação depende de integração e deve ser revisada antes do envio."}</div><button type="button" onClick={() => onView("events")} className={cn("mt-4 min-h-11 w-full rounded-lg text-sm font-bold", cancel ? "bg-[#e02824] text-white" : "bg-territory-sun")}>{cancel ? "Revisar cancelamento" : "Revisar alteração"}</button></Surface></main></div>;
}

function Participant({ name, status, detail, done = false, onAction }: { name: string; status: string; detail: string; done?: boolean; onAction: () => void }) {
  return <div className="flex items-center gap-3 border-t border-territory-border bg-territory-surface px-4 py-3"><Avatar letter={name[0]} className="h-10 w-10 bg-[#d9c7b7] text-territory-brand" /><span className="min-w-0 flex-1"><b className="block text-sm">{name}</b><StatusBadge>{status}</StatusBadge><small className="mt-1 block text-xs text-territory-muted">{detail}</small></span>{done ? <button type="button" className="rounded-lg border border-territory-border px-2 py-2 text-xs">Ver registro</button> : <button type="button" onClick={onAction} className="rounded-lg border border-territory-brand px-2 py-2 text-xs font-semibold">Validar entrada</button>}<MoreHorizontal className="h-5 w-5 shrink-0 text-territory-muted" /></div>;
}

function DesktopRail({ onView }: { onView: (view: OrganizerView) => void }) {
  const items: [string, ReactNode, OrganizerView?][] = [["Meus eventos", <CalendarDays className="h-5 w-5" />, "events"], ["Participantes", <UsersRound className="h-5 w-5" />, "participants"], ["Check-in", <CheckCircle2 className="h-5 w-5" />, "checkin"], ["Configurações", <Settings className="h-5 w-5" />, "info"]];
  return <aside className="flex w-[13.5rem] shrink-0 flex-col bg-territory-brand px-3 py-5 text-white"><Brand light /><nav className="mt-8 space-y-1" aria-label="Navegação de organização">{items.map(([label, icon, view]) => <button type="button" key={label} onClick={() => view && onView(view)} className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm", label === "Meus eventos" ? "bg-white/15 font-bold" : "text-white/85")}>{icon}{label}</button>)}</nav><div className="mt-auto rounded-xl bg-white/10 p-3 text-xs text-white/75"><p className="font-semibold text-white">Perfil organizador</p><p className="mt-1">Coletivo de leitura</p></div></aside>;
}

function DesktopTopbar() {
  return <header className="flex min-h-14 items-center justify-end gap-4 border-b border-territory-border bg-territory-surface px-6"><Bell className="h-5 w-5 text-territory-brand" /><Avatar /><span className="text-sm font-semibold">Ana Oliveira</span><ChevronDown className="h-4 w-4" /></header>;
}

function DesktopDashboard({ onView }: { onView: (view: OrganizerView) => void }) {
  return <main className={cn("bg-territory-canvas p-5 xl:p-6", ORGANIZER_RESET)}><div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]"><Surface className="min-w-0 p-5"><button type="button" onClick={() => onView("events")} className="flex items-center gap-2 text-sm text-territory-brand"><ArrowLeft className="h-4 w-4" />Meus eventos</button><div className="mt-5 flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="font-heading text-2xl font-bold">{event.title}</h1><StatusBadge>Publicado</StatusBadge></div><p className="mt-2 flex items-center gap-2 text-sm text-territory-muted"><CalendarDays className="h-4 w-4" />{event.date} · {event.time} · {event.place}</p></div><button type="button" className="min-h-10 rounded-lg border border-territory-border px-4 text-sm font-semibold">Ver página pública ↗</button></div><div className="mt-5 grid grid-cols-3 gap-3"><Metric icon={<UsersRound className="h-5 w-5" />} value="18" label="inscrições" /><Metric icon={<UsersRound className="h-5 w-5" />} value="30" label="vagas totais" /><Metric icon={<Check className="h-5 w-5" />} value="4" label="check-ins" sun /></div><div className="mt-5 flex gap-7 border-b border-territory-border text-sm"><button type="button" className="border-b-2 border-territory-brand pb-2 font-bold">Visão geral</button><button type="button" className="border-b-2 border-territory-brand pb-2 font-bold">Inscrições</button><button type="button" className="pb-2 text-territory-muted">Conteúdo</button><button type="button" className="pb-2 text-territory-muted">Histórico</button></div><div className="mt-4 flex gap-3"><div className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-territory-border px-3 text-sm text-territory-muted"><Search className="h-4 w-4" />Buscar participante</div><button type="button" className="flex min-h-10 items-center gap-2 rounded-lg border border-territory-border px-4 text-sm">Todas as inscrições<ChevronDown className="h-4 w-4" /></button></div><div className="mt-3 overflow-hidden rounded-lg border border-territory-border"><div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-3 bg-[#eef2f1] px-4 py-3 text-xs font-semibold"><span>Nome</span><span>Status da inscrição</span><span>Data da inscrição</span><span>Check-in</span><span>Ações</span></div><DesktopParticipant name="Ana Oliveira" status="Confirmada" date="17 set. 10h20" check="Pendente" action="Validar entrada" onAction={() => onView("checkin")} /><DesktopParticipant name="Rafael Lima" status="Confirmada" date="17 set. 09h10" check="Realizado 15h05" action="Ver registro" done onAction={() => onView("checkin")} /></div><button type="button" className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-territory-raised px-6 py-2 text-xs">Carregar mais <ChevronDown className="h-3.5 w-3.5" /></button></Surface><DesktopConfig onView={onView} /></div><DesktopBottomPanels onView={onView} /></main>;
}

function Metric({ icon, value, label, sun = false }: { icon: ReactNode; value: string; label: string; sun?: boolean }) {
  return <Surface className="flex items-center gap-3 p-4"><span className={cn("grid h-11 w-11 place-items-center rounded-full", sun ? "bg-territory-sun text-territory-brand" : "bg-[#e9eeec] text-territory-brand")}>{icon}</span><span><b className="block font-heading text-2xl leading-6">{value}</b><span className="text-sm text-territory-muted">{label}</span></span></Surface>;
}

function DesktopParticipant({ name, status, date, check, action, done = false, onAction }: { name: string; status: string; date: string; check: string; action: string; done?: boolean; onAction: () => void }) {
  return <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] items-center gap-3 border-t border-territory-border px-4 py-3 text-sm"><span className="flex items-center gap-2"><Avatar letter={name[0]} className="h-8 w-8 bg-[#d9c7b7] text-xs text-territory-brand" />{name}</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#1d8359]" />{status}</span><span>{date}</span><span className="flex items-center gap-2"><i className={cn("h-2.5 w-2.5 rounded-full", done ? "bg-territory-brand" : "bg-territory-sun")} />{check}</span><button type="button" onClick={onAction} className={cn("min-h-9 rounded-lg border px-3 text-xs font-semibold", done ? "border-territory-border" : "border-territory-brand bg-territory-brand text-white")}>{action}</button></div>;
}

function DesktopConfig({ onView }: { onView: (view: OrganizerView) => void }) {
  return <aside className="p-4"><Surface className="p-5"><h2 className="font-heading text-xl font-bold">Configuração do evento</h2><p className="mt-5 flex items-center gap-2 text-sm"><Ticket className="h-5 w-5" />Gratuito · Presencial</p><p className="mt-4 flex items-center gap-2 text-sm"><MapPin className="h-5 w-5" />Espaço comunitário · Santa Cruz</p><button type="button" onClick={() => onView("info")} className="mt-6 min-h-11 w-full rounded-lg bg-territory-brand text-sm font-bold text-white">Editar informações</button><button type="button" className="mt-2 min-h-11 w-full rounded-lg border border-territory-brand text-sm font-semibold">Ver programação</button><hr className="my-6 border-territory-border" /><button type="button" className="flex min-h-11 w-full items-center gap-3 text-left text-sm"><ImageIcon className="h-5 w-5" />Galeria e dúvidas<ChevronRight className="ml-auto h-4 w-4" /></button><button type="button" className="flex min-h-11 w-full items-center gap-3 text-left text-sm"><CircleHelp className="h-5 w-5" />Orientações e acessibilidade<ChevronRight className="ml-auto h-4 w-4" /></button><button type="button" className="flex min-h-11 w-full items-center gap-3 text-left text-sm"><ListFilter className="h-5 w-5" />Divulgação e SEO<ChevronRight className="ml-auto h-4 w-4" /></button></Surface></aside>;
}

function DesktopBottomPanels({ onView }: { onView: (view: OrganizerView) => void }) {
  return <div className="mt-4 grid gap-3 xl:grid-cols-3"><Surface className="border-[#bfe9d6] p-5"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#d6f3e3] text-[#16744c]"><Check className="h-7 w-7" /></span><div><h2 className="text-lg font-bold">Revisar publicação</h2><p className="text-sm text-territory-muted">Data, local e inscrições conferidos.</p></div></div><p className="mt-5 flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-[#168052]" />Organizador identificado</p><p className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-[#168052]" />Orientações disponíveis</p><button type="button" onClick={() => onView("review")} className="mt-6 min-h-11 w-full rounded-lg bg-territory-brand text-sm font-bold text-white">Publicar evento</button></Surface><Surface className="border-[#eddcaa] p-5"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#fff0c5] text-[#8b6300]"><CalendarDays className="h-7 w-7" /></span><div><h2 className="text-lg font-bold">Alterar data ou local</h2><p className="text-sm text-territory-muted">Informe a mudança e revise seu impacto nas inscrições.</p></div></div><textarea aria-label="Motivo da alteração" className="mt-4 min-h-14 w-full rounded-lg border border-territory-border p-3 text-sm" placeholder="Motivo da alteração" /><button type="button" onClick={() => onView("change")} className="mt-3 min-h-11 w-full rounded-lg bg-territory-sun text-sm font-bold">Revisar alteração</button><p className="mt-3 flex items-center gap-2 text-xs text-territory-muted"><Info className="h-4 w-4" />Comunicação depende de integração.</p></Surface><Surface className="border-[#ffc9c4] p-5"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#ffe0dc] text-[#bd201c]"><Trash2 className="h-7 w-7" /></span><div><h2 className="text-lg font-bold text-[#c21f1a]">Cancelar evento</h2><p className="text-sm text-territory-muted">Esta ação afeta os participantes inscritos.</p></div></div><textarea aria-label="Motivo do cancelamento" className="mt-4 min-h-14 w-full rounded-lg border border-territory-border p-3 text-sm" placeholder="Motivo do cancelamento" /><div className="mt-3 grid grid-cols-[1fr_1.35fr] gap-2"><button type="button" className="min-h-11 rounded-lg border border-territory-brand text-sm font-semibold">Voltar</button><button type="button" onClick={() => onView("cancel")} className="min-h-11 rounded-lg bg-[#e02824] text-sm font-bold text-white">Revisar cancelamento</button></div></Surface></div>;
}

function DesktopActionState({ kind, onView }: { kind: "change" | "cancel"; onView: (view: OrganizerView) => void }) {
  const cancel = kind === "cancel";
  return <main className={cn("min-h-[calc(100dvh-3.5rem)] bg-territory-canvas p-8", ORGANIZER_RESET)}><button type="button" onClick={() => onView("events")} className="flex items-center gap-2 text-sm text-territory-brand"><ArrowLeft className="h-4 w-4" />Voltar aos eventos</button><Surface className={cn("mx-auto mt-12 max-w-2xl p-6", cancel ? "border-[#ffc9c4]" : "border-[#eddcaa]")}><div className="flex items-center gap-3">{cancel ? <Trash2 className="h-9 w-9 text-[#c21f1a]" /> : <CalendarDays className="h-9 w-9 text-[#8b6300]" />}<div><h1 className="font-heading text-2xl font-bold">{cancel ? "Revisar cancelamento" : "Revisar alteração"}</h1><p className="mt-1 text-sm text-territory-muted">{event.title} · {event.date} · {event.place}</p></div></div><p className="mt-6 text-sm leading-5 text-territory-muted">{cancel ? "Esta ação afeta participantes inscritos. O histórico e os registros permanecem preservados." : "Revise a diferença e o impacto nas inscrições antes de comunicar qualquer alteração."}</p><textarea aria-label={cancel ? "Motivo do cancelamento" : "Motivo da alteração"} className="mt-4 min-h-24 w-full rounded-lg border border-territory-border bg-territory-surface p-3 text-sm" placeholder={cancel ? "Motivo do cancelamento" : "Motivo da alteração"} /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => onView("events")} className="min-h-11 rounded-lg border border-territory-brand px-5 text-sm font-semibold">Voltar</button><button type="button" onClick={() => onView("events")} className={cn("min-h-11 rounded-lg px-5 text-sm font-bold", cancel ? "bg-[#e02824] text-white" : "bg-territory-sun")}>{cancel ? "Confirmar revisão" : "Revisar alteração"}</button></div></Surface></main>;
}

function DesktopForm({ step, onView }: { step: 1 | 2 | 3 | 4; onView: (view: OrganizerView) => void }) {
  return <main className={cn("min-h-[calc(100dvh-3.5rem)] bg-territory-canvas p-8", ORGANIZER_RESET)}><div className="mx-auto max-w-4xl"><button type="button" onClick={() => onView("events")} className="flex items-center gap-2 text-sm text-territory-brand"><ArrowLeft className="h-4 w-4" />Meus eventos</button><div className="mt-5"><h1 className="font-heading text-3xl font-bold">Criar evento</h1><p className="mt-1 text-sm text-territory-muted">Preencha os detalhes antes de publicar.</p></div><Surface className="mt-6 p-6"><Stepper step={step} />{step === 1 ? <div className="mx-auto mt-6 max-w-2xl"><Field label="Título do evento" value={event.title} /><Field label="Categoria *" value="Cultura" /><Field label="Descrição" value="Uma tarde para trocar livros e histórias." large /><div className="grid grid-cols-3 gap-3"><Field label="Data" value="19/09/2026" /><Field label="Horário de início" value="15h" /><Field label="Horário de término" value="17h" /></div><Field label="Fuso horário" value="Salvador (GMT-3)" /><div className="mt-4 grid min-h-28 place-items-center rounded-lg border border-dashed border-territory-border text-sm"><ImageIcon className="mr-2 inline h-6 w-6 text-territory-brand" />Adicionar imagem de capa</div></div> : step === 3 ? <div className="mx-auto mt-6 max-w-2xl"><h2 className="font-heading text-xl font-bold">Tipo de participação</h2><div className="mt-4 grid grid-cols-2 gap-3"><Choice title="Gratuito" description="" active /><Choice title="Pago" description="Conforme disponibilidade" /></div><div className="mt-6 flex items-center justify-between"><b>Exige inscrição</b><span className="h-6 w-11 rounded-full bg-territory-brand p-0.5"><span className="ml-5 block h-5 w-5 rounded-full bg-white" /></span></div><Field label="Capacidade de participantes" value="30" /><div className="mt-4 flex items-start gap-2 rounded-xl bg-[#e9f3f4] p-4 text-sm text-[#315e68]"><Info className="h-5 w-5 shrink-0" />A confirmação deve respeitar as vagas disponíveis.</div><div className="mt-5 divide-y divide-territory-border"><Accordion label="Orientações e acessibilidade" /><Accordion label="Contatos do organizador" /><Accordion label="SEO e recursos adicionais" /></div></div> : step === 4 ? <ReviewContent /> : <div className="mx-auto max-w-2xl"><h2 className="font-heading text-xl font-bold">Local e formato</h2><Field label="Formato" value="Presencial" /><Field label="Território" value="Complexo do Nordeste de Amaralina" /><Field label="Bairro" value="Santa Cruz" /><Field label="Local do evento" value="Espaço comunitário" /><div className="mt-4 flex items-start gap-2 rounded-xl bg-[#fff4d8] p-4 text-sm text-[#755400]"><Info className="h-5 w-5 shrink-0" />Endereço público e instruções de acesso devem ser revisados antes da publicação.</div></div>}<div className="mt-7 flex justify-between gap-3 border-t border-territory-border pt-5"><button type="button" onClick={() => onView(step === 1 ? "events" : step === 2 ? "info" : step === 3 ? "location" : "participation")} className="min-h-11 rounded-lg border border-territory-brand px-5 text-sm font-semibold">{step === 1 ? "Salvar rascunho" : "Voltar"}</button><button type="button" onClick={() => onView(step === 1 ? "location" : step === 2 ? "participation" : step === 3 ? "review" : "events")} className={cn("min-h-11 rounded-lg px-6 text-sm font-bold", step === 3 || step === 4 ? "bg-territory-sun" : "bg-territory-brand text-white")}>{step === 1 || step === 2 ? "Continuar" : step === 3 ? "Revisar evento" : "Publicar evento"}</button></div></Surface></div></main>;
}

function DesktopShell({ view, onView }: { view: OrganizerView; onView: (view: OrganizerView) => void }) {
  const form = view === "info" || view === "location" || view === "participation" || view === "review";
  const step: 1 | 2 | 3 | 4 = view === "info" ? 1 : view === "location" ? 2 : view === "participation" ? 3 : 4;
  return <div className={cn("hidden min-h-[100dvh] lg:flex", ORGANIZER_RESET)}><DesktopRail onView={onView} /><div className="min-w-0 flex-1"><DesktopTopbar />{form ? <DesktopForm step={step} onView={onView} /> : view === "change" || view === "cancel" ? <DesktopActionState kind={view} onView={onView} /> : <DesktopDashboard onView={onView} />}</div></div>;
}

export default function OrganizarEventosConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [view, setView] = useState<OrganizerView>(getRequestedView(location.search) ?? "events");
  useEffect(() => { const onResize = () => setIsDesktop(window.innerWidth >= 1024); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
  useEffect(() => { setView(getRequestedView(location.search) ?? "events"); }, [location.search]);
  const onView = (next: OrganizerView) => { setView(next); navigate(route(next), { replace: true }); };
  const mobile = view === "events" ? <MobileEvents onView={onView} /> : view === "participants" || view === "checkin" ? <MobileParticipants onView={onView} /> : view === "change" || view === "cancel" ? <MobileActionState kind={view} onView={onView} /> : <MobileForm step={view === "info" ? 1 : view === "location" ? 2 : view === "participation" ? 3 : 4} onView={onView} />;
  return <><Helmet><title>Meus eventos | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet>{isDesktop ? <DesktopShell view={view} onView={onView} /> : mobile}</>;
}
