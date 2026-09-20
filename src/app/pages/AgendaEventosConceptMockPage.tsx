import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Accessibility,
  ArrowLeft,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Image as ImageIcon,
  Info,
  List,
  Map,
  MapPin,
  Menu,
  Navigation,
  PlusCircle,
  Search,
  Share2,
  Ticket,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import eventHero from "@/assets/community-concept-encontro-rua.jpg";
import eventMarket from "@/assets/bairro-chapada.jpg";
import eventPhoto from "@/assets/bairro-vale-pedrinhas.jpg";
import { cn } from "@/shared/utils/cn";

const AGENDA_PATH = "/agenda";
const AGENDA_RESET =
  "[&_p]:!mb-0 [&_h1]:!mb-0 [&_h2]:!mb-0 [&_h3]:!mb-0 [&_label]:!mb-0 [&_button]:!font-sans";

type AgendaView =
  | "discover"
  | "detail"
  | "confirm"
  | "confirmed"
  | "soldout"
  | "canceled"
  | "error";

type EventItem = {
  title: string;
  date: string;
  time: string;
  place: string;
  price: string;
  image: string;
  organizer: string;
};

const events: EventItem[] = [
  {
    title: "Encontro de leitura",
    date: "19 set. de 2026",
    time: "15h – 17h",
    place: "Santa Cruz",
    price: "Gratuito",
    image: eventHero,
    organizer: "Coletivo de leitura",
  },
  {
    title: "Feira de empreendedores",
    date: "20 set. de 2026",
    time: "9h",
    place: "Chapada",
    price: "Entrada livre",
    image: eventMarket,
    organizer: "Rede de empreendedores",
  },
  {
    title: "Oficina de fotografia",
    date: "26 set. de 2026",
    time: "14h",
    place: "Vale das Pedrinhas",
    price: "Gratuito",
    image: eventPhoto,
    organizer: "Casa de cultura",
  },
];

function route(view?: AgendaView) {
  return `${AGENDA_PATH}?concept-mock=1${view ? `&view=${view}` : ""}`;
}

function getRequestedView(search: string): AgendaView | null {
  const value = new URLSearchParams(search).get("view") as AgendaView | null;
  return value &&
    [
      "discover",
      "detail",
      "confirm",
      "confirmed",
      "soldout",
      "canceled",
      "error",
    ].includes(value)
    ? value
    : null;
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to={route()}
      aria-label="Achegue-se — Agenda e eventos"
      className={cn(
        "font-heading text-[1.55rem] font-bold tracking-[-0.065em]",
        light ? "text-white" : "text-territory-brand",
      )}
    >
      achegue-se<span className="text-territory-sun">.</span>
    </Link>
  );
}

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-territory-border bg-territory-surface",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Badge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "yellow" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tone === "teal" && "bg-[#e2f0e9] text-[#14534a]",
        tone === "yellow" && "bg-[#fff1bf] text-[#805500]",
        tone === "muted" && "bg-territory-raised text-territory-muted",
      )}
    >
      {children}
    </span>
  );
}

function MobileHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="flex min-h-14 items-center gap-2 border-b border-territory-border bg-territory-surface px-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="-ml-2 rounded-lg p-2 text-territory-brand"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {title}
      </span>
      {right}
    </header>
  );
}

function MobileAgendaHeader() {
  return (
    <header className="flex items-center justify-between px-4 pt-5">
      <Brand />
      <button
        type="button"
        aria-label="Abrir perfil"
        className="grid h-9 w-9 place-items-center rounded-full border border-territory-brand text-territory-brand"
      >
        <UserRound className="h-5 w-5" />
      </button>
    </header>
  );
}

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm text-territory-muted",
        compact ? "min-h-10" : "min-h-11",
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span>Buscar evento</span>
    </div>
  );
}

