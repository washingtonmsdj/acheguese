import { useMemo, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bike,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CloudOff,
  FileText,
  History,
  Home,
  Info,
  MapPin,
  MoreHorizontal,
  Receipt,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import driverAvatar from "@/assets/professional-concept/joao-santos.png";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type GainsView = "summary" | "history" | "detail" | "delivery-detail" | "review" | "receipts";
type GainsState = "default" | "pending" | "confirmed" | "empty" | "error";

const DAILY_VALUES = [
  { day: "Seg", value: 20 },
  { day: "Ter", value: 25 },
  { day: "Qua", value: 15 },
  { day: "Qui", value: 30 },
  { day: "Sex", value: 20 },
  { day: "Sáb", value: 25 },
  { day: "Dom", value: 15 },
];

const DELIVERIES = [
  { id: "#1042", origin: "Sabores da Ana", value: "R$ 7,00", time: "12:46" },
  { id: "#1038", origin: "Mercado da Praça", value: "R$ 8,00", time: "11:30" },
];

const NAV_ITEMS: Array<{ label: string; icon: LucideIcon; target?: string }> = [
  { label: "Início", icon: Home, target: "/central/motoboy?concept-mock=1&state=overview" },
  { label: "Entregas", icon: Bike, target: "/central/motoboy?concept-mock=1&state=delivery&phase=delivery" },
  { label: "Ganhos", icon: BarChart3 },
  { label: "Disponibilidade", icon: Clock3, target: "/central/motoboy?concept-mock=1&state=availability" },
  { label: "Perfil e veículo", icon: UserRound, target: "/central/motoboy/cadastro?concept-mock=1&step=4" },
  { label: "Configurações", icon: Settings2 },
  { label: "Ajuda", icon: CircleHelp },
];

function Brand() {
  return <span className="font-heading text-[1.05rem] font-extrabold tracking-[-0.04em] text-white">achegue-se<span className="text-territory-sun">.</span></span>;
}

function ProfileChip({ dark = false }: { dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", dark ? "text-white" : "text-territory-ink")}>
      <img src={driverAvatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/70" />
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-xs font-bold">Carlos Santos</span>
        <span className={cn("block text-[0.62rem]", dark ? "text-white/70" : "text-territory-muted")}>Motoboy</span>
      </span>
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

function DesktopSidebar({ navigate }: { navigate: (to: string) => void }) {
  return (
    <aside className="hidden min-h-0 w-[clamp(10.25rem,16vw,14rem)] shrink-0 flex-col bg-[#064f4d] px-3 py-5 md:flex">
      <div className="px-3 pb-7"><Brand /></div>
      <nav className="space-y-1" aria-label="Navegação do entregador">
        {NAV_ITEMS.map(({ label, icon: Icon, target }) => (
          <button
            key={label}
            type="button"
            onClick={() => target ? navigate(target) : label === "Ganhos" ? undefined : toast.info("Esta área ficará disponível em breve.")}
            className={cn(
              "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-semibold transition-colors",
              label === "Ganhos" ? "bg-territory-sun text-territory-ink" : "text-white/85 hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto px-3 text-[0.62rem] leading-tight text-white/60">
        Mais entregas.<br />Mais oportunidades<br />para a sua jornada.
        <div className="mt-2 h-1 w-8 rounded-full bg-territory-sun" />
      </div>
    </aside>
  );
}

function DesktopShell({ children, navigate }: { children: ReactNode; navigate: (to: string) => void }) {
  return (
    <div className="driver-earnings-concept-page hidden h-dvh min-h-0 overflow-hidden bg-[#fbfcfb] text-territory-ink md:flex">
      <DesktopSidebar navigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-territory-border bg-white px-5 lg:px-8">
          <ProfileChip />
        </header>
        <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-8 lg:py-5">{children}</main>
      </div>
    </div>
  );
}

function DesktopTitle({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-4 border-b border-territory-border pb-3">
      <div>
        <h1 className="font-heading text-[clamp(1.25rem,1.8vw,1.8rem)] font-extrabold tracking-[-0.04em]">{title}</h1>
        <p className="mt-0.5 text-xs text-territory-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function PeriodTabs({ active = "7 dias", compact = false }: { active?: string; compact?: boolean }) {
  return (
    <div className={cn("grid grid-cols-4 gap-1 rounded-lg bg-[#eef2f3] p-1", compact ? "w-full" : "w-[18rem]")}>
      {["Hoje", "7 dias", "Mês", "Total"].map((period) => (
        <button key={period} type="button" className={cn("rounded-md px-2 py-1.5 text-xs font-semibold", period === active ? "bg-territory-sun text-territory-ink shadow-sm" : "text-territory-muted hover:bg-white")}>
          {period}
        </button>
      ))}
    </div>
  );
}

function DateRange({ label = "07 – 13 set. 2026" }: { label?: string }) {
  return <button type="button" className="flex items-center gap-2 text-xs font-semibold text-territory-ink"><CalendarDays className="h-4 w-4" aria-hidden="true" />{label}<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>;
}

function DailyBars({ mobile = false, stretch = false }: { mobile?: boolean; stretch?: boolean }) {
  return (
    <div className={cn("flex items-end justify-between gap-2", stretch ? "h-full min-h-44" : mobile ? "h-[15rem]" : "h-44")}>
      {DAILY_VALUES.map(({ day, value }) => (
        <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[0.65rem] font-bold text-territory-ink">{value}</span>
          <div className="flex w-full flex-1 items-end justify-center">
            <div className={cn("w-full max-w-8 rounded-t-md", mobile ? "bg-territory-brand min-h-4" : "bg-territory-sun min-h-5")} style={{ height: `${(value / 30) * 100}%` }} />
          </div>
          <span className="text-[0.65rem] text-territory-muted">{day}</span>
        </div>
      ))}
    </div>
  );
}

function Notice({ children, tone = "blue", className }: { children: ReactNode; tone?: "blue" | "yellow" | "green"; className?: string }) {
  const toneClass = tone === "yellow" ? "bg-[#fff3d4] text-[#815b00]" : tone === "green" ? "bg-[#e4f7ed] text-[#08734e]" : "bg-[#edf5fa] text-[#234d73]";
  return <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs", toneClass, className)}><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{children}</span></div>;
}

function ActionButton({ children, variant = "primary", onClick, className }: { children: ReactNode; variant?: "primary" | "outline" | "danger"; onClick?: () => void; className?: string }) {
  return <Button type="button" onClick={onClick} className={cn("h-10 rounded-lg px-4 text-xs font-bold", variant === "primary" ? "bg-territory-sun text-territory-ink hover:bg-territory-sun/85" : variant === "danger" ? "bg-[#d6384d] text-white hover:bg-[#c52c41]" : "border border-territory-border bg-white text-territory-ink hover:bg-territory-surface", className)}>{children}</Button>;
}

function DesktopSummary({ state, onView }: { state: GainsState; onView: (view: GainsView) => void }) {
  const isEmpty = state === "empty";
  const isError = state === "error";
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <DesktopTitle title="Meus ganhos" subtitle="Acompanhe seus valores registrados e entregas concluídas.">
        <div className="flex items-center gap-5"><PeriodTabs /><DateRange /></div>
      </DesktopTitle>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-white p-4 shadow-sm">
          {isError ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
              <CloudOff className="h-12 w-12 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-lg font-bold">Não foi possível carregar os ganhos</h2>
              <p className="mt-1 max-w-sm text-xs text-territory-muted">Os valores estão temporariamente indisponíveis.</p>
              <ActionButton className="mt-5" onClick={() => toast.success("Tentando carregar novamente...")}>Tentar novamente</ActionButton>
            </div>
          ) : isEmpty ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
              <Receipt className="h-12 w-12 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-lg font-bold">Nenhum registro neste período</h2>
              <p className="mt-1 text-xs text-territory-muted">Escolha outro período para consultar seu histórico.</p>
              <ActionButton className="mt-5" onClick={() => toast.info("Seletor de período aberto.")}>Alterar período</ActionButton>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between"><div><p className="text-sm font-bold">Valores registrados</p><p className="mt-1 font-heading text-4xl font-extrabold tracking-[-0.05em]">R$ 150,00</p></div><BarChart3 className="h-8 w-8 text-territory-brand" aria-hidden="true" /></div>
              <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-lg bg-[#fbfcfc] p-3"><div className="min-h-0 flex-1"><DailyBars stretch /></div><p className="mt-2 text-center text-[0.68rem] text-territory-muted">Últimos 7 dias</p></div>
            </>
          )}
        </section>
        <aside className="flex min-h-0 flex-col gap-3">
          <div className="rounded-xl border border-territory-border bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-territory-muted">Hoje</p><p className="mt-1 font-heading text-2xl font-extrabold">R$ 15,00</p></div>
          <button type="button" onClick={() => toast.info("Configurações da operação ficarão disponíveis em breve.")} className="flex items-center justify-between rounded-xl border border-territory-border bg-white p-4 text-left text-xs font-semibold shadow-sm">Configurações da operação<ArrowRight className="h-4 w-4" /></button>
          <Notice tone="yellow">Valores registrados não confirmam recebimento.</Notice>
          <ActionButton className="mt-auto w-full" onClick={() => onView("history")}>Ver histórico</ActionButton>
        </aside>
      </div>
    </div>
  );
}

function DesktopHistory({ onView }: { onView: (view: GainsView) => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <DesktopTitle title="Histórico de valores" subtitle="Consulte cada entrega e o valor registrado."><DateRange label="Hoje / 13 set. 2026" /></DesktopTitle>
      <div className="flex shrink-0 gap-3"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-territory-border bg-white px-3 py-2 text-xs text-territory-muted"><Search className="h-4 w-4" />Buscar entrega</div><button type="button" className="flex w-44 items-center justify-between rounded-lg border border-territory-border bg-white px-3 py-2 text-xs">Todas as situações<ChevronDown className="h-4 w-4" /></button></div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-h-0 overflow-hidden rounded-xl border border-territory-border bg-white shadow-sm"><div className="grid grid-cols-[0.8fr_1.4fr_0.7fr_1fr] border-b bg-[#f0f5f5] px-4 py-3 text-[0.68rem] font-bold text-territory-muted"><span>Entrega</span><span>Origem</span><span>Valor</span><span>Recebimento</span></div>{DELIVERIES.map((row, index) => <button type="button" key={row.id} onClick={() => index === 0 ? onView("delivery-detail") : undefined} className={cn("grid w-full grid-cols-[0.8fr_1.4fr_0.7fr_1fr] px-4 py-3 text-left text-xs", index === 0 ? "bg-[#edf6ff]" : "border-t border-territory-border") }><span className="font-semibold">{row.id}</span><span>{row.origin}</span><span>{row.value}</span><span className="text-blue-700">Não informado</span></button>)}<div className="border-t px-4 py-3 text-xs font-bold">2 entregas · R$ 15,00</div></section>
        <aside className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-heading text-xl font-extrabold">#1042</h2><span className="rounded-full bg-[#d9f6e5] px-2.5 py-1 text-[0.68rem] font-bold text-[#08734e]">Entregue</span></div><p className="mt-1 text-xs text-territory-muted">13 set. 2026 · 12:46</p><div className="mt-5 border-t pt-4"><p className="text-xs">Valor registrado</p><p className="font-heading text-3xl font-extrabold">R$ 7,00</p></div><Notice tone="yellow" className="mt-4">Recebimento não informado.</Notice><div className="mt-4 border-t pt-4 text-xs"><p className="font-bold">Composição</p><p className="mt-1 text-territory-muted">Detalhamento não disponível.</p></div><button type="button" onClick={() => toast.info("Comprovante de entrega aberto.")} className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700"><FileText className="h-4 w-4" />Ver comprovante de entrega</button><ActionButton className="mt-auto w-full" onClick={() => onView("review")}>Solicitar revisão</ActionButton></aside>
      </div>
    </div>
  );
}

function DesktopDetail({ state, onView }: { state: GainsState; onView: (view: GainsView) => void }) {
  const confirmed = state === "confirmed";
  return <div className="flex h-full min-h-0 flex-col gap-4"><DesktopTitle title="Entrega #1042" subtitle="Sabores da Ana · 13 set. 2026 · 12:46"><span className="rounded-full bg-[#d9f6e5] px-3 py-1.5 text-xs font-bold text-[#08734e]">Entregue</span></DesktopTitle><div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className="min-h-0 overflow-hidden rounded-xl border border-territory-border bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b pb-4"><div><p className="text-sm font-bold">Sabores da Ana</p><p className="text-xs text-territory-muted">Entrega concluída às 12:46</p></div><p className="font-heading text-2xl font-extrabold">R$ 7,00</p></div><div className="grid gap-4 border-b py-5 sm:grid-cols-2"><div className="flex gap-3"><MapPin className="h-5 w-5 text-emerald-600" /><div><p className="text-xs font-bold">Coleta</p><p className="mt-1 text-xs text-territory-muted">Santa Cruz, Salvador – BA</p></div></div><div className="flex gap-3"><MapPin className="h-5 w-5 text-amber-500" /><div><p className="text-xs font-bold">Destino</p><p className="mt-1 text-xs text-territory-muted">Nordeste de Amaralina, Salvador – BA</p></div></div></div><div className="border-b py-4"><p className="text-xs font-bold">Recebimento</p><p className="mt-1 text-sm font-bold">{confirmed ? "Confirmado" : "Não informado"}</p><p className="mt-1 text-xs text-territory-muted">{confirmed ? "Recebimento confirmado em 14 set. 2026." : "Não há confirmação financeira vinculada."}</p></div><div className="py-4"><p className="text-xs font-bold">Composição do valor</p><p className="mt-1 text-xs text-territory-muted">Detalhamento não disponível</p></div><div className="mt-auto flex flex-wrap gap-3"><button type="button" onClick={() => toast.info("Comprovante de entrega aberto.")} className="flex items-center gap-2 text-xs font-semibold text-blue-700"><FileText className="h-4 w-4" />Ver pedido e comprovante de entrega</button><button type="button" onClick={() => toast.info("Histórico aberto.")} className="flex items-center gap-2 text-xs font-semibold text-blue-700"><History className="h-4 w-4" />Histórico de alterações</button></div></section><aside className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-white p-4 shadow-sm"><p className="text-xs font-bold">Valor registrado</p><p className="mt-1 font-heading text-3xl font-extrabold">R$ 7,00</p><Notice tone={confirmed ? "green" : "yellow"} className="mt-4">{confirmed ? "Recebimento confirmado." : "Recebimento não informado."}</Notice><button type="button" onClick={() => onView("review")} className="mt-auto flex h-10 items-center justify-center rounded-lg bg-territory-sun text-xs font-bold text-territory-ink">Solicitar revisão<ArrowRight className="ml-2 h-4 w-4" /></button></aside></div></div>;
}

function Timeline({ compact = false }: { compact?: boolean }) {
  const items = ["Solicitação recebida", "Análise", "Resposta"];
  return <div className={cn("relative", compact ? "space-y-2" : "space-y-3")}>{items.map((item, index) => <div key={item} className="relative flex items-center gap-3 text-xs"><span className={cn("z-10 flex h-5 w-5 items-center justify-center rounded-full border-2", index === 0 ? "border-territory-brand bg-territory-brand text-white" : index === 1 ? "border-territory-sun bg-territory-sun text-territory-ink" : "border-slate-300 bg-white text-slate-400")}>{index === 0 ? <Check className="h-3 w-3" /> : index + 1}</span><span className={cn(index === 1 && "font-bold")}>{item}</span>{index === 0 ? <span className="ml-auto text-territory-muted">13 set.</span> : null}</div>)}</div>;
}

function DesktopReview({ onView }: { onView: (view: GainsView) => void }) {
  return <div className="flex h-full min-h-0 flex-col gap-4"><DesktopTitle title="Minhas solicitações" subtitle="Acompanhe suas revisões de valores e o retorno da operação." /><div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className="min-h-0 overflow-hidden rounded-xl border border-territory-border bg-white shadow-sm"><div className="grid grid-cols-[1fr_1fr_1.1fr_0.8fr] border-b bg-[#f0f5f5] px-4 py-3 text-[0.68rem] font-bold text-territory-muted"><span>Protocolo</span><span>Entrega</span><span>Motivo</span><span>Status</span></div><div className="grid grid-cols-[1fr_1fr_1.1fr_0.8fr] bg-[#edf6ff] px-4 py-3 text-xs"><span>#RV1042</span><span>#1042</span><span>Valor diferente</span><span><span className="rounded-full bg-[#fff0b9] px-2 py-1 text-[0.65rem] font-bold">Em análise</span></span></div></section><aside className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-white p-4 shadow-sm"><h2 className="font-heading text-lg font-extrabold">Revisão de valor</h2><p className="mt-1 text-xs text-territory-muted">Entrega #1042</p><p className="mt-4 text-xs font-bold">Motivo da solicitação</p><div className="mt-2 rounded-lg bg-[#edf5fa] p-3 text-xs">O valor registrado difere da oferta que aceitei.</div><div className="my-5"><Timeline compact /></div><Notice tone="yellow">O valor permanece R$ 7,00 até a conclusão da análise.</Notice><button type="button" onClick={() => toast.info("Suporte aberto.")} className="mt-auto flex items-center gap-2 text-xs font-semibold text-blue-700"><CircleHelp className="h-4 w-4" />Falar com suporte</button><button type="button" onClick={() => onView("history")} className="mt-3 text-left text-xs font-semibold text-territory-muted">Voltar ao histórico</button></aside></div></div>;
}

function DesktopReceipts() {
  return <div className="flex h-full min-h-0 flex-col gap-4"><DesktopTitle title="Recebimentos" subtitle="Acompanhe a evolução financeira das suas entregas."><DateRange label="13 – 14 set. 2026" /></DesktopTitle><Notice tone="yellow">Cenário futuro com integração financeira habilitada.</Notice><div className="grid shrink-0 grid-cols-2 gap-4"><div className="rounded-xl border border-territory-border bg-white p-4"><p className="text-xs">Confirmado</p><p className="mt-1 font-heading text-2xl font-extrabold">R$ 7,00</p></div><div className="rounded-xl border border-territory-border bg-white p-4"><p className="text-xs">Pendente</p><p className="mt-1 font-heading text-2xl font-extrabold">R$ 8,00</p></div></div><section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-territory-border bg-white shadow-sm"><div className="grid grid-cols-[1fr_1fr_1fr_1.5fr] border-b bg-[#f0f5f5] px-4 py-3 text-[0.68rem] font-bold"><span>Entrega</span><span>Valor</span><span>Situação</span><span>Detalhes</span></div>{DELIVERIES.map((row) => <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1.5fr] border-b px-4 py-3 text-xs"><span>{row.id}</span><span>{row.value}</span><span className="text-territory-muted">Não informado</span><span className="text-blue-700">Ver detalhes</span></div>)}<Notice tone="yellow" className="m-4">Previsão de repasse: ainda não informada.</Notice></section></div>;
}

function MobileBottomNav({ navigate }: { navigate: (to: string) => void }) {
  const items = [
    { label: "Início", icon: Home, target: "/central/motoboy?concept-mock=1&state=overview" },
    { label: "Entregas", icon: Bike, target: "/central/motoboy?concept-mock=1&state=delivery&phase=delivery" },
    { label: "Ganhos", icon: BarChart3 },
    { label: "Perfil", icon: UserRound, target: "/central/motoboy/cadastro?concept-mock=1&step=4" },
  ];
  return <nav className="absolute inset-x-0 bottom-0 z-20 grid h-16 grid-cols-4 border-t border-territory-border bg-white/95 px-2 backdrop-blur" aria-label="Navegação inferior">{items.map(({ label, icon: Icon, target }) => <button key={label} type="button" onClick={() => target && navigate(target)} className={cn("flex flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold", label === "Ganhos" ? "text-territory-brand" : "text-territory-muted") }><Icon className="h-5 w-5" /><span>{label}</span>{label === "Ganhos" ? <span className="h-1 w-1 rounded-full bg-territory-sun" /> : <span className="h-1" />}</button>)}</nav>;
}

function MobileHero({ view, title, subtitle }: { view: GainsView; title: string; subtitle?: string }) {
  return <header className={cn("shrink-0 bg-[#064f4d] text-white", view === "summary" ? "rounded-b-[1.8rem] px-4 pb-4 pt-4" : "px-4 pb-4 pt-3")}><div className="flex items-center justify-between">{view === "summary" ? <div className="flex items-center gap-3"><img src={driverAvatar} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/80" /><div><h1 className="font-heading text-xl font-extrabold tracking-[-0.04em]">Meus ganhos</h1><p className="text-xs text-white/75">Carlos Santos · Motoboy</p></div></div> : <><button type="button" className="rounded-full p-1" onClick={() => window.history.back()}><ArrowLeft className="h-6 w-6" /></button><div className="text-center"><h1 className="font-heading text-lg font-extrabold">{title}</h1>{subtitle ? <p className="text-xs text-white/75">{subtitle}</p> : null}</div><button type="button" onClick={() => toast.info("Mais opções ficarão disponíveis em breve.")}><MoreHorizontal className="h-6 w-6" /></button></>}</div>{view === "summary" ? <p className="mt-3 text-sm font-semibold">Acompanhe seus valores registrados</p> : null}</header>;
}

function MobileSummary({ state, onView }: { state: GainsState; onView: (view: GainsView) => void }) {
  const isEmpty = state === "empty";
  const isError = state === "error";
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="summary" title="Meus ganhos" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-2.5"><PeriodTabs active={state === "empty" || state === "error" ? "Hoje" : "7 dias"} compact /><div className="flex items-center justify-between px-1 text-xs"><button type="button" className="p-1 text-territory-muted">‹</button><span className="font-semibold">{state === "empty" || state === "error" ? "14 set. 2026" : "07 – 13 set. 2026"}</span><button type="button" className="p-1 text-territory-muted">›</button></div>{isError ? <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-territory-border bg-white p-4 text-center"><CloudOff className="h-11 w-11 text-slate-400" /><h2 className="mt-3 font-heading text-lg font-extrabold">Não foi possível carregar os ganhos</h2><p className="mt-1 text-xs text-territory-muted">Os valores estão temporariamente indisponíveis.</p><ActionButton className="mt-4 w-full" onClick={() => toast.success("Tentando carregar novamente...")}>Tentar novamente</ActionButton><button type="button" onClick={() => toast.info("Suporte aberto.")} className="mt-3 text-xs font-semibold text-blue-700">Falar com suporte</button></section> : isEmpty ? <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-territory-border bg-white p-4 text-center"><Receipt className="h-11 w-11 text-slate-400" /><h2 className="mt-3 font-heading text-lg font-extrabold">Nenhum registro neste período</h2><p className="mt-1 text-xs text-territory-muted">Escolha outro período para consultar seu histórico.</p><ActionButton className="mt-4 w-full" onClick={() => toast.info("Seletor de período aberto.")}>Alterar período</ActionButton></section> : <><section className="min-h-0 flex-1 rounded-xl border border-territory-border bg-white p-3"><div className="flex items-start justify-between"><div><p className="text-xs font-bold">Valores registrados</p><p className="mt-1 font-heading text-3xl font-extrabold">R$ 150,00</p><p className="text-[0.68rem] text-territory-muted">Referentes às entregas concluídas.</p></div><BarChart3 className="h-7 w-7 text-territory-brand" /></div><div className="mt-3"><DailyBars mobile /></div></section><Notice tone="yellow">Registro de valor não confirma recebimento.</Notice><ActionButton className="w-full" onClick={() => onView("history")}>Ver histórico</ActionButton><button type="button" onClick={() => toast.info("Configurações da operação ficarão disponíveis em breve.")} className="flex h-8 items-center gap-2 px-1 text-xs font-semibold"><Settings2 className="h-4 w-4" />Configurações da operação<ArrowRight className="ml-auto h-4 w-4" /></button></>}</div></div></div>;
}

function MobileHistory({ onView }: { onView: (view: GainsView) => void }) {
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="history" title="Histórico de valores" subtitle="Carlos Santos · Motoboy" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-2.5"><PeriodTabs active="Hoje" compact /><div className="flex items-center justify-between rounded-lg border border-territory-border bg-white px-3 py-2 text-xs"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />13 set. 2026</span><ChevronDown className="h-4 w-4" /></div><div className="flex items-center gap-2 rounded-lg border border-territory-border bg-white px-3 py-2 text-xs text-territory-muted"><Search className="h-4 w-4" />Buscar entrega</div><p className="px-1 text-sm font-bold">2 entregas · R$ 15,00</p><div className="min-h-0 flex-1 space-y-2 overflow-hidden">{DELIVERIES.map((row) => <button type="button" key={row.id} onClick={() => row.id === "#1042" && onView("delivery-detail")} className="flex w-full items-center justify-between rounded-xl border border-territory-border bg-white p-3 text-left"><div><p className="text-xs font-bold">{row.id} · {row.origin}</p><p className="mt-1 text-[0.68rem] text-territory-muted">Concluída às {row.time}</p><span className="mt-2 inline-flex rounded-md bg-[#edf5fa] px-2 py-1 text-[0.62rem] text-territory-muted">Recebimento não informado</span></div><div className="flex items-center gap-2 font-heading font-extrabold">{row.value}<ArrowRight className="h-4 w-4" /></div></button>)}</div><Notice>O valor registrado e o recebimento são situações separadas.</Notice></div></div></div>;
}

function MobileDeliveryDetail({ onView }: { onView: (view: GainsView) => void }) {
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="delivery-detail" title="Entrega #1042" subtitle="Carlos Santos · Motoboy" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-2"><section className="rounded-xl border border-territory-border bg-white p-2.5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">Sabores da Ana</p><p className="text-xs text-territory-muted">13 set. 2026 · 12:46</p></div><span className="rounded-full bg-[#baf0d1] px-2.5 py-1 text-[0.68rem] font-bold text-[#08734e]">Entregue</span></div><div className="mt-2 border-t pt-2"><p className="text-xs text-territory-muted">Valor registrado</p><p className="font-heading text-3xl font-extrabold">R$ 7,00</p></div></section><section className="rounded-xl border border-territory-border bg-white p-2.5"><div className="flex gap-2.5"><MapPin className="h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-xs font-bold">Coleta</p><p className="text-xs text-territory-muted">Santa Cruz, Salvador – BA</p></div></div><div className="mt-2.5 flex gap-2.5 border-t pt-2.5"><MapPin className="h-5 w-5 shrink-0 text-amber-500" /><div><p className="text-xs font-bold">Destino</p><p className="text-xs text-territory-muted">Nordeste de Amaralina, Salvador – BA</p></div></div></section><section className="rounded-xl border border-territory-border bg-white p-2.5"><p className="text-xs font-bold">Recebimento</p><p className="mt-0.5 text-sm font-bold">Não confirmado</p><p className="mt-0.5 text-xs text-territory-muted">Não há confirmação financeira vinculada.</p></section><section className="rounded-xl border border-territory-border bg-white p-2.5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold">Composição do valor</p><p className="mt-0.5 text-xs text-territory-muted">Detalhamento não disponível</p></div><FileText className="h-5 w-5 text-territory-muted" /></div><button type="button" onClick={() => toast.info("Detalhamento não disponível neste conceito.")} className="mt-1.5 text-xs font-semibold text-blue-700">Entender este valor</button></section><div className="mt-auto space-y-1.5"><button type="button" onClick={() => toast.info("Comprovante de entrega aberto.")} className="flex w-full items-center justify-between px-1 py-1.5 text-[0.7rem] font-semibold text-blue-700"><span className="flex items-center gap-2"><FileText className="h-4 w-4" />Ver pedido e comprovante de entrega</span><ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => toast.info("Histórico aberto.")} className="flex w-full items-center justify-between px-1 py-1.5 text-[0.7rem] font-semibold text-blue-700"><span className="flex items-center gap-2"><History className="h-4 w-4" />Histórico de alterações</span><ArrowRight className="h-4 w-4" /></button><ActionButton className="w-full" onClick={() => onView("review")}>Solicitar revisão</ActionButton></div></div></div></div>;
}

function MobileDetail({ state, onView }: { state: GainsState; onView: (view: GainsView) => void }) {
  const confirmed = state === "confirmed";
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="detail" title="Recebimento da entrega" subtitle="#1042 · Sabores da Ana" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-2.5"><section className="rounded-xl border border-territory-border bg-white p-3"><p className="text-xs text-territory-muted">Valor destinado ao entregador</p><p className="mt-1 font-heading text-3xl font-extrabold">R$ 7,00</p><div className={cn("mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold", confirmed ? "bg-[#baf0d1] text-[#08734e]" : "bg-[#fff0b9] text-[#815b00]")}>{confirmed ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />} {confirmed ? "Recebimento confirmado" : "Recebimento não confirmado"}</div>{confirmed ? <p className="mt-2 text-center text-xs text-territory-muted">Confirmado em 14 set. 2026 · 10:30</p> : null}</section>{confirmed ? <section className="rounded-xl border border-territory-border bg-white p-3"><h2 className="text-sm font-bold">Composição</h2><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span>Valor da entrega</span><span>R$ 7,00</span></div><div className="flex justify-between"><span>Ajustes</span><span>R$ 0,00</span></div><div className="flex justify-between border-t pt-2 font-bold"><span>Total confirmado</span><span>R$ 7,00</span></div></div></section> : <section className="rounded-xl border border-territory-border bg-white p-3"><div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-territory-brand" /><div><p className="text-xs font-bold">Entrega concluída</p><p className="text-[0.68rem] text-territory-muted">14 set. 2026 · 10:12</p></div></div><div className="mt-3 flex items-center gap-3"><Clock3 className="h-6 w-6 text-territory-sun" /><div><p className="text-xs font-bold">Repasse aguardando</p><p className="text-[0.68rem] text-territory-muted">Em processamento</p></div></div><div className="mt-3 flex items-center gap-3 border-t pt-3"><CalendarDays className="h-5 w-5 text-territory-muted" /><div><p className="text-xs font-bold">Previsão</p><p className="text-[0.68rem] text-territory-muted">Ainda não informada</p></div></div></section>}<div className="space-y-1.5 rounded-xl border border-territory-border bg-white p-1.5"><button type="button" onClick={() => toast.info("Composição aberta.")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-xs"><span className="flex items-center gap-2"><Receipt className="h-4 w-4" />{confirmed ? "Comprovante financeiro" : "Ver composição do valor"}</span><ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => toast.info("Comprovante de entrega aberto.")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-xs"><span className="flex items-center gap-2"><FileText className="h-4 w-4" />Ver comprovante de entrega</span><ArrowRight className="h-4 w-4" /></button>{confirmed ? <button type="button" onClick={() => onView("review")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-xs"><span className="flex items-center gap-2"><CircleHelp className="h-4 w-4" />Solicitar revisão</span><ArrowRight className="h-4 w-4" /></button> : null}</div>{confirmed ? null : <Notice>A conclusão da entrega não confirma o pagamento.</Notice>}{confirmed ? null : <><ActionButton className="mt-auto w-full" onClick={() => toast.info("Histórico financeiro aberto.")}>Ver histórico financeiro</ActionButton><ActionButton variant="outline" className="w-full" onClick={() => toast.info("Suporte aberto.")}>Preciso de ajuda</ActionButton></>}</div></div></div>;
}

function MobileReview({ onView }: { onView: (view: GainsView) => void }) {
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="review" title="Solicitar revisão" subtitle="Carlos Santos · Motoboy" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-2.5"><div className="flex items-center justify-between border-b pb-3 text-xs"><span><b>#1042</b> · Sabores da Ana<br /><span className="text-territory-muted">13 set. 2026 · 12:46</span></span><b>R$ 7,00</b></div><label className="text-xs font-bold">Motivo <span className="text-red-600">*</span><select className="mt-1 h-10 w-full rounded-lg border border-territory-border bg-white px-3 font-normal"><option>Valor diferente do combinado</option></select></label><label className="text-xs font-bold">Descreva o problema <span className="text-red-600">*</span><textarea className="mt-1 h-20 w-full resize-none rounded-lg border border-territory-border bg-white p-3 font-normal" defaultValue="O valor registrado difere da oferta que aceitei." /></label><div><p className="text-xs font-bold">Adicionar comprovante <span className="font-normal text-territory-muted">(opcional)</span></p><button type="button" onClick={() => toast.info("Seletor de arquivo aberto.")} className="mt-1 flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-territory-border bg-white text-xs text-territory-muted"><FileText className="h-5 w-5" />Toque para adicionar um arquivo</button></div><Notice>A solicitação será analisada. O valor não muda automaticamente.</Notice><ActionButton className="mt-auto w-full" onClick={() => toast.success("Solicitação enviada.")}>Enviar solicitação</ActionButton><ActionButton variant="outline" className="w-full" onClick={() => onView("delivery-detail")}>Voltar</ActionButton></div></div></div>;
}

function MobileReceipts() {
  return <div className="flex h-full min-h-0 flex-col"><MobileHero view="receipts" title="Recebimentos" subtitle="Carlos Santos · Motoboy" /><div className="min-h-0 flex-1 overflow-hidden bg-[#fbfcfb] px-3 pb-[4.25rem] pt-3"><div className="flex h-full min-h-0 flex-col gap-3"><Notice tone="yellow">Cenário futuro com integração financeira habilitada.</Notice><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-territory-border bg-white p-3"><p className="text-xs">Confirmado</p><p className="mt-1 font-heading text-xl font-extrabold">R$ 7,00</p></div><div className="rounded-xl border border-territory-border bg-white p-3"><p className="text-xs">Pendente</p><p className="mt-1 font-heading text-xl font-extrabold">R$ 8,00</p></div></div><section className="min-h-0 flex-1 rounded-xl border border-territory-border bg-white p-3"><p className="text-xs font-bold">Entregas do período</p>{DELIVERIES.map((row) => <div key={row.id} className="flex justify-between border-b py-3 text-xs"><span>{row.id} · {row.origin}</span><span>{row.value}</span></div>)}<Notice tone="yellow" className="mt-3">Previsão de repasse ainda não informada.</Notice></section></div></div></div>;
}

function MobileShell({ view, state, onView, navigate }: { view: GainsView; state: GainsState; onView: (view: GainsView) => void; navigate: (to: string) => void }) {
  return <div className="driver-earnings-concept-page relative flex h-dvh min-h-0 flex-col overflow-hidden bg-[#fbfcfb] text-territory-ink md:hidden">{view === "summary" ? <MobileSummary state={state} onView={onView} /> : view === "history" ? <MobileHistory onView={onView} /> : view === "detail" ? <MobileDetail state={state} onView={onView} /> : view === "delivery-detail" ? <MobileDeliveryDetail onView={onView} /> : view === "review" ? <MobileReview onView={onView} /> : <MobileReceipts />}<MobileBottomNav navigate={navigate} /></div>;
}

function parseRoute(params: URLSearchParams): { view: GainsView; state: GainsState } {
  const requestedView = params.get("view") || params.get("screen");
  const rawState = params.get("state");
  const state: GainsState = rawState === "pending" || rawState === "confirmed" || rawState === "empty" || rawState === "error" ? rawState : "default";
  if (requestedView === "history" || requestedView === "detail" || requestedView === "delivery-detail" || requestedView === "delivery" || requestedView === "review" || requestedView === "receipts") return { view: requestedView === "delivery" ? "delivery-detail" : requestedView, state };
  if (state === "pending" || state === "confirmed") return { view: "detail", state };
  return { view: "summary", state };
}

export default function CentralMotoboyGanhosConceptMockPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { view, state } = useMemo(() => parseRoute(params), [params]);
  const goView = (nextView: GainsView, nextState?: GainsState) => navigate(`/central/motoboy/ganhos?concept-mock=1&view=${nextView}${nextState && nextState !== "default" ? `&state=${nextState}` : ""}`);
  const title = view === "summary" ? "Meus ganhos" : view === "history" ? "Histórico de valores" : view === "detail" ? "Recebimento da entrega" : view === "delivery-detail" ? "Entrega #1042" : view === "review" ? "Solicitar revisão" : "Recebimentos";
  return <><Helmet><title>{title} · Central do entregador</title></Helmet><DesktopShell navigate={navigate}>{view === "summary" ? <DesktopSummary state={state} onView={goView} /> : view === "history" ? <DesktopHistory onView={goView} /> : view === "detail" ? <DesktopDetail state={state} onView={goView} /> : view === "delivery-detail" ? <DesktopDetail state={state} onView={goView} /> : view === "review" ? <DesktopReview onView={goView} /> : <DesktopReceipts />}</DesktopShell><MobileShell view={view} state={state} onView={goView} navigate={navigate} /></>;
}