function EventMeta({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  return (
    <div className={cn("text-territory-muted", compact ? "space-y-0.5 text-xs" : "space-y-2 text-sm")}>
      <p className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span>
          {event.date} · {event.time}
        </span>
      </p>
      <p className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0" />
        <span>
          {event.place} · {event.price}
        </span>
      </p>
    </div>
  );
}

function MobileEventCard({
  event,
  onOpen,
}: {
  event: EventItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full overflow-hidden rounded-xl border border-territory-border bg-territory-surface text-left"
    >
      <div className="relative">
        <img src={event.image} alt="" className="h-[7.1rem] w-full object-cover" />
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-territory-brand shadow-sm">
          <Bookmark className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold text-territory-ink">{event.title}</h2>
          <EventMeta event={event} compact />
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-territory-brand" />
      </div>
    </button>
  );
}

function MobileBottomActions() {
  return (
    <div className="mt-4 border-t border-territory-border bg-territory-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-territory-border text-sm font-semibold"
      >
        <PlusCircle className="h-5 w-5" />
        Criar evento
      </button>
      <p className="mt-1 text-center text-[11px] text-territory-muted">
        Disponível para perfis autorizados.
      </p>
    </div>
  );
}

function MobileDiscover({ onView }: { onView: (view: AgendaView) => void }) {
  return (
    <div className={cn("min-h-[100dvh] bg-territory-surface text-territory-ink", AGENDA_RESET)}>
      <MobileAgendaHeader />
      <div className="px-4 pb-1 pt-3">
        <h1 className="font-heading text-[1.65rem] font-bold tracking-[-0.045em]">Agenda</h1>
        <button type="button" className="mt-0.5 flex items-center gap-1 text-xs text-territory-muted">
          <MapPin className="h-4 w-4 text-territory-brand" />
          Complexo do Nordeste de Amaralina
        </button>
        <div className="mt-3">
          <SearchBox />
        </div>
        <div className="mt-3 grid grid-cols-3 border-b border-territory-border text-sm">
          {[
            ["Explorar", true],
            ["Salvos", false],
            ["Participações", false],
          ].map(([label, active]) => (
            <button
              type="button"
              key={String(label)}
              className={cn(
                "min-h-10 border-b-2 px-1 text-center",
                active
                  ? "border-territory-brand font-bold text-territory-brand"
                  : "border-transparent text-territory-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          <Badge tone="teal">Todos</Badge>
          <Badge tone="muted">Hoje</Badge>
          <Badge tone="muted">Esta semana</Badge>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" className="flex min-h-10 items-center justify-center gap-1 rounded-lg bg-territory-brand px-2 text-xs font-semibold text-white">
            <List className="h-4 w-4" /> Lista
          </button>
          <button type="button" className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-territory-border px-2 text-xs font-semibold">
            <CalendarDays className="h-4 w-4" /> Calendário
          </button>
          <button type="button" className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-territory-border px-2 text-xs font-semibold">
            <Map className="h-4 w-4" /> Mapa
          </button>
        </div>
      </div>
      <div className="space-y-2 px-4 pt-3">
        {events.map((event) => (
          <MobileEventCard key={event.title} event={event} onOpen={() => onView("detail")} />
        ))}
      </div>
      <MobileBottomActions />
    </div>
  );
}

function MobileDetail({ onView }: { onView: (view: AgendaView) => void }) {
  const event = events[0];
  return (
    <div className={cn("min-h-[100dvh] bg-territory-surface text-territory-ink", AGENDA_RESET)}>
      <MobileHeader title="Agenda" onBack={() => onView("discover")} />
      <img src={event.image} alt="" className="h-40 w-full object-cover" />
      <main className="px-4 pb-5 pt-3">
        <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.035em]">{event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>Gratuito</Badge>
          <Badge tone="muted">Presencial</Badge>
        </div>
        <div className="mt-4 space-y-2.5">
          <EventMeta event={event} />
          <p className="flex items-center gap-2 text-sm text-territory-muted">
            <UsersRound className="h-4 w-4 shrink-0" />
            {event.organizer}
            <button type="button" className="ml-auto text-sm font-semibold text-blue-700">Ver organizador</button>
          </p>
        </div>
        <p className="mt-4 text-sm leading-5 text-territory-muted">
          Uma tarde para trocar livros e histórias com pessoas da comunidade.
        </p>
        <div className="mt-4 divide-y divide-territory-border rounded-xl border border-territory-border">
          <DisclosureRow icon={<CalendarDays className="h-5 w-5" />} label="Programação" />
          <DisclosureRow icon={<Accessibility className="h-5 w-5" />} label="Local e acessibilidade" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-territory-border text-sm font-semibold">
            <Bookmark className="h-4 w-4" /> Salvar
          </button>
          <button type="button" className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-territory-border text-sm font-semibold">
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#eaf4f7] p-3 text-xs text-[#32648a]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Inscrição gratuita necessária.</span>
        </div>
        <button type="button" onClick={() => onView("confirm")} className="mt-3 min-h-12 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink">
          Participar
        </button>
      </main>
    </div>
  );
}

function DisclosureRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm font-semibold">
      <span className="text-territory-brand">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronDown className="h-4 w-4 text-territory-muted" />
    </button>
  );
}

function MiniEvent({ compact = false }: { compact?: boolean }) {
  const event = events[0];
  return (
    <div className={cn("flex items-center gap-3", compact ? "" : "rounded-xl border border-territory-border p-3")}>
      <img src={event.image} alt="" className={cn("shrink-0 rounded-lg object-cover", compact ? "h-14 w-20" : "h-14 w-20")} />
      <div className="min-w-0">
        <b className="block truncate text-sm">{event.title}</b>
        <p className="mt-0.5 text-xs text-territory-muted">{event.date} · {event.time}</p>
        <p className="text-xs text-territory-muted">{event.place}</p>
      </div>
    </div>
  );
}

function ProfileCard() {
  return (
    <Surface className="flex items-center gap-3 p-3">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef3eb] text-territory-brand">
        <UserRound className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm">Ana Oliveira</b>
        <span className="text-xs text-territory-muted">Pessoal</span>
      </span>
      <ChevronRight className="h-5 w-5 text-territory-muted" />
    </Surface>
  );
}

function ConfirmView({ onView }: { onView: (view: AgendaView) => void }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className={cn("min-h-[100dvh] bg-territory-surface text-territory-ink", AGENDA_RESET)}>
      <MobileHeader title="Voltar" onBack={() => onView("detail")} />
      <main className="px-4 pb-6 pt-4">
        <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.035em]">Confirmar participação</h1>
        <div className="mt-5"><MiniEvent /></div>
        <h2 className="mt-5 text-base font-bold">Seu perfil</h2>
        <div className="mt-2"><ProfileCard /></div>
        <h2 className="mt-5 text-base font-bold">Resumo da inscrição</h2>
        <Surface className="mt-2 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold"><Ticket className="h-5 w-5 text-territory-brand" />Inscrição gratuita</p>
          <div className="mt-3 flex justify-between text-sm"><span>1 participante</span><span>R$ 0,00</span></div>
          <div className="mt-2 flex justify-between border-t border-territory-border pt-2 text-sm font-bold"><span>Total</span><span>R$ 0,00</span></div>
        </Surface>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff3d5] p-3 text-xs text-[#765311]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Confira o perfil e as informações antes de confirmar.</span>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="h-5 w-5 accent-[#0d504b]"
          />
          Li as orientações do evento.
        </label>
        <button
          type="button"
          disabled={!accepted}
          onClick={() => onView("confirmed")}
          className="mt-4 min-h-12 w-full rounded-lg bg-territory-brand text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Confirmar participação
        </button>
        <button type="button" onClick={() => onView("detail")} className="mt-2 min-h-11 w-full rounded-lg border border-territory-brand text-sm font-semibold">
          Voltar
        </button>
      </main>
    </div>
  );
}

function ConfirmedView({ onView }: { onView: (view: AgendaView) => void }) {
  return (
    <div className={cn("min-h-[100dvh] bg-territory-surface text-territory-ink", AGENDA_RESET)}>
      <main className="px-4 pb-6 pt-12 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#2c8752] text-white">
          <Check className="h-9 w-9" strokeWidth={3} />
        </span>
        <h1 className="mt-5 font-heading text-[1.4rem] font-bold">Participação confirmada</h1>
        <p className="mt-1 text-sm text-territory-muted">Nos vemos por lá!</p>
        <Surface className="mt-8 p-3 text-left"><MiniEvent compact /></Surface>
        <h2 className="mt-5 text-left text-base font-bold">Seu perfil</h2>
        <div className="mt-2 text-left"><ProfileCard /></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="flex min-h-12 items-center justify-center gap-1 rounded-lg border border-territory-border px-2 text-xs font-semibold"><CalendarDays className="h-4 w-4" /> Adicionar à agenda</button>
          <button type="button" className="flex min-h-12 items-center justify-center gap-1 rounded-lg border border-territory-border px-2 text-xs font-semibold"><Navigation className="h-4 w-4" /> Como chegar</button>
        </div>
        <Surface className="mt-5 flex items-center gap-3 p-3 text-left">
          <Info className="h-6 w-6 shrink-0 text-territory-brand" />
          <span className="min-w-0 flex-1"><b className="block text-sm">Informações do evento</b><span className="text-xs text-territory-muted">Acompanhe aqui possíveis alterações do organizador.</span></span>
          <ChevronRight className="h-4 w-4" />
        </Surface>
        <button type="button" onClick={() => onView("detail")} className="mt-5 min-h-12 w-full rounded-lg bg-territory-brand text-sm font-bold text-white">Ver evento</button>
        <button type="button" onClick={() => onView("detail")} className="mt-2 min-h-11 w-full rounded-lg border border-territory-brand text-sm font-semibold">Cancelar participação</button>
      </main>
    </div>
  );
}

function MobileState({ view, onView }: { view: Exclude<AgendaView, "discover" | "detail" | "confirm" | "confirmed">; onView: (view: AgendaView) => void }) {
  const isSoldOut = view === "soldout";
  const isCanceled = view === "canceled";
  const title = isSoldOut ? "Vagas esgotadas" : isCanceled ? "Evento cancelado" : "Não foi possível confirmar";
  const message = isSoldOut ? "As inscrições atingiram o limite." : isCanceled ? "O organizador cancelou este encontro." : "Consulte sua participação antes de tentar novamente.";
  return (
    <div className={cn("min-h-[100dvh] bg-territory-canvas px-4 pb-8 pt-5 text-territory-ink", AGENDA_RESET)}>
      <MobileHeader title="Agenda" onBack={() => onView("discover")} />
      <Surface className="mt-8 p-5 text-center">
        <span className={cn("mx-auto grid h-14 w-14 place-items-center rounded-full", isSoldOut ? "bg-[#fae7e1] text-[#a22b1f]" : isCanceled ? "bg-[#fff0ca] text-[#8a5500]" : "bg-[#e5eef0] text-territory-brand")}>
          {isSoldOut ? <UsersRound className="h-7 w-7" /> : isCanceled ? <CircleAlert className="h-7 w-7" /> : <X className="h-7 w-7" />}
        </span>
        <h1 className="mt-4 font-heading text-xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-territory-muted">{message}</p>
        <button type="button" onClick={() => onView(isCanceled ? "detail" : "discover")} className={cn("mt-5 min-h-11 w-full rounded-lg text-sm font-bold", isCanceled ? "bg-territory-sun" : "bg-territory-brand text-white")}>
          {isCanceled ? "Ver atualização" : isSoldOut ? "Ver outros eventos" : "Verificar participação"}
        </button>
      </Surface>
    </div>
  );
}

function DesktopRail({ onView }: { onView: (view: AgendaView) => void }) {
  const items: [string, ReactNode, AgendaView?][] = [
    ["Início", <Menu className="h-5 w-5" />],
    ["Comunidade", <UsersRound className="h-5 w-5" />],
    ["Agenda", <CalendarDays className="h-5 w-5" />, "discover"],
    ["Salvos", <Bookmark className="h-5 w-5" />],
    ["Conta", <UserRound className="h-5 w-5" />],
  ];
  return (
    <aside className="flex w-[13.5rem] shrink-0 flex-col bg-territory-brand px-3 py-5 text-white">
      <Brand light />
      <nav className="mt-8 space-y-1" aria-label="Navegação principal">
        {items.map(([label, icon, view]) => (
          <button
            key={label}
            type="button"
            onClick={() => view && onView(view)}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm",
              label === "Agenda" ? "bg-territory-sun font-bold text-territory-ink" : "text-white/85",
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-xl bg-white/10 p-3 text-xs text-white/75">
        <p className="font-semibold text-white">Aqui também é futuro</p>
        <p className="mt-1">Encontros que aproximam o território.</p>
      </div>
    </aside>
  );
}

function DesktopTopbar() {
  return (
    <header className="flex min-h-14 items-center justify-between border-b border-territory-border bg-territory-surface px-6">
      <button type="button" className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-5 w-5 text-territory-brand" />Complexo do Nordeste de Amaralina<ChevronDown className="h-4 w-4" /></button>
      <div className="flex items-center gap-4 text-sm"><Bell className="h-5 w-5 text-territory-brand" /><span className="grid h-8 w-8 place-items-center rounded-full bg-[#ead8c8]"><UserRound className="h-4 w-4 text-territory-brand" /></span><span>Ana Oliveira</span><ChevronDown className="h-4 w-4" /></div>
    </header>
  );
}

function DesktopEventList({ onView }: { onView: (view: AgendaView) => void }) {
  return (
    <aside className="min-w-0 border-r border-territory-border bg-territory-surface p-4">
      <div className="flex items-center justify-between"><b className="text-sm">3 eventos encontrados</b><button type="button" className="flex items-center gap-1 text-xs text-territory-muted">Mais próximos <ChevronDown className="h-3.5 w-3.5" /></button></div>
      <div className="mt-3 space-y-2">
        {events.map((event, index) => (
          <button type="button" key={event.title} onClick={() => onView(index === 0 ? "detail" : "discover")} className={cn("flex w-full items-center gap-3 rounded-lg border p-2 text-left", index === 0 ? "border-territory-sun ring-1 ring-territory-sun" : "border-territory-border")}>
            <img src={event.image} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1"><b className="block truncate text-sm">{event.title}</b><span className="mt-1 block text-xs text-territory-muted">{event.date.replace(" de 2026", "")} · {event.time}</span><span className="mt-1 block truncate text-xs text-territory-muted">{event.place} · {event.price}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-territory-brand" />
          </button>
        ))}
      </div>
    </aside>
  );
}

function DesktopEventDetail({ onView }: { onView: (view: AgendaView) => void }) {
  const event = events[0];
  return (
    <section className="min-w-0 bg-territory-surface">
      <img src={event.image} alt="" className="h-[10.5rem] w-full object-cover" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="font-heading text-2xl font-bold tracking-[-0.035em]">{event.title}</h2><p className="mt-1 text-sm text-territory-muted">Organizado por {event.organizer}</p></div><div className="flex shrink-0 gap-2"><button type="button" className="flex min-h-10 items-center gap-1 rounded-lg border border-territory-border px-3 text-sm font-semibold"><Bookmark className="h-4 w-4" /> Salvar</button><button type="button" className="flex min-h-10 items-center gap-1 rounded-lg border border-territory-border px-3 text-sm font-semibold"><Share2 className="h-4 w-4" /> Compartilhar</button><button type="button" onClick={() => onView("confirm")} className="min-h-10 rounded-lg bg-territory-sun px-5 text-sm font-bold">Participar</button></div></div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-territory-muted"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{event.date} · {event.time}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Espaço comunitário Santa Cruz</span></div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_13rem] gap-5"><div className="min-w-0"><div className="flex gap-7 border-b border-territory-border text-sm"><button type="button" className="border-b-2 border-territory-sun pb-2 font-bold">Sobre</button><button type="button" className="pb-2 text-territory-muted">Programação</button><button type="button" className="pb-2 text-territory-muted">Local</button><button type="button" className="pb-2 text-territory-muted">Dúvidas</button></div><p className="mt-4 text-sm text-territory-muted">Troque livros, histórias e indicações com pessoas da comunidade.</p><div className="mt-4 divide-y divide-territory-border rounded-xl border border-territory-border"><DisclosureRow icon={<Accessibility className="h-5 w-5" />} label="Acessibilidade e orientações" /><DisclosureRow icon={<ImageIcon className="h-5 w-5" />} label="Galeria" /></div></div><aside className="space-y-3"><Surface className="p-4"><b className="text-sm">Links úteis</b><button type="button" className="mt-3 flex items-center gap-2 text-sm text-blue-700"><ExternalLink className="h-4 w-4" />Ver evento completo</button><button type="button" className="mt-3 flex items-center gap-2 text-sm text-blue-700"><Navigation className="h-4 w-4" />Como chegar</button></Surface><Surface className="p-4"><b className="text-sm">Eventos semelhantes</b><button type="button" className="mt-3 flex items-center gap-2 text-sm text-blue-700"><CalendarDays className="h-4 w-4" />Ver eventos semelhantes</button></Surface></aside></div>
      </div>
    </section>
  );
}

function ParticipationStates({ onView }: { onView: (view: AgendaView) => void }) {
  return (
    <section className="border-t border-territory-border bg-territory-canvas px-8 py-5">
      <h2 className="font-heading text-lg font-bold">Estados de participação</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Surface className="bg-[#fff0ed] p-4"><div className="flex gap-3"><UsersRound className="h-7 w-7 shrink-0 text-[#a5241d]" /><div><b className="block text-sm text-[#8f211b]">Vagas esgotadas</b><p className="mt-1 text-xs">As inscrições atingiram o limite.</p><button type="button" onClick={() => onView("soldout")} className="mt-3 min-h-9 w-full rounded-lg bg-territory-brand px-3 text-xs font-bold text-white">Ver outros eventos</button></div></div></Surface>
        <Surface className="bg-[#fff5de] p-4"><div className="flex gap-3"><CircleAlert className="h-7 w-7 shrink-0 text-[#a5241d]" /><div><b className="block text-sm text-[#8f211b]">Evento cancelado</b><p className="mt-1 text-xs">O organizador cancelou este encontro.</p><button type="button" onClick={() => onView("canceled")} className="mt-3 min-h-9 w-full rounded-lg bg-territory-sun px-3 text-xs font-bold">Ver atualização</button></div></div></Surface>
        <Surface className="bg-[#edf3f4] p-4"><div className="flex gap-3"><CircleAlert className="h-7 w-7 shrink-0 text-territory-brand" /><div><b className="block text-sm">Não foi possível confirmar</b><p className="mt-1 text-xs">Consulte sua participação antes de tentar novamente.</p><button type="button" onClick={() => onView("error")} className="mt-3 min-h-9 w-full rounded-lg bg-territory-brand px-3 text-xs font-bold text-white">Verificar participação</button></div></div></Surface>
      </div>
    </section>
  );
}

function DesktopAgenda({ onView }: { onView: (view: AgendaView) => void }) {
  return (
    <div className={cn("min-h-[100dvh] bg-territory-canvas text-territory-ink", AGENDA_RESET)}>
      <DesktopTopbar />
      <main>
        <div className="border-b border-territory-border bg-territory-surface px-8 pb-4 pt-6"><h1 className="font-heading text-3xl font-bold tracking-[-0.045em]">O que acontece na comunidade</h1><p className="mt-1 text-sm text-territory-muted">Encontros, atividades, oficinas e muito mais por aqui.</p><div className="mt-4 flex items-center gap-3"><div className="w-[22rem]"><SearchBox compact /></div>{["Data", "Categoria", "Bairro", "Gratuito"].map((filter) => <button key={filter} type="button" className="flex min-h-10 items-center gap-2 rounded-lg border border-territory-border px-3 text-xs font-semibold">{filter}<ChevronDown className="h-3.5 w-3.5" /></button>)}<div className="ml-auto grid grid-cols-3 overflow-hidden rounded-lg border border-territory-border"><button type="button" className="flex min-h-10 items-center gap-1 bg-territory-sun px-3 text-xs font-bold"><List className="h-4 w-4" /> Lista</button><button type="button" className="flex min-h-10 items-center gap-1 border-l border-territory-border px-3 text-xs"><CalendarDays className="h-4 w-4" /> Calendário</button><button type="button" className="flex min-h-10 items-center gap-1 border-l border-territory-border px-3 text-xs"><Map className="h-4 w-4" /> Mapa</button></div></div></div>
        <div className="grid min-h-[28rem] grid-cols-[24rem_minmax(0,1fr)]"><DesktopEventList onView={onView} /><DesktopEventDetail onView={onView} /></div>
        <ParticipationStates onView={onView} />
      </main>
      <footer className="flex min-h-12 items-center justify-between bg-territory-brand px-8 text-xs text-white/75"><Brand light /><span>Conceito proposto · Conteúdo demonstrativo · Inscrições e disponibilidade validadas no servidor</span><span>Salvador · BA</span></footer>
    </div>
  );
}

function DesktopState({ view, onView }: { view: Exclude<AgendaView, "discover" | "detail" | "confirm" | "confirmed">; onView: (view: AgendaView) => void }) {
  const isSoldOut = view === "soldout";
  const isCanceled = view === "canceled";
  const title = isSoldOut ? "Vagas esgotadas" : isCanceled ? "Evento cancelado" : "Não foi possível confirmar";
  const message = isSoldOut ? "As inscrições atingiram o limite." : isCanceled ? "O organizador cancelou este encontro. Consulte as orientações para participantes." : "Consulte sua participação antes de tentar novamente.";
  return (
    <div className={cn("min-h-[calc(100dvh-3.5rem)] bg-territory-canvas p-8", AGENDA_RESET)}>
      <button type="button" onClick={() => onView("discover")} className="flex items-center gap-2 text-sm font-semibold text-territory-brand"><ArrowLeft className="h-4 w-4" /> Voltar à agenda</button>
      <Surface className={cn("mx-auto mt-16 max-w-xl p-10 text-center", isSoldOut ? "bg-[#fff0ed]" : isCanceled ? "bg-[#fff5de]" : "bg-[#edf3f4]")}>
        {isSoldOut ? <UsersRound className="mx-auto h-12 w-12 text-[#a5241d]" /> : isCanceled ? <CircleAlert className="mx-auto h-12 w-12 text-[#a5241d]" /> : <CircleAlert className="mx-auto h-12 w-12 text-territory-brand" />}
        <h1 className="mt-4 font-heading text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-territory-muted">{message}</p>
        <button type="button" onClick={() => onView(isCanceled ? "detail" : "discover")} className={cn("mt-6 min-h-11 rounded-lg px-6 text-sm font-bold", isCanceled ? "bg-territory-sun" : "bg-territory-brand text-white")}>{isCanceled ? "Ver atualização" : isSoldOut ? "Ver outros eventos" : "Verificar participação"}</button>
      </Surface>
    </div>
  );
}

function DesktopShell({ view, onView }: { view: AgendaView; onView: (view: AgendaView) => void }) {
  const stateView = view === "soldout" || view === "canceled" || view === "error";
  return (
    <div className={cn("hidden min-h-[100dvh] lg:flex", AGENDA_RESET)}>
      <DesktopRail onView={onView} />
      <div className="min-w-0 flex-1">{stateView ? <><DesktopTopbar /><DesktopState view={view} onView={onView} /></> : <DesktopAgenda onView={onView} />}</div>
    </div>
  );
}

export default function AgendaEventosConceptMockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [view, setView] = useState<AgendaView>(getRequestedView(location.search) ?? "discover");

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const next = getRequestedView(location.search) ?? "discover";
    setView(next);
  }, [location.search]);

  const onView = (next: AgendaView) => {
    setView(next);
    navigate(route(next), { replace: true });
  };

  let mobileBody: ReactNode;
  if (view === "discover" || view === "detail" || view === "confirm" || view === "confirmed") {
    mobileBody = view === "discover" ? <MobileDiscover onView={onView} /> : view === "detail" ? <MobileDetail onView={onView} /> : view === "confirm" ? <ConfirmView onView={onView} /> : <ConfirmedView onView={onView} />;
  } else {
    mobileBody = <MobileState view={view} onView={onView} />;
  }

  return (
    <>
      <Helmet><title>Agenda e eventos da comunidade | Achegue-se</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      {isDesktop ? <DesktopShell view={view} onView={onView} /> : mobileBody}
    </>
  );
}
