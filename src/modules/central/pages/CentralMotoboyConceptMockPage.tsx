import { useMemo, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bike,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CircleOff,
  Clock3,
  CloudOff,
  Coins,
  FileText,
  Gauge,
  History,
  Home,
  Info,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Package,
  Receipt,
  Search,
  Settings,
  Store,
  Utensils,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import { useNeighborhoodBounds } from "@/core/business/hooks/useNeighborhoodBounds";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { DeliveryProof } from "@/core/mobility/delivery/proof-of-delivery/types";

type DriverCenterState = "overview" | "delivery" | "earnings" | "availability";
type MobileDeliveryPhase = "offer" | "pickup" | "delivery";
type CompletionScreen = "proof" | "problem" | "offline" | "history";

type CompletionDeliveryData = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  storeName: string;
  storeAddress: string;
  destination: string;
  packageDescription: string;
  deliveryTime: string;
  deliveryValue: string;
  proofObservation: string;
};

const COMPLETION_DELIVERY: CompletionDeliveryData = {
  id: "#1042",
  recipientName: "Ana Oliveira",
  recipientPhone: "(71) 9 9123-4567",
  storeName: "Sabores da Ana",
  storeAddress: "Rua Exemplo, 80 · Santa Cruz",
  destination: "Nordeste de Amaralina · Salvador",
  packageDescription: "Refeição · 1 sacola",
  deliveryTime: "12:46",
  deliveryValue: "R$ 7,00",
  proofObservation: "Entregue pessoalmente à destinatária.",
};

const COMPLETION_HISTORY = [
  { ...COMPLETION_DELIVERY, id: "#1042", storeName: "Sabores da Ana", deliveryTime: "12:46", deliveryValue: "R$ 7,00" },
  { ...COMPLETION_DELIVERY, id: "#1038", storeName: "Mercado da Praça", deliveryTime: "11:30", deliveryValue: "R$ 8,00" },
];

type StateConfig = {
  id: DriverCenterState;
  label: string;
  icon: LucideIcon;
};

const stateOptions: StateConfig[] = [
  { id: "overview", label: "Visão geral", icon: Home },
  { id: "delivery", label: "Entregas", icon: Package },
  { id: "earnings", label: "Ganhos", icon: Wallet },
  { id: "availability", label: "Disponibilidade", icon: Clock3 },
];

const secondaryNavItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Perfil e veículo", icon: Bike },
  { label: "Configurações", icon: Settings },
  { label: "Ajuda", icon: CircleHelp },
];

function parseState(value: string | null): DriverCenterState {
  return stateOptions.some((option) => option.id === value) ? (value as DriverCenterState) : "overview";
}

function parseMobileDeliveryPhase(value: string | null): MobileDeliveryPhase {
  return value === "offer" || value === "pickup" || value === "delivery" ? value : "delivery";
}

function parseCompletionScreen(value: string | null): CompletionScreen {
  return value === "proof" || value === "problem" || value === "offline" || value === "history" ? value : "proof";
}

function getStateConfig(state: DriverCenterState) {
  return stateOptions.find((option) => option.id === state) ?? stateOptions[0];
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-baseline font-heading text-xl font-bold tracking-[-0.06em] lg:text-[1.35rem]",
      dark ? "text-territory-brand" : "text-white",
    )}>
      achegue-se<span className="ml-0.5 text-territory-sun">.</span>
    </span>
  );
}

function ProfileControl({ mobile = false }: { mobile?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => toast.info("O perfil ficará disponível nesta próxima etapa.")}
      className={cn(
        "flex items-center gap-2 text-left text-xs font-semibold",
        mobile ? "rounded-lg border border-white/20 px-2 py-1.5 text-white" : "text-territory-ink",
      )}
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", mobile ? "bg-white text-[#0b5350]" : "bg-[#e5eeee] text-territory-brand")}>
        <UserRound className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className={cn("leading-tight", mobile ? "hidden sm:flex sm:flex-col" : "flex flex-col")}>
        <span>Carlos Santos</span>
        <span className={cn("text-[0.65rem] font-normal", mobile ? "text-white/70" : "text-territory-muted")}>Motoboy</span>
      </span>
      <ChevronDown className={cn("h-3.5 w-3.5", mobile ? "text-white/70" : "text-territory-muted")} aria-hidden="true" />
    </button>
  );
}

function MobileTopBar({ state, phase, completionScreen }: { state: DriverCenterState; phase: MobileDeliveryPhase; completionScreen?: CompletionScreen | null }) {
  if (state === "delivery" && completionScreen === "history") {
    return <header className="h-12 shrink-0 bg-white md:hidden" aria-hidden="true" />;
  }

  if (state === "overview") {
    return (
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-territory-border bg-white px-4 md:hidden">
        <Brand dark />
        <button type="button" onClick={() => toast.info("As notificações ficarão disponíveis quando conectadas.")} className="flex h-9 w-9 items-center justify-center rounded-full text-territory-brand" aria-label="Notificações">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
    );
  }

  if (state === "delivery" && phase === "offer" && !completionScreen) {
    return (
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-territory-border bg-white px-3 md:hidden">
        <button type="button" onClick={() => window.history.back()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-territory-brand" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="font-heading text-sm font-bold text-territory-ink">Entregas</span>
      </header>
    );
  }

  return (
    <header className="grid h-12 shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-territory-border bg-white px-3 md:hidden">
      <button type="button" onClick={() => window.history.back()} className="flex h-9 w-9 items-center justify-center rounded-full text-territory-brand" aria-label="Voltar">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="text-center font-heading text-sm font-bold text-territory-ink">
        {state === "delivery" ? (completionScreen === "history" ? "Minhas entregas" : phase === "offer" ? "Entregas" : "Entrega #1042") : state === "earnings" ? "Ganhos" : "Disponibilidade"}
      </span>
      {phase === "offer" ? <span aria-hidden="true" /> : <button type="button" onClick={() => toast.info("Mais opções ficarão disponíveis quando conectadas.")} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full text-territory-brand" aria-label="Mais opções">
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>}
    </header>
  );
}

type MobileAction = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  tone?: "sun" | "danger";
};

function MobileActionFooter({ primary, secondary, className, size = "default" }: { primary: MobileAction; secondary: MobileAction; className?: string; size?: "default" | "concept" }) {
  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary.icon;

  return (
    <div className={cn("sticky bottom-0 z-20 -mx-1 bg-[#fbfaf7]/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm", className)}>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={primary.onClick} className={cn("w-full rounded-xl text-sm font-bold", size === "concept" ? "h-[3.25rem]" : "h-11", primary.tone === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-territory-sun text-territory-ink hover:bg-territory-sun/85")}>
          {PrimaryIcon ? <PrimaryIcon className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
          {primary.label}
        </Button>
        <Button type="button" variant="outline" onClick={secondary.onClick} className={cn("w-full rounded-xl border-territory-border bg-territory-surface text-sm font-bold text-territory-ink", size === "concept" ? "h-[3.25rem]" : "h-11")}>
          {SecondaryIcon ? <SecondaryIcon className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
          {secondary.label}
        </Button>
      </div>
    </div>
  );
}

function Sidebar({ state, onChange }: { state: DriverCenterState; onChange: (next: DriverCenterState) => void }) {
  return (
    <aside className="hidden w-[clamp(10rem,16.7vw,22.5rem)] shrink-0 flex-col bg-[#0b5350] px-2.5 py-3 text-white md:flex lg:px-3 lg:py-4" aria-label="Navegação da central">
      <div className="px-3 pb-7 pt-2 lg:px-4 lg:pb-8 lg:pt-3">
        <Brand />
      </div>
      <nav className="space-y-1.5">
        {stateOptions.map(({ id, label, icon: Icon }) => {
          const active = id === state;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold transition-colors lg:min-h-11 lg:gap-3 lg:px-3 lg:text-base",
                active ? "bg-territory-sun text-territory-ink" : "text-white/85 hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5 shrink-0 lg:h-[1.35rem] lg:w-[1.35rem]" aria-hidden="true" />
              {label}
            </button>
          );
        })}
        <div className="my-4 h-px bg-white/15" />
        {secondaryNavItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => toast.info(`${label} ficará disponível nesta próxima etapa.`)}
            className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold text-white/85 hover:bg-white/10 lg:min-h-11 lg:gap-3 lg:px-3 lg:text-base"
          >
            <Icon className="h-5 w-5 shrink-0 lg:h-[1.35rem] lg:w-[1.35rem]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto px-2 pb-1 text-[0.65rem] text-white/65 lg:px-3 lg:text-xs">
        <p>Mais entregas</p>
        <p>Mais oportunidades</p>
        <p>para a sua jornada.</p>
        <span className="mt-2 block h-1 w-8 rounded-full bg-territory-sun" />
      </div>
    </aside>
  );
}

function PageHeader({ state, phase, completionScreen, isOnline, onToggleOnline }: { state: DriverCenterState; phase: MobileDeliveryPhase; completionScreen?: CompletionScreen | null; isOnline: boolean; onToggleOnline: () => void }) {
  const title = state === "overview" ? "Sua central" : state === "delivery" ? (completionScreen ? "Conclusão, imprevistos e histórico" : "Pedido #1042") : state === "earnings" ? "Ganhos e histórico" : "Disponibilidade";
  const subtitle = state === "overview" ? "Ofertas perto de você, na sua área de atuação." : state === "delivery" ? (completionScreen ? "Finalize entregas e consulte os registros da operação." : phase === "offer" ? "Confira os detalhes e solicite a entrega." : "Siga o roteiro e conclua com segurança.") : state === "earnings" ? "Acompanhe suas entregas e valores registrados." : "Defina sua área de atuação e fique online para receber ofertas.";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-territory-border pb-4 lg:gap-4 lg:pb-5">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink lg:text-3xl">{title}</h1>
        <p className="mt-1 text-xs text-territory-muted lg:text-base">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        {state === "overview" ? (
          <>
            <span className={cn("inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-bold lg:px-3 lg:py-2 lg:text-xs", isOnline ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700")}>
              <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-600" : "bg-slate-400")} />
              {isOnline ? "Disponível" : "Offline"}
            </span>
            <Button type="button" variant="outline" onClick={onToggleOnline} className="h-8 border-territory-border bg-territory-surface px-3 text-[0.7rem] font-bold text-territory-ink lg:h-9 lg:text-xs">
              {isOnline ? "Ficar offline" : "Ficar online"}
            </Button>
          </>
        ) : null}
        {state === "earnings" ? (
          <Button type="button" variant="outline" onClick={() => toast.info("O período ficará disponível quando houver histórico real.")} className="h-8 gap-2 border-territory-border bg-territory-surface text-[0.7rem] font-semibold text-territory-ink lg:h-9 lg:text-xs">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Hoje
            <ChevronDown className="h-3.5 w-3.5 text-territory-muted" aria-hidden="true" />
          </Button>
        ) : null}
        {state === "availability" ? (
          <>
            <span className={cn("inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-bold lg:px-3 lg:py-2 lg:text-xs", isOnline ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700")}>
              <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-600" : "bg-slate-400")} />
              {isOnline ? "Disponível" : "Offline"}
            </span>
            <Button type="button" variant="outline" onClick={onToggleOnline} className="h-8 border-territory-border bg-territory-surface px-3 text-[0.7rem] font-bold text-territory-ink lg:h-9 lg:text-xs">
              {isOnline ? "Ficar offline" : "Ficar online"}
            </Button>
          </>
        ) : null}
        <div className="hidden items-center gap-3 md:flex">
          <span className="h-8 w-px bg-territory-border" aria-hidden="true" />
          <ProfileControl />
        </div>
      </div>
    </div>
  );
}

function MobileOverviewContent({ isOnline, onToggleOnline, onOpenOffer }: { isOnline: boolean; onToggleOnline: () => void; onOpenOffer: () => void }) {
  return (
    <div className="flex flex-col gap-3 pb-3">
      <div className="flex items-center gap-3 px-1 pt-1">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dbe9e7] text-territory-brand">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-base font-bold text-territory-ink">Carlos Santos</p>
          <p className="text-xs text-territory-muted">Motoboy · Salvador</p>
        </div>
      </div>

      <div className="px-1">
        <h1 className="font-heading text-[1.35rem] font-bold tracking-[-0.045em] text-territory-ink">Sua central</h1>
        <p className="mt-0.5 text-xs text-territory-muted">Defina sua disponibilidade para receber ofertas.</p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onToggleOnline} className={cn("relative h-7 w-12 rounded-full transition-colors", isOnline ? "bg-emerald-600" : "bg-slate-300")} aria-label={isOnline ? "Ficar offline" : "Ficar disponível"}>
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", isOnline ? "left-6" : "left-1")} />
          </button>
          <span className="text-base font-bold text-territory-ink">{isOnline ? "Disponível" : "Offline"}</span>
        </div>
        <button type="button" onClick={onToggleOnline} className="rounded-lg border border-emerald-700/20 px-3 py-1.5 text-xs font-semibold text-territory-brand">{isOnline ? "Ficar offline" : "Ficar online"}</button>
      </div>

      <button type="button" onClick={() => toast.info("A região de atuação ficará disponível quando conectada.")} className="flex items-center gap-3 border-b border-territory-border px-1 pb-3 text-left">
        <MapPin className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-xs text-territory-muted">Região de atuação</span><span className="block truncate text-sm font-bold text-territory-ink">Nordeste de Amaralina · Salvador</span></span>
        <ArrowRight className="h-4 w-4 text-territory-muted" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2 border-b border-territory-border px-1 pb-3 text-xs text-territory-ink">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-territory-brand"><span className="h-2 w-2 rounded-full bg-territory-brand" /></span>
        <span className="flex-1">Localização atualizada</span>
        <span className="text-territory-muted">Agora</span>
        <span className="h-2 w-2 rounded-full bg-emerald-600" />
      </div>

      <MapCanvas mode="overview" size="mobile" />

      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-lg font-bold text-territory-ink">Ofertas próximas</h2>
        <button type="button" onClick={() => toast.info("Todas as ofertas ficarão disponíveis quando conectadas.")} className="flex items-center gap-1 text-xs font-semibold text-territory-brand">Ver todas <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
      </div>

      <section className="rounded-xl border border-territory-border bg-territory-surface p-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Utensils className="h-6 w-6" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">Sabores da Ana</p><p className="text-xs text-territory-muted">Coleta em Santa Cruz</p><p className="text-xs text-territory-muted">Destino: Nordeste de Amaralina</p></div>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-territory-border pt-2.5">
          <div><p className="text-[0.7rem] text-territory-muted">Valor da oferta</p><p className="font-heading text-xl font-bold text-territory-ink">R$ 7,00</p></div>
          <Button type="button" onClick={onOpenOffer} className="h-9 rounded-lg bg-territory-sun px-4 text-xs font-bold text-territory-ink hover:bg-territory-sun/85">Ver oferta</Button>
        </div>
      </section>
    </div>
  );
}

type MobileDeliveryFlowConfig = {
  statusLabel: string;
  statusIcon: LucideIcon;
  statusClassName: string;
  currentStep?: "pickup" | "delivery";
  firstIcon: LucideIcon;
  firstImage?: string;
  firstTitle: string;
  firstSubtitle: string;
  secondIcon: LucideIcon;
  secondTitle: string;
  secondSubtitle: string;
  quickActionLabel: string;
  quickActionIcon: LucideIcon;
  quickActionToast: string;
  primary: MobileAction;
  secondary: MobileAction;
  notice?: string;
  safetyNote?: boolean;
};

function getMobileDeliveryFlowConfig(phase: MobileDeliveryPhase): MobileDeliveryFlowConfig {
  if (phase === "pickup") {
    return {
      statusLabel: "A caminho da coleta",
      statusIcon: Bike,
      statusClassName: "bg-emerald-50 text-territory-brand",
      currentStep: "pickup",
      firstIcon: Utensils,
      firstImage: foodImage,
      firstTitle: "Sabores da Ana",
      firstSubtitle: "Rua Exemplo, 80 · Santa Cruz",
      secondIcon: Package,
      secondTitle: "Pacote",
      secondSubtitle: "Refeição · 1 sacola",
      quickActionLabel: "Falar com a loja",
      quickActionIcon: MessageCircle,
      quickActionToast: "O contato com a loja será aberto quando conectado.",
      primary: { label: "Confirmar coleta", icon: Check, onClick: () => toast.success("Coleta confirmada na demonstração.") },
      secondary: { label: "Preciso de ajuda", icon: CircleHelp, onClick: () => toast.info("A ajuda ficará disponível quando conectada.") },
      notice: "Confira o pedido antes de confirmar a coleta.",
    };
  }

  return {
    statusLabel: "Em entrega",
    statusIcon: Bike,
    statusClassName: "bg-emerald-50 text-territory-brand",
    currentStep: "delivery",
    firstIcon: UserRound,
    firstTitle: "Ana Oliveira",
    firstSubtitle: "Rua Exemplo, 120 · Casa 2",
    secondIcon: MapPin,
    secondTitle: "Referência",
    secondSubtitle: "Portão azul",
    quickActionLabel: "Falar com o cliente",
    quickActionIcon: MessageCircle,
    quickActionToast: "O contato com o cliente será aberto quando conectado.",
    primary: { label: "Confirmar entrega", icon: Check, onClick: () => toast.success("Entrega confirmada na demonstração.") },
    secondary: { label: "Registrar problema", icon: AlertCircle, onClick: () => toast.info("O registro de problema será aberto quando conectado.") },
    notice: undefined,
    safetyNote: true,
  };
}

function MobileDeliveryOrderCard({ config }: { config: MobileDeliveryFlowConfig }) {
  const FirstIcon = config.firstIcon;
  const SecondIcon = config.secondIcon;

  return (
    <section className="overflow-hidden rounded-xl border border-territory-border bg-territory-surface">
      <div className="flex items-center gap-2.5 border-b border-territory-border p-3">
        {config.firstImage ? <img src={config.firstImage} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-territory-brand"><FirstIcon className="h-5 w-5" aria-hidden="true" /></span>}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">{config.firstTitle}</p><p className="text-xs text-territory-muted">{config.firstSubtitle}</p></div>
        <ArrowRight className="h-4 w-4 text-territory-muted" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2.5 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-territory-brand"><SecondIcon className="h-5 w-5" aria-hidden="true" /></span>
        <div><p className="text-sm font-bold text-territory-ink">{config.secondTitle}</p><p className="text-xs text-territory-muted">{config.secondSubtitle}</p></div>
      </div>
    </section>
  );
}

function MobileOfferDetail({ icon: Icon, title, value, tone }: { icon: LucideIcon; title: string; value: string; tone: "pickup" | "delivery" | "package" }) {
  const iconClassName = tone === "pickup" ? "text-amber-500" : tone === "delivery" ? "text-territory-brand" : "text-territory-brand";

  return (
    <div className="flex items-start gap-2.5 border-b border-territory-border pb-2 text-xs last:border-b-0 last:pb-0">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClassName)} aria-hidden="true" />
      <div><p className="font-bold text-territory-ink">{title}</p><p className="text-territory-muted">{value}</p></div>
    </div>
  );
}

function MobileOfferContent() {
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain pb-0">
      <div className="px-1"><h1 className="font-heading text-[1.35rem] font-bold tracking-[-0.045em] text-territory-brand">Nova oferta</h1></div>
      <div className="flex items-center gap-3 px-1">
        <img src={foodImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <div className="min-w-0"><p className="truncate text-base font-bold text-territory-ink">Sabores da Ana</p><p className="text-xs text-territory-muted">Restaurante · Santa Cruz</p></div>
      </div>
      <MapCanvas mode="delivery" size="mobile" phase="offer" mobileAdaptive="offer" />
      <div className="grid grid-cols-2 divide-x divide-territory-border rounded-xl border border-territory-border bg-territory-surface py-2.5">
        <div className="flex items-center justify-center gap-2 px-2 text-center"><Bike className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="text-xs text-territory-muted"><strong className="block whitespace-nowrap text-[0.8rem] font-bold text-territory-ink">Até a coleta</strong>0,8 km</span></div>
        <div className="flex items-center justify-center gap-2 px-2 text-center"><Navigation className="h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><span className="text-xs text-territory-muted"><strong className="block whitespace-nowrap text-[0.8rem] font-bold text-territory-ink">Coleta ao destino</strong>2,1 km</span></div>
      </div>
      <div className="space-y-1.5 px-1">
        <MobileOfferDetail icon={MapPin} title="Coleta" value="Sabores da Ana · Santa Cruz" tone="pickup" />
        <MobileOfferDetail icon={MapPin} title="Destino" value="Nordeste de Amaralina · Salvador" tone="delivery" />
        <MobileOfferDetail icon={Package} title="Pacote" value="Refeição · 1 sacola" tone="package" />
      </div>
      <section className="rounded-xl bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2"><div><p className="text-xs text-territory-muted">Valor da oferta</p><p className="font-heading text-2xl font-bold text-territory-ink">R$ 7,00</p></div><ArrowRight className="h-5 w-5 text-territory-ink" aria-hidden="true" /></div>
        <button type="button" onClick={() => toast.info("A composição do valor ficará disponível quando conectada.")} className="mt-1 text-xs font-semibold text-territory-muted">Ver composição do valor</button>
      </section>
      <div>
        <p className="flex items-center gap-2 px-1 text-xs text-territory-muted"><Info className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />Confira os detalhes antes de aceitar.</p>
        <MobileActionFooter primary={{ label: "Aceitar entrega", icon: Check, onClick: () => toast.success("Entrega aceita na demonstração.") }} secondary={{ label: "Agora não", onClick: () => toast.info("Oferta recusada na demonstração.") }} />
      </div>
    </div>
  );
}

function MobileDeliveryContent({ phase, onConfirmDelivery }: { phase: MobileDeliveryPhase; onConfirmDelivery?: () => void }) {
  if (phase === "offer") return <MobileOfferContent />;

  const config = getMobileDeliveryFlowConfig(phase);
  const StatusIcon = config.statusIcon;
  const QuickActionIcon = config.quickActionIcon;
  const primaryAction = phase === "delivery" && onConfirmDelivery ? { ...config.primary, onClick: onConfirmDelivery } : config.primary;

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-0 pt-3">
      <div className="flex justify-center">
        <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold", config.statusClassName)}><StatusIcon className="h-4 w-4" aria-hidden="true" />{config.statusLabel}</span>
      </div>
      {config.currentStep ? <ProgressSteps currentStep={config.currentStep} /> : null}
      <MapCanvas mode="delivery" size="mobile" phase={phase} mobileAdaptive="flow" />
      <MobileDeliveryOrderCard config={config} />

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => toast.info("A navegação será aberta quando o rastreamento estiver conectado.")} className="h-11 border-territory-border bg-territory-surface px-2 text-xs font-bold text-territory-ink"><Navigation className="mr-1.5 h-4 w-4" aria-hidden="true" />Abrir navegação</Button>
        <Button type="button" variant="outline" onClick={() => toast.info(config.quickActionToast)} className="h-11 border-territory-border bg-territory-surface px-2 text-xs font-bold text-territory-ink"><QuickActionIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />{config.quickActionLabel}</Button>
      </div>
      <div>
        {config.notice ? <InfoNotice className="min-h-10 bg-amber-50 text-amber-900" icon={AlertCircle}>{config.notice}</InfoNotice> : null}
        <MobileActionFooter className={config.notice ? "mt-2" : undefined} primary={primaryAction} secondary={config.secondary} />
        {config.safetyNote ? <p className="mt-6 flex items-center justify-center gap-2 text-xs text-territory-muted"><Bike className="h-4 w-4" aria-hidden="true" />Use o aplicativo com a moto parada.</p> : null}
      </div>
    </div>
  );
}

function MobileCompletionFrame({ screen, children }: { screen: CompletionScreen; children: ReactNode }) {
  return <div className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pb-0", screen === "history" ? "h-[calc(100dvh-8.75rem)] max-h-[calc(100dvh-8.75rem)]" : "h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)]")}>{children}</div>;
}

function CompletionStoreSummary({ delivery = COMPLETION_DELIVERY }: { delivery?: CompletionDeliveryData }) {
  return (
    <section className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Store className="h-6 w-6" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-bold text-territory-ink">{delivery.recipientName}</p><p className="truncate text-xs text-territory-muted">{delivery.storeName} → {delivery.destination.split(" · ")[0]}</p></div>
    </section>
  );
}

function CompletionContactActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={() => toast.info("O contato com o cliente será aberto quando conectado.")} className="h-11 border-territory-border bg-territory-surface px-2 text-xs font-bold text-territory-ink"><MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com cliente</Button>
      <Button type="button" variant="outline" onClick={() => toast.info("O contato com a loja será aberto quando conectado.")} className="h-11 border-territory-border bg-territory-surface px-2 text-xs font-bold text-territory-ink"><Store className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com a loja</Button>
    </div>
  );
}

function MobileProofContent({ delivery = COMPLETION_DELIVERY, onConfirm, onBack }: { delivery?: CompletionDeliveryData; onConfirm: (proof: DeliveryProof) => void; onBack: () => void }) {
  const [proofCode, setProofCode] = useState("");
  const [proofObservation, setProofObservation] = useState(delivery.proofObservation);

  return (
    <MobileCompletionFrame screen="proof">
      <div className="px-1 pt-1"><h1 className="font-heading text-[1.35rem] font-bold tracking-[-0.045em] text-territory-ink">Confirmar entrega</h1></div>
      <CompletionStoreSummary delivery={delivery} />
      <label className="px-1 text-sm font-semibold text-territory-ink">Código do destinatário <span className="font-normal text-territory-muted">(opcional)</span><input value={proofCode} onChange={(event) => setProofCode(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal text-territory-ink outline-none placeholder:text-slate-400 focus:border-territory-brand" placeholder="Digite o código" /></label>
      <label className="px-1 text-sm font-semibold text-territory-ink">Como foi entregue? <span className="text-rose-600">*</span><textarea value={proofObservation} onChange={(event) => setProofObservation(event.target.value)} className="mt-2 min-h-24 w-full resize-none rounded-lg border border-territory-border bg-territory-surface px-3 py-2.5 text-sm font-normal text-territory-ink outline-none focus:border-territory-brand" /><span className="mt-1 block text-xs font-normal text-territory-muted">Essa informação ficará no comprovante.</span></label>
      <div className="mt-auto pt-1">
        <InfoNotice className="bg-blue-50 text-blue-900">Confirme somente após entregar o pedido.</InfoNotice>
        <MobileActionFooter size="concept" className="mt-2" primary={{ label: "Confirmar entrega", icon: Check, onClick: () => onConfirm({ code: proofCode.trim() || undefined, observation: proofObservation.trim() || undefined }) }} secondary={{ label: "Voltar à entrega", onClick: onBack }} />
      </div>
    </MobileCompletionFrame>
  );
}

function CompletionReason({ label, selected = false, onSelect }: { label: string; selected?: boolean; onSelect?: (label: string) => void }) {
  return <button type="button" aria-pressed={selected} onClick={() => onSelect ? onSelect(label) : toast.info(`Motivo selecionado: ${label}.`)} className="flex items-center gap-2 text-left text-sm text-territory-ink"><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-territory-ink bg-territory-sun" : "border-territory-ink bg-territory-surface")}>{selected ? <span className="h-2.5 w-2.5 rounded-full bg-territory-ink" /> : null}</span>{label}</button>;
}

const ADDITIONAL_PROBLEM_REASONS = ["Endereço inacessível", "Pacote danificado", "Problema de segurança"];

function MobileProblemContent({ onRegister, onBack }: { onRegister: (reason: string, details: string) => void; onBack: () => void }) {
  const [reason, setReason] = useState("Destinatário ausente");
  const [details, setDetails] = useState("");
  const [showAdditionalReasons, setShowAdditionalReasons] = useState(false);

  return (
    <MobileCompletionFrame screen="problem">
      <div className="px-1 pt-1"><h1 className="font-heading text-[1.35rem] font-bold tracking-[-0.045em] text-territory-ink">Registrar problema</h1></div>
      <section className="px-1">
        <h2 className="text-sm font-bold text-territory-ink">O que aconteceu?</h2>
        <div className="mt-2 space-y-2.5"><CompletionReason label="Destinatário ausente" selected={reason === "Destinatário ausente"} onSelect={setReason} /><CompletionReason label="Endereço não encontrado" selected={reason === "Endereço não encontrado"} onSelect={setReason} /><CompletionReason label="Problema no veículo" selected={reason === "Problema no veículo"} onSelect={setReason} /><CompletionReason label="Outro motivo" selected={reason === "Outro motivo"} onSelect={setReason} />{showAdditionalReasons ? ADDITIONAL_PROBLEM_REASONS.map((label) => <CompletionReason key={label} label={label} selected={reason === label} onSelect={setReason} />) : null}</div>
        <button type="button" onClick={() => setShowAdditionalReasons((current) => !current)} className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-700">{showAdditionalReasons ? "Ocultar motivos" : "Ver outros motivos"} <ArrowRight className={cn("h-4 w-4 transition-transform", showAdditionalReasons ? "rotate-90" : null)} aria-hidden="true" /></button>
      </section>
      <InfoNotice className="min-h-16 bg-blue-50 text-blue-900">Antes de registrar, tente contato quando possível.</InfoNotice>
      <CompletionContactActions />
      <label className="px-1 text-sm font-semibold text-territory-ink">Detalhes<textarea value={details} onChange={(event) => setDetails(event.target.value)} className="mt-2 min-h-16 w-full resize-none rounded-lg border border-territory-border bg-territory-surface px-3 py-2.5 text-sm font-normal text-territory-ink outline-none placeholder:text-slate-400 focus:border-territory-brand" placeholder="Descreva o ocorrido" /></label>
      <div className="mt-auto pt-1">
        <InfoNotice className="min-h-16">O problema ficará no histórico da entrega.</InfoNotice>
        <MobileActionFooter size="concept" className="mt-2" primary={{ label: "Registrar problema", icon: AlertCircle, tone: "danger", onClick: () => onRegister(reason, details.trim()) }} secondary={{ label: "Voltar", onClick: onBack }} />
      </div>
    </MobileCompletionFrame>
  );
}

function MobileOfflineContent({ delivery = COMPLETION_DELIVERY, onRetry, onBack }: { delivery?: CompletionDeliveryData; onRetry: () => void; onBack: () => void }) {
  return (
    <MobileCompletionFrame screen="offline">
      <section className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
        <CloudOff className="h-10 w-10 text-amber-700" aria-hidden="true" />
        <h1 className="mt-2 font-heading text-xl font-bold text-territory-ink">Sem conexão</h1>
        <p className="mt-1 text-sm text-territory-muted">Não foi possível confirmar a entrega.</p>
      </section>
      <section className="flex min-h-16 items-center gap-3 rounded-xl border border-territory-border bg-slate-50 px-4 py-3"><Clock3 className="h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" /><div><p className="text-sm text-territory-muted">Último estado confirmado</p><p className="text-sm font-bold text-territory-ink">Em entrega · 12:42</p></div></section>
      <section className="rounded-xl border border-territory-border bg-territory-surface p-4"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-territory-brand" aria-hidden="true" /><p className="text-sm font-bold text-territory-ink">Sua observação foi preservada</p></div><p className="mt-3 rounded-lg bg-slate-100 px-3 py-3 text-sm text-territory-muted">{delivery.proofObservation}</p></section>
      <div className="mt-auto pt-1">
        <InfoNotice className="min-h-16 bg-blue-50 text-blue-900">A entrega ainda não foi concluída no sistema.</InfoNotice>
        <MobileActionFooter size="concept" className="mt-2" primary={{ label: "Tentar novamente", icon: History, onClick: onRetry }} secondary={{ label: "Voltar aos detalhes", onClick: onBack }} />
      </div>
    </MobileCompletionFrame>
  );
}

function MobileHistoryCard({ delivery, onOpenProof }: { delivery: CompletionDeliveryData; onOpenProof: () => void }) {
  return <section className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">{delivery.id} · {delivery.storeName}</p><p className="mt-2 flex items-center gap-2 text-xs text-territory-muted"><CalendarDays className="h-4 w-4" aria-hidden="true" />Hoje, {delivery.deliveryTime}</p><p className="mt-2 flex items-center gap-2 text-xs text-territory-muted"><Coins className="h-4 w-4" aria-hidden="true" />Valor registrado</p><p className="text-sm font-bold text-territory-ink">{delivery.deliveryValue}</p></div><span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Entregue</span></div><div className="mt-3 flex items-center justify-between border-t border-territory-border pt-3 text-xs font-semibold text-blue-700"><button type="button" onClick={onOpenProof} className="flex items-center gap-1"><Receipt className="h-4 w-4" aria-hidden="true" />Ver comprovante</button><button type="button" onClick={() => toast.info("Detalhes ficarão disponíveis quando conectados.")} className="flex items-center gap-1">Ver detalhes <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div></section>;
}

function MobileHistoryContent({ history = COMPLETION_HISTORY, onOpenProof }: { history?: CompletionDeliveryData[]; onOpenProof: () => void }) {
  return (
    <MobileCompletionFrame screen="history">
      <div className="px-1 pt-1"><h1 className="font-heading text-[1.35rem] font-bold tracking-[-0.045em] text-territory-ink">Minhas entregas</h1></div>
      <div className="grid grid-cols-2 border-b border-territory-border text-sm"><button type="button" className="border-b-2 border-transparent py-2.5 text-territory-muted">Em andamento</button><button type="button" className="border-b-2 border-territory-brand py-2.5 font-bold text-territory-brand">Histórico</button></div>
      <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" /><input className="h-11 w-full rounded-lg border border-territory-border bg-territory-surface pl-9 pr-3 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-brand" placeholder="Buscar entrega" /></label>
      <div className="grid grid-cols-[86px_1fr] gap-2"><Button type="button" className="h-9 rounded-lg bg-territory-brand text-xs font-bold text-white hover:bg-territory-brand/90">Hoje</Button><Button type="button" variant="outline" onClick={() => toast.info("Os filtros ficarão disponíveis quando conectados.")} className="h-9 justify-between border-territory-border bg-territory-surface px-3 text-xs font-semibold text-territory-ink">Todos os status <ChevronDown className="h-4 w-4 text-territory-muted" aria-hidden="true" /></Button></div>
      <div className="space-y-2">{history.map((delivery) => <MobileHistoryCard key={delivery.id} delivery={delivery} onOpenProof={onOpenProof} />)}</div>
      <button type="button" onClick={() => toast.info("Os ganhos ficarão disponíveis quando conectados.")} className="flex h-12 items-center gap-3 rounded-xl border border-territory-border bg-slate-50 px-3 text-left"><Gauge className="h-5 w-5 text-territory-brand" aria-hidden="true" /><span className="flex-1 text-sm font-semibold text-blue-800">Consultar ganhos</span><ArrowRight className="h-4 w-4 text-blue-800" aria-hidden="true" /></button>
    </MobileCompletionFrame>
  );
}

function MobileCompletionContent({ screen, onConfirmProof, onRegisterProblem, onRetry, onBack, onOpenProof }: { screen: CompletionScreen; onConfirmProof: (proof: DeliveryProof) => void; onRegisterProblem: (reason: string, details: string) => void; onRetry: () => void; onBack: () => void; onOpenProof: () => void }) {
  if (screen === "problem") return <MobileProblemContent onRegister={onRegisterProblem} onBack={onBack} />;
  if (screen === "offline") return <MobileOfflineContent onRetry={onRetry} onBack={onBack} />;
  if (screen === "history") return <MobileHistoryContent onOpenProof={onOpenProof} />;
  return <MobileProofContent onConfirm={onConfirmProof} onBack={onBack} />;
}

function MobileBottomNav({ state, onChange }: { state: DriverCenterState; onChange: (next: DriverCenterState) => void }) {
  const items: Array<{ label: string; icon: LucideIcon; target?: DriverCenterState }> = [
    { label: "Início", icon: Home, target: "overview" },
    { label: "Entregas", icon: Package, target: "delivery" },
    { label: "Ganhos", icon: Wallet, target: "earnings" },
    { label: "Perfil", icon: UserRound },
  ];

  return (
    <nav className="mt-auto grid grid-cols-4 border-t border-territory-border bg-white px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden" aria-label="Navegação mobile">
      {items.map(({ label, icon: Icon, target }) => {
        const active = (target ?? "overview") === state && target !== undefined;
        return <button key={label} type="button" onClick={() => target ? onChange(target) : toast.info("O perfil ficará disponível nesta próxima etapa.")} className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold", active ? "text-territory-brand" : "text-territory-muted")}><Icon className="h-5 w-5" aria-hidden="true" />{label}</button>;
      })}
    </nav>
  );
}

function MapCanvas({ mode, size = "default", phase, mobileAdaptive = false }: { mode: "overview" | "delivery"; size?: "default" | "mobile"; phase?: MobileDeliveryPhase; mobileAdaptive?: false | "offer" | "flow" }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-territory-border bg-[#e5eeee]",
      size === "mobile"
        ? mobileAdaptive === "offer"
          ? "h-[clamp(176px,calc(100dvh-628px),280px)] min-h-[176px] md:h-full md:min-h-0 lg:min-h-[360px]"
          : mobileAdaptive === "flow"
            ? "h-[clamp(176px,calc(100dvh-566px),340px)] min-h-[176px] md:h-full md:min-h-0 lg:min-h-[360px]"
            : "h-[clamp(150px,22dvh,176px)] min-h-[150px] md:h-full md:min-h-0 lg:min-h-[360px]"
        : "h-[300px] min-h-[300px] md:h-full md:min-h-0 lg:min-h-[360px]",
    )}>
      <div className="absolute inset-0 z-[1]">
        <MapLibreAdapter
          styleUrl={DEFAULT_TILE_STYLE.styleUrl}
          initialViewport={{ center: { latitude: -13.006, longitude: -38.48 }, zoom: 12.9 }}
          controls={{}}
          attribution={false}
          hideNavigationControl
          interactive={false}
          className="h-full w-full"
        />
      </div>
      {mode === "overview" ? (
        <>
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-white/95 p-2.5 text-[0.7rem] shadow-sm lg:left-4 lg:top-4 lg:p-3 lg:text-xs">
            <div className="flex items-center gap-2"><Bike className="h-3.5 w-3.5 text-territory-brand" />Sua localização</div>
            <div className="mt-2 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-amber-500" />Coleta (Sabores da Ana)</div>
            <div className="mt-2 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-rose-500" />Destino</div>
          </div>
          <MapMarker className="z-10 left-[54%] top-[49%]" icon={Bike} tone="brand" />
          <MapMarker className="z-10 left-[27%] top-[35%]" icon={MapPin} tone="sun" />
          <MapMarker className="z-10 right-[27%] top-[65%]" icon={MapPin} tone="error" />
        </>
      ) : (
        <>
          <svg className="absolute inset-0 z-[2] h-full w-full" viewBox="0 0 700 400" preserveAspectRatio="none" aria-hidden="true">
            <path d={phase === "pickup" ? "M135 285 C220 250 260 230 315 195 S395 155 470 105" : "M135 115 C205 145 220 180 290 170 S390 155 445 225 S540 285 615 305"} fill="none" stroke={phase === "offer" ? "#0b5350" : "#1678ee"} strokeLinecap="round" strokeWidth="9" />
          </svg>
          {phase === "offer" ? <>
            <MapMarker className="left-[15%] top-[26%]" icon={MapPin} tone="sun" />
            <MapMarker className="right-[21%] top-[72%]" icon={MapPin} tone="brand" />
            <div className="absolute left-[21%] top-[13%] z-10 rounded-lg bg-white/95 px-2 py-1 text-[0.6rem] leading-tight shadow-sm"><strong className="block">Coleta</strong>Santa Cruz</div>
            <div className="absolute right-[8%] top-[22%] z-10 rounded-lg bg-white/95 px-2 py-1 text-[0.6rem] leading-tight shadow-sm"><strong className="block">Destino</strong>Nordeste de Amaralina</div>
          </> : <>
            <MapMarker className={phase === "pickup" ? "right-[32%] top-[25%]" : "right-[21%] top-[72%]"} icon={MapPin} tone={phase === "pickup" ? "sun" : "error"} />
            <MapMarker className={phase === "pickup" ? "left-[61%] top-[72%]" : "left-[28%] top-[67%]"} icon={Bike} tone="brand" />
          </>}
          <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 p-2 text-[0.65rem] shadow-sm">
            <div className="flex items-center gap-2"><Bike className="h-3.5 w-3.5 text-territory-brand" />Sua localização</div>
            <div className="mt-1 flex items-center gap-2"><span className="h-0.5 w-4 bg-blue-500" />Rota da entrega</div>
            <div className="mt-1 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-amber-500" />Coleta / destino</div>
          </div>
        </>
      )}
      <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-semibold text-territory-muted">Atualizado agora</span>
    </div>
  );
}

function MapMarker({ className, icon: Icon, tone }: { className: string; icon: LucideIcon; tone: "brand" | "sun" | "error" }) {
  const pinClass = tone === "sun" ? "text-territory-sun" : tone === "error" ? "text-rose-500" : "text-territory-brand";
  const isRoundMarker = tone === "brand" && Icon === Bike;

  return (
    <div className={cn("absolute z-10 -translate-x-1/2 -translate-y-1/2", isRoundMarker ? "flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-territory-brand shadow-md" : "h-11 w-11", className)}>
      {isRoundMarker ? <Icon className="h-5 w-5 text-white" aria-hidden="true" /> : <><MapPin className={cn("h-full w-full fill-current drop-shadow-md", pinClass)} aria-hidden="true" /><span className="absolute left-1/2 top-[31%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" /></>}
    </div>
  );
}

function OfferPanel() {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-3 md:h-full lg:p-5">
      <div className="flex items-start gap-2.5 border-b border-territory-border pb-3 lg:gap-4 lg:pb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-territory-sun/80 lg:h-12 lg:w-12"><Utensils className="h-4 w-4 text-territory-ink lg:h-6 lg:w-6" aria-hidden="true" /></span>
        <div><h2 className="font-heading text-base font-bold text-territory-ink lg:text-xl">Sabores da Ana</h2><p className="text-[0.7rem] text-territory-muted lg:text-sm">Comida caseira que aproxima.</p></div>
      </div>
      <div className="flex flex-col text-xs lg:text-base">
        <div className="py-3 lg:py-5">
          <AddressLine icon={MapPin} title="Coleta" value="Santa Cruz · Salvador" tone="brand" />
        </div>
        <div className="border-t border-territory-border py-3 lg:py-5">
          <AddressLine icon={MapPin} title="Destino" value="Nordeste de Amaralina · Salvador" tone="error" />
        </div>
        <div className="flex items-center gap-2.5 border-t border-territory-border py-3 lg:gap-4 lg:py-5"><Navigation className="h-4 w-4 text-territory-muted lg:h-7 lg:w-7" aria-hidden="true" /><div><p className="font-bold text-territory-ink">0,8 km <span className="font-normal">até coleta</span></p><p className="font-bold text-territory-ink">2,1 km <span className="font-normal">até destino</span></p></div></div>
        <div className="mt-auto border-t border-territory-border pt-3 lg:pt-5">
          <div className="rounded-lg bg-emerald-50 px-3 py-2 lg:px-5 lg:py-4"><p className="text-[0.65rem] text-territory-muted lg:text-sm">Valor da oferta</p><p className="font-heading text-xl font-bold text-territory-ink lg:text-[2rem]">R$ 7,00</p></div>
          <Button type="button" onClick={() => toast.success("Oferta aberta para análise.")} className="mt-2 min-h-9 w-full rounded-lg bg-territory-sun text-xs font-bold text-territory-ink hover:bg-territory-sun/85 lg:mt-4 lg:min-h-12 lg:text-base">Analisar oferta <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" /></Button>
        </div>
      </div>
    </section>
  );
}

function AddressLine({ icon: Icon, title, value, tone }: { icon: LucideIcon; title: string; value: string; tone: "brand" | "error" }) {
  return <div className="flex items-start gap-2.5 lg:gap-4"><Icon className={cn("mt-0.5 h-4 w-4 shrink-0 lg:h-6 lg:w-6", tone === "brand" ? "text-emerald-600" : "text-rose-500")} aria-hidden="true" /><div><p className="font-bold text-territory-ink">{title}</p><p className="text-[0.7rem] text-territory-muted lg:text-sm">{value}</p></div></div>;
}

function OverviewContent() {
  return <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-[minmax(0,1.45fr)_minmax(250px,1fr)] lg:gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]"><MapCanvas mode="overview" /><OfferPanel /></div>;
}

function DesktopOrderSummary({ deliveryLabel = "Entrega (plataforma)", totalLabel = "Total estimado", total = "R$ 56,00" }: { deliveryLabel?: string; totalLabel?: string; total?: string }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-3 md:h-full lg:p-4">
      <div className="flex items-start gap-3 border-b border-territory-border pb-3">
        <Store className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <div><p className="text-xs font-bold text-territory-ink">Coleta (restaurante)</p><p className="text-sm font-bold text-territory-ink">Sabores da Ana</p><p className="text-xs text-territory-muted">Santa Cruz, Salvador · BA</p></div>
      </div>
      <div className="flex items-start gap-3 border-b border-territory-border py-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
        <div><p className="text-xs font-bold text-territory-ink">Destino</p><p className="text-sm text-territory-ink">Rua Exemplo, 120 · Casa 2</p><p className="text-xs text-territory-muted">Santa Cruz, Salvador · BA</p></div>
      </div>
      <div className="border-b border-territory-border py-3">
        <p className="text-xs font-bold text-territory-ink">Itens do pedido</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-territory-ink"><span>1× Moqueca individual + farofa extra</span><span className="shrink-0">R$ 41,00</span></div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-territory-ink"><span>1× Suco</span><span className="shrink-0">R$ 8,00</span></div>
      </div>
      <div className="mt-auto pt-3 text-xs text-territory-ink">
        <div className="flex items-center justify-between"><span>Produtos</span><span>R$ 49,00</span></div>
        <div className="mt-2 flex items-center justify-between"><span>{deliveryLabel}</span><span>R$ 7,00</span></div>
        <div className="mt-3 flex items-center justify-between border-t border-territory-border pt-3 text-sm font-bold"><span>{totalLabel}</span><span>{total}</span></div>
      </div>
    </section>
  );
}

function DesktopRequestContent() {
  return (
    <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
      <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-3 md:h-full lg:p-4">
        <div className="flex items-start gap-3">
          <Bike className="mt-0.5 h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />
          <div><h2 className="font-heading text-lg font-bold text-territory-ink lg:text-xl">Solicitar motoboy</h2><p className="mt-1 max-w-xl text-xs text-territory-muted lg:text-sm">A solicitação inicia a busca. O aceite depende de um entregador disponível.</p></div>
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Button type="button" onClick={() => toast.success("Busca por entregador solicitada na demonstração.")} className="min-h-10 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Solicitar entrega <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
          <Button type="button" variant="outline" onClick={() => toast.info("O pedido ficará disponível quando conectado.")} className="min-h-10 w-full border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Ver pedido</Button>
          <button type="button" onClick={() => toast.info("A ajuda ficará disponível quando conectada.")} className="mt-3 flex items-center gap-2 text-left text-xs font-semibold text-blue-700"><CircleHelp className="h-4 w-4" aria-hidden="true" />Ajuda sobre a entrega da plataforma</button>
        </div>
      </section>
      <DesktopOrderSummary />
    </div>
  );
}

function DesktopCompletionAside({ screen }: { screen: CompletionScreen }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-4 lg:p-5">
      <div className="flex items-start gap-3 border-b border-territory-border pb-4"><Store className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" /><div><p className="text-xs font-bold text-territory-ink">Entrega #1042</p><p className="text-sm font-bold text-territory-ink">Sabores da Ana</p><p className="text-xs text-territory-muted">Ana Oliveira · Nordeste de Amaralina</p></div></div>
      {screen === "history" ? <>
        <div className="border-b border-territory-border py-4"><p className="text-xs font-bold text-territory-ink">Resumo do período</p><div className="mt-3 grid grid-cols-2 gap-2"><MetricCard icon={CheckCircle2} label="Entregues" value="2" tone="green" /><MetricCard icon={Coins} label="Registrado" value="R$ 15,00" tone="yellow" /></div></div>
        <button type="button" onClick={() => toast.info("Os ganhos ficarão disponíveis quando conectados.")} className="mt-auto flex items-center gap-2 pt-4 text-left text-sm font-semibold text-blue-700"><Gauge className="h-5 w-5" aria-hidden="true" />Consultar ganhos <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" /></button>
      </> : <>
        <div className="border-b border-territory-border py-4"><p className="text-xs font-bold text-territory-ink">Itens do pedido</p><div className="mt-2 flex items-start justify-between gap-3 text-xs text-territory-ink"><span>1× Moqueca individual + farofa extra</span><span>R$ 41,00</span></div><div className="mt-2 flex items-center justify-between gap-3 text-xs text-territory-ink"><span>1× Suco</span><span>R$ 8,00</span></div></div>
        <div className="border-b border-territory-border py-4 text-xs text-territory-ink"><p className="font-bold">Pagamento</p><div className="mt-2 flex items-center justify-between"><span>Produtos</span><span>R$ 49,00</span></div><div className="mt-2 flex items-center justify-between"><span>Entrega</span><span>R$ 7,00</span></div><div className="mt-3 flex items-center justify-between border-t border-territory-border pt-3 text-sm font-bold"><span>Total</span><span>R$ 56,00</span></div></div>
        <div className="mt-auto pt-4"><p className="text-xs font-bold text-territory-ink">Histórico</p><p className="mt-2 flex items-center justify-between text-xs text-territory-muted"><span>Em entrega</span><span>12:42</span></p><button type="button" onClick={() => toast.info("O histórico completo ficará disponível quando conectado.")} className="mt-3 text-xs font-semibold text-blue-700">Ver histórico completo <ArrowRight className="inline h-3 w-3" aria-hidden="true" /></button></div>
      </>}
    </section>
  );
}

function DesktopCompletionContent({ screen, onConfirmProof, onRegisterProblem, onRetry, onBack, onOpenProof }: { screen: CompletionScreen; onConfirmProof: (proof: DeliveryProof) => void; onRegisterProblem: (reason: string, details: string) => void; onRetry: () => void; onBack: () => void; onOpenProof: () => void }) {
  const [desktopProofCode, setDesktopProofCode] = useState("");
  const [desktopProofObservation, setDesktopProofObservation] = useState(COMPLETION_DELIVERY.proofObservation);
  const [desktopProblemReason, setDesktopProblemReason] = useState("Destinatário ausente");
  const [desktopProblemDetails, setDesktopProblemDetails] = useState("");
  const [showDesktopAdditionalReasons, setShowDesktopAdditionalReasons] = useState(false);

  const leftContent = screen === "proof" ? (
    <>
      <div><h2 className="font-heading text-xl font-bold text-territory-ink">Confirmar entrega</h2><p className="mt-1 text-sm text-territory-muted">Registre os dados depois de entregar o pedido.</p></div>
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Store className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-bold text-territory-ink">{COMPLETION_DELIVERY.recipientName}</p><p className="text-xs text-territory-muted">{COMPLETION_DELIVERY.storeName} → {COMPLETION_DELIVERY.destination.split(" · ")[0]}</p></div></div>
      <label className="mt-4 text-sm font-semibold text-territory-ink">Código do destinatário <span className="font-normal text-territory-muted">(opcional)</span><input value={desktopProofCode} onChange={(event) => setDesktopProofCode(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal outline-none focus:border-territory-brand" placeholder="Digite o código" /></label>
      <label className="mt-4 text-sm font-semibold text-territory-ink">Como foi entregue? <span className="text-rose-600">*</span><textarea value={desktopProofObservation} onChange={(event) => setDesktopProofObservation(event.target.value)} className="mt-2 min-h-24 w-full resize-none rounded-lg border border-territory-border bg-territory-surface px-3 py-2 text-sm font-normal outline-none focus:border-territory-brand" /><span className="mt-1 block text-xs font-normal text-territory-muted">Essa informação ficará no comprovante.</span></label>
      <div className="mt-auto pt-4"><InfoNotice className="bg-blue-50 text-blue-900">Confirme somente após entregar o pedido.</InfoNotice><div className="mt-3 flex gap-2"><Button type="button" onClick={() => onConfirmProof({ code: desktopProofCode.trim() || undefined, observation: desktopProofObservation.trim() || undefined })} className="min-h-10 flex-1 rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Confirmar entrega</Button><Button type="button" variant="outline" onClick={onBack} className="min-h-10 border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar à entrega</Button></div></div>
    </>
  ) : screen === "problem" ? (
    <>
      <div><h2 className="font-heading text-xl font-bold text-territory-ink">Registrar problema</h2><p className="mt-1 text-sm text-territory-muted">O que aconteceu? O registro ficará no histórico.</p></div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><CompletionReason label="Destinatário ausente" selected={desktopProblemReason === "Destinatário ausente"} onSelect={setDesktopProblemReason} /><CompletionReason label="Endereço não encontrado" selected={desktopProblemReason === "Endereço não encontrado"} onSelect={setDesktopProblemReason} /><CompletionReason label="Problema no veículo" selected={desktopProblemReason === "Problema no veículo"} onSelect={setDesktopProblemReason} /><CompletionReason label="Outro motivo" selected={desktopProblemReason === "Outro motivo"} onSelect={setDesktopProblemReason} />{showDesktopAdditionalReasons ? ADDITIONAL_PROBLEM_REASONS.map((label) => <CompletionReason key={label} label={label} selected={desktopProblemReason === label} onSelect={setDesktopProblemReason} />) : null}</div>
      <button type="button" onClick={() => setShowDesktopAdditionalReasons((current) => !current)} className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-700">{showDesktopAdditionalReasons ? "Ocultar motivos" : "Ver outros motivos"} <ArrowRight className={cn("h-4 w-4 transition-transform", showDesktopAdditionalReasons ? "rotate-90" : null)} aria-hidden="true" /></button>
      <InfoNotice className="mt-4 bg-blue-50 text-blue-900">Antes de registrar, tente contato quando possível.</InfoNotice>
      <div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => toast.info("O contato com o cliente será aberto quando conectado.")} className="h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink"><MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com cliente</Button><Button type="button" variant="outline" onClick={() => toast.info("O contato com a loja será aberto quando conectado.")} className="h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink"><Store className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com a loja</Button></div>
      <label className="mt-4 text-sm font-semibold text-territory-ink">Detalhes<textarea value={desktopProblemDetails} onChange={(event) => setDesktopProblemDetails(event.target.value)} className="mt-2 min-h-20 w-full resize-none rounded-lg border border-territory-border bg-territory-surface px-3 py-2 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-territory-brand" placeholder="Descreva o ocorrido" /></label>
      <div className="mt-auto pt-4"><InfoNotice>O problema ficará no histórico da entrega.</InfoNotice><div className="mt-3 flex gap-2"><Button type="button" onClick={() => onRegisterProblem(desktopProblemReason, desktopProblemDetails.trim())} className="min-h-10 flex-1 rounded-lg bg-rose-600 text-sm font-bold text-white hover:bg-rose-700">Registrar problema</Button><Button type="button" variant="outline" onClick={onBack} className="min-h-10 border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar</Button></div></div>
    </>
  ) : screen === "offline" ? (
    <>
      <div className="flex flex-col items-center rounded-xl border border-amber-200 bg-amber-50 px-5 py-7 text-center"><CloudOff className="h-12 w-12 text-amber-700" aria-hidden="true" /><h2 className="mt-3 font-heading text-xl font-bold text-territory-ink">Sem conexão</h2><p className="mt-1 text-sm text-territory-muted">Não foi possível confirmar a entrega.</p></div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-territory-border bg-slate-50 px-4 py-4"><Clock3 className="h-6 w-6 text-territory-brand" aria-hidden="true" /><div><p className="text-sm text-territory-muted">Último estado confirmado</p><p className="text-sm font-bold text-territory-ink">Em entrega · 12:42</p></div></div>
      <div className="mt-4 rounded-xl border border-territory-border p-4"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-territory-brand" aria-hidden="true" /><p className="text-sm font-bold text-territory-ink">Sua observação foi preservada</p></div><p className="mt-3 rounded-lg bg-slate-100 px-3 py-3 text-sm text-territory-muted">Entregue pessoalmente à destinatária.</p></div>
      <div className="mt-auto pt-4"><InfoNotice className="bg-blue-50 text-blue-900">A entrega ainda não foi concluída no sistema.</InfoNotice><div className="mt-3 flex gap-2"><Button type="button" onClick={onRetry} className="min-h-10 flex-1 rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Tentar novamente</Button><Button type="button" variant="outline" onClick={onBack} className="min-h-10 border-territory-border bg-territory-surface text-sm font-bold text-territory-ink">Voltar aos detalhes</Button></div></div>
    </>
  ) : (
    <>
      <div className="flex items-start justify-between"><div><h2 className="font-heading text-xl font-bold text-territory-ink">Minhas entregas</h2><p className="mt-1 text-sm text-territory-muted">Acompanhe suas entregas finalizadas.</p></div><Button type="button" variant="outline" onClick={() => toast.info("Os filtros ficarão disponíveis quando conectados.")} className="h-9 border-territory-border bg-territory-surface text-xs font-semibold text-territory-ink">Hoje <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" /></Button></div>
      <div className="mt-4 grid grid-cols-2 border-b border-territory-border text-sm"><button type="button" className="border-b-2 border-transparent pb-3 text-territory-muted">Em andamento</button><button type="button" className="border-b-2 border-territory-brand pb-3 font-bold text-territory-brand">Histórico</button></div>
      <div className="mt-4 flex items-center gap-2"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" /><input className="h-10 w-full rounded-lg border border-territory-border bg-territory-surface pl-9 pr-3 text-sm outline-none placeholder:text-territory-muted focus:border-territory-brand" placeholder="Buscar entrega" /></label><Button type="button" variant="outline" onClick={() => toast.info("Os filtros ficarão disponíveis quando conectados.")} className="h-10 border-territory-border bg-territory-surface text-xs font-semibold text-territory-ink">Todos os status <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" /></Button></div>
      <div className="mt-3 space-y-2"><DesktopHistoryRow delivery={COMPLETION_HISTORY[0]} onOpenProof={onOpenProof} /><DesktopHistoryRow delivery={COMPLETION_HISTORY[1]} onOpenProof={onOpenProof} /></div>
    </>
  );

  return <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]"><section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-4 lg:p-5">{leftContent}</section><DesktopCompletionAside screen={screen} /></div>;
}

function DesktopHistoryRow({ delivery, onOpenProof }: { delivery: CompletionDeliveryData; onOpenProof: () => void }) {
  return <div className="flex items-center gap-3 rounded-lg border border-territory-border px-3 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Receipt className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-territory-ink">{delivery.id} · {delivery.storeName}</p><p className="mt-1 text-xs text-territory-muted">Hoje, {delivery.deliveryTime} · Valor registrado {delivery.deliveryValue}</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Entregue</span><button type="button" onClick={onOpenProof} className="text-xs font-semibold text-blue-700">Ver detalhes</button></div>;
}

function DeliveryContent({ phase, onConfirmDelivery }: { phase: MobileDeliveryPhase; onConfirmDelivery?: () => void }) {
  if (phase === "offer") return <DesktopRequestContent />;

  return (
    <div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
      <MapCanvas mode="delivery" />
      <section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-3 md:h-full lg:p-4">
        <div className="flex items-start gap-3 border-b border-territory-border pb-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><UserRound className="h-5 w-5 text-territory-brand" aria-hidden="true" /></span><div><h2 className="font-heading text-base font-bold text-territory-ink">Ana Oliveira</h2><p className="text-xs text-territory-muted">Rua Exemplo, 120 · Casa 2</p><p className="text-xs text-territory-muted">Nordeste de Amaralina · Salvador</p></div></div>
        <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-territory-muted">Referência: portão azul</div>
        <ProgressSteps />
        <Button type="button" onClick={() => toast.info("A navegação será aberta quando o rastreamento estiver conectado.")} className="mt-auto min-h-10 w-full rounded-lg bg-territory-brand text-sm font-bold text-white hover:bg-territory-brand/90"><Navigation className="mr-2 h-4 w-4" aria-hidden="true" />Abrir navegação</Button>
        <div className="mt-2 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => toast.info("O contato será aberto quando conectado.")} className="h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink hover:bg-territory-raised"><MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com cliente</Button><Button type="button" onClick={onConfirmDelivery ?? (() => toast.success("Entrega confirmada na demonstração."))} className="h-10 bg-territory-sun text-xs font-bold text-territory-ink hover:bg-territory-sun/85"><Check className="mr-1.5 h-4 w-4" aria-hidden="true" />Confirmar entrega</Button></div>
        <div className="mt-2 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => toast.info("O registro de problema será aberto quando conectado.")} className="h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink hover:bg-territory-raised"><AlertCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />Registrar problema</Button><Button type="button" variant="outline" onClick={() => toast.info("O contato com a loja será aberto quando conectado.")} className="h-10 border-territory-border bg-territory-surface text-xs font-bold text-territory-ink hover:bg-territory-raised"><Store className="mr-1.5 h-4 w-4" aria-hidden="true" />Falar com a loja</Button></div>
      </section>
    </div>
  );
}

function ProgressSteps({ currentStep = "delivery" }: { currentStep?: "pickup" | "delivery" }) {
  return <div className="mt-5 flex items-start"><ProgressStep label="Coleta" state={currentStep === "pickup" ? "current" : "done"} /><ProgressStep label="Entrega" state={currentStep === "delivery" ? "current" : "pending"} /><ProgressStep label="Conclusão" state="pending" /></div>;
}

function ProgressStep({ label, state }: { label: string; state: "done" | "current" | "pending" }) {
  return <div className="relative flex flex-1 flex-col items-center gap-1 text-center text-[0.65rem] text-territory-muted before:absolute before:left-0 before:right-1/2 before:top-3 before:h-0.5 before:bg-territory-border after:absolute after:left-1/2 after:right-0 after:top-3 after:h-0.5 after:bg-territory-border first:before:hidden last:after:hidden"><span className={cn("relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 bg-territory-surface", state === "done" ? "border-territory-brand bg-territory-brand text-white" : state === "current" ? "border-territory-brand text-territory-brand" : "border-slate-300 text-slate-300")}>{state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}</span>{label}</div>;
}

function EarningsContent() {
  return (
    <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 lg:gap-4">
      <div className="grid gap-2 md:grid-cols-3 lg:gap-3"><MetricCard icon={CheckCircle2} label="Entregas concluídas" value="2" tone="green" /><MetricCard icon={Coins} label="Valores registrados" value="R$ 15,00" tone="yellow" /><MetricCard icon={CalendarDays} label="Período" value="Hoje" tone="blue" /></div>
      <InfoNotice icon={Info}>Valores registrados não representam saldo disponível para saque.</InfoNotice>
      <section className="min-h-0 overflow-hidden rounded-xl border border-territory-border bg-territory-surface md:flex-1"><div className="grid grid-cols-[0.75fr_1.4fr_1fr_0.8fr_0.6fr] gap-2 bg-slate-100 px-3 py-2.5 text-[0.65rem] font-bold text-territory-muted lg:gap-3 lg:px-4 lg:py-3 lg:text-xs"><span>Entrega</span><span>Origem</span><span>Situação</span><span>Valor</span><span>Detalhes</span></div><EarningRow number="#1042" origin="Sabores da Ana" value="R$ 7,00" /><EarningRow number="#1038" origin="Mercado da Praça" value="R$ 8,00" /></section>
      <button type="button" onClick={() => toast.info("Comprovantes e histórico detalhado ficarão disponíveis quando conectados.")} className="flex w-full items-center gap-3 rounded-xl border border-territory-border bg-territory-surface p-4 text-left"><FileText className="h-6 w-6 text-territory-brand" aria-hidden="true" /><div className="flex-1"><p className="text-sm font-bold">Comprovantes e histórico</p><p className="text-xs text-territory-muted">Consulte os detalhes de cada entrega.</p></div><ArrowRight className="h-4 w-4 text-territory-muted" aria-hidden="true" /></button>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "green" | "yellow" | "blue" }) {
  const styles = { green: "bg-emerald-50 text-emerald-700", yellow: "bg-amber-50 text-amber-700", blue: "bg-sky-50 text-sky-700" };
  return <div className={cn("flex items-center gap-3 rounded-xl border border-territory-border p-4", styles[tone])}><Icon className="h-6 w-6" aria-hidden="true" /><div><p className="text-xs text-territory-muted">{label}</p><p className="font-heading text-xl font-bold text-territory-ink">{value}</p></div></div>;
}

function InfoNotice({ children, icon: Icon = Info, className }: { children: ReactNode; icon?: LucideIcon; className?: string }) {
  return <div className={cn("flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-territory-muted", className)}><Icon className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />{children}</div>;
}

function EarningRow({ number, origin, value }: { number: string; origin: string; value: string }) {
  return <div className="grid grid-cols-[0.75fr_1.4fr_1fr_0.8fr_0.6fr] items-center gap-3 border-t border-territory-border px-4 py-3 text-xs"><span className="font-semibold">{number}</span><span>{origin}</span><span><span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-800">Entregue</span></span><span className="font-semibold">{value}</span><button type="button" onClick={() => toast.info("Detalhes ficarão disponíveis quando conectados.")} className="text-left font-semibold text-blue-700">Ver <ArrowRight className="inline h-3 w-3" aria-hidden="true" /></button></div>;
}

const DELIVERY_AREAS = ["Santa Cruz", "Nordeste de Amaralina", "Vale das Pedrinhas", "Chapada"] as const;

function DeliveryAreaMap() {
  const neighborhoods = useMemo(
    () => DELIVERY_AREAS.map((name) => ({ name, city: "Salvador", state: "BA" })),
    [],
  );
  const { namedBounds, center, isLoading } = useNeighborhoodBounds({
    neighborhoods,
    enabled: true,
  });
  const polygons = useMemo(
    () => namedBounds.map((area) => ({
      name: area.name,
      coordinates: area.bounds,
      center: area.center,
      color: area.color,
      fillOpacity: 0.22,
      lineWidth: 3,
      lineOpacity: 0.95,
    })),
    [namedBounds],
  );

  return (
    <div className="relative mt-3 h-48 overflow-hidden rounded-lg border border-territory-border bg-[#e5eeee] lg:mt-4 lg:h-56">
      <MapLibreAdapter
        styleUrl={DEFAULT_TILE_STYLE.styleUrl}
        initialViewport={{ center: { latitude: center[0], longitude: center[1] }, zoom: 13 }}
        territoryPolygons={polygons}
        fitTerritoryBounds={polygons.length > 0}
        territoryFitPadding={24}
        territoryFitMaxZoom={14}
        controls={{}}
        attribution={false}
        hideNavigationControl
        interactive={false}
        className="h-full w-full"
      />
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 shadow-sm lg:left-4 lg:top-4">
        <p className="flex items-center gap-2 text-xs font-bold text-territory-ink"><span className="h-2.5 w-2.5 rounded-full bg-territory-brand" />Áreas de atuação</p>
        <p className="mt-0.5 text-[0.7rem] text-territory-muted">
          {isLoading
            ? "Carregando delimitações…"
            : polygons.length > 0
              ? `${polygons.length} bairros selecionados`
              : "Delimitações indisponíveis no momento"}
        </p>
      </div>
    </div>
  );
}

function AvailabilityContent({ isOnline, onToggleOnline }: { isOnline: boolean; onToggleOnline: () => void }) {
  return <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 lg:gap-4"><div className="grid min-h-0 gap-3 md:flex-1 md:grid-cols-2"><section className="flex flex-col rounded-xl border border-territory-border bg-territory-surface p-3 lg:p-4"><div className="flex items-start gap-2.5 border-b border-territory-border pb-3 lg:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 lg:h-10 lg:w-10"><MapPin className="h-4 w-4 text-emerald-700 lg:h-5 lg:w-5" aria-hidden="true" /></span><div><h2 className="font-heading text-sm font-bold lg:text-base">Área de atuação</h2><p className="text-[0.7rem] text-territory-muted lg:text-xs">Escolha onde deseja receber ofertas.</p></div></div><DeliveryAreaMap /><div className="mt-3 space-y-2 text-xs lg:mt-4 lg:space-y-3 lg:text-sm">{DELIVERY_AREAS.map((area) => <div key={area} className="flex items-center gap-2.5 lg:gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-600 lg:h-5 lg:w-5" aria-hidden="true" /><span>{area}</span></div>)}</div><div className="mt-auto flex items-center justify-between border-t border-territory-border pt-3 text-[0.7rem] lg:mt-auto lg:pt-4 lg:text-xs"><span className="flex items-center gap-2 text-territory-muted"><MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden="true" />Salvador · Bahia</span><button type="button" onClick={() => toast.info("O gerenciamento de áreas ficará disponível quando conectado.")} className="font-semibold text-blue-700">Gerenciar áreas <ArrowRight className="inline h-3 w-3" aria-hidden="true" /></button></div></section><section className="flex flex-col rounded-xl border border-territory-border bg-territory-surface p-3 lg:p-4"><div className="flex items-start gap-2.5 border-b border-territory-border pb-3 lg:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 lg:h-10 lg:w-10"><UserRound className="h-4 w-4 text-territory-brand lg:h-5 lg:w-5" aria-hidden="true" /></span><div><h2 className="font-heading text-sm font-bold lg:text-base">Perfil operacional</h2><p className="text-[0.7rem] text-territory-muted lg:text-xs">Carlos Santos · Motoboy</p></div></div><div className="mt-3 flex items-center gap-2 text-[0.7rem] text-emerald-700 lg:mt-4 lg:text-xs"><CheckCircle2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden="true" />Entregas habilitadas</div><div className="mt-4 flex items-center gap-3 border-t border-territory-border pt-3 lg:mt-5 lg:pt-4"><Bike className="h-7 w-7 text-territory-brand lg:h-8 lg:w-8" aria-hidden="true" /><div><p className="text-xs font-bold lg:text-sm">Motocicleta</p><p className="text-[0.7rem] text-territory-muted lg:text-xs">Honda CG 160 · Placa ABC1D23</p></div></div><button type="button" onClick={() => toast.info("O cadastro ficará disponível quando conectado.")} className="mt-auto pt-4 text-left text-[0.7rem] font-semibold text-blue-700 lg:text-xs">Ver cadastro e veículo <ArrowRight className="inline h-3 w-3" aria-hidden="true" /></button></section></div><section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 lg:px-4 lg:py-3"><div className="flex items-start gap-2.5 lg:gap-3"><MapPin className="mt-0.5 h-4 w-4 text-amber-700 lg:h-5 lg:w-5" aria-hidden="true" /><div><p className="text-xs font-bold text-amber-950 lg:text-sm">Localização desativada</p><p className="text-[0.7rem] text-amber-900/75 lg:text-xs">Ative a localização para receber ofertas próximas.</p></div></div><Button type="button" onClick={() => { onToggleOnline(); toast.success("Localização ativada na demonstração."); }} className="h-8 bg-territory-sun px-3 text-[0.7rem] font-bold text-territory-ink hover:bg-territory-sun/85 lg:h-9 lg:text-xs">Ativar localização</Button></section><InfoNotice icon={CircleOff}>{isOnline ? "Você está disponível para novas ofertas." : "O botão ficar online será liberado após ativar a localização."}</InfoNotice></div>;
}

function StateContent({ state, phase, completionScreen, isOnline, onToggleOnline, onOpenOffer, onConfirmDelivery, onConfirmProof, onRegisterProblem, onRetryCompletion, onBackToDelivery, onOpenProof }: { state: DriverCenterState; phase: MobileDeliveryPhase; completionScreen?: CompletionScreen | null; isOnline: boolean; onToggleOnline: () => void; onOpenOffer: () => void; onConfirmDelivery?: () => void; onConfirmProof: (proof: DeliveryProof) => void; onRegisterProblem: (reason: string, details: string) => void; onRetryCompletion: () => void; onBackToDelivery: () => void; onOpenProof: () => void }) {
  return (
    <div className={cn(
      "flex min-h-0 flex-col",
      state === "availability"
        ? "md:flex-none"
        : "md:h-[clamp(420px,calc((100vw-16rem)/1.72),calc(100dvh-11rem))] md:flex-none",
    )}>
      {state === "overview" ? <><div className="md:hidden"><MobileOverviewContent isOnline={isOnline} onToggleOnline={onToggleOnline} onOpenOffer={onOpenOffer} /></div><div className="hidden min-h-0 md:flex md:flex-1"><OverviewContent /></div></> : null}
      {state === "delivery" ? <>{completionScreen ? <><div className="md:hidden"><MobileCompletionContent screen={completionScreen} onConfirmProof={onConfirmProof} onRegisterProblem={onRegisterProblem} onRetry={onRetryCompletion} onBack={onBackToDelivery} onOpenProof={onOpenProof} /></div><div className="hidden min-h-0 md:flex md:flex-1"><DesktopCompletionContent screen={completionScreen} onConfirmProof={onConfirmProof} onRegisterProblem={onRegisterProblem} onRetry={onRetryCompletion} onBack={onBackToDelivery} onOpenProof={onOpenProof} /></div></> : <><div className="md:hidden"><MobileDeliveryContent phase={phase} onConfirmDelivery={onConfirmDelivery} /></div><div className="hidden min-h-0 md:flex md:flex-1"><DeliveryContent phase={phase} onConfirmDelivery={onConfirmDelivery} /></div></>}</> : null}
      {state === "earnings" ? <EarningsContent /> : null}
      {state === "availability" ? <AvailabilityContent isOnline={isOnline} onToggleOnline={onToggleOnline} /> : null}
    </div>
  );
}

export default function CentralMotoboyConceptMockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseState(searchParams.get("state"));
  const phase = parseMobileDeliveryPhase(searchParams.get("phase"));
  const completionScreen = searchParams.get("section") === "completion" ? parseCompletionScreen(searchParams.get("screen")) : null;
  const [isOnline, setIsOnline] = useState(true);

  if (state === "earnings") {
    return <Navigate to="/central/motoboy/ganhos?concept-mock=1&view=summary" replace />;
  }

  const changeState = (next: DriverCenterState) => {
    if (next === "earnings") {
      window.location.assign("/central/motoboy/ganhos?concept-mock=1&view=summary");
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", next);
    nextParams.delete("section");
    nextParams.delete("screen");
    if (next !== "delivery" || state !== "delivery") nextParams.delete("phase");
    setSearchParams(nextParams);
  };

  const openOffer = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", "delivery");
    nextParams.set("phase", "offer");
    nextParams.delete("section");
    nextParams.delete("screen");
    setSearchParams(nextParams);
  };

  const openCompletionScreen = (screen: CompletionScreen) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", "delivery");
    nextParams.set("section", "completion");
    nextParams.set("screen", screen);
    nextParams.delete("phase");
    setSearchParams(nextParams);
  };

  const openCompletionProof = () => openCompletionScreen("proof");

  const confirmProof = (proof: DeliveryProof) => {
    if (!proof.observation?.trim()) {
      toast.error("Descreva como a entrega foi realizada.");
      return;
    }

    toast.success("Comprovante salvo na demonstração.");
    openCompletionScreen("history");
  };

  const registerProblem = (reason: string, details: string) => {
    if (!reason.trim()) {
      toast.error("Selecione um motivo para continuar.");
      return;
    }

    if (reason === "Outro motivo" && !details.trim()) {
      toast.error("Descreva o motivo do problema.");
      return;
    }

    toast.success(`Ocorrência registrada: ${reason}${details ? "." : " na demonstração."}`);
    openCompletionScreen("history");
  };

  const backToDelivery = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", "delivery");
    nextParams.set("phase", "delivery");
    nextParams.delete("section");
    nextParams.delete("screen");
    setSearchParams(nextParams);
  };

  const toggleOnline = () => {
    setIsOnline((current) => !current);
    toast.success(isOnline ? "Você ficou offline." : "Você está disponível para receber ofertas.");
  };

  return (
    <>
      <Helmet><title>Central do entregador | achegue-se.</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-[#fbfaf7] text-territory-ink">
        <Sidebar state={state} onChange={changeState} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <MobileTopBar state={state} phase={phase} completionScreen={completionScreen} />
            <main className="min-h-0 min-w-0 flex-1 overflow-hidden md:overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full flex-col gap-3 p-3 md:gap-3 md:p-4 xl:gap-4 xl:p-8">
              <div className="hidden md:block">
                <PageHeader state={state} phase={phase} completionScreen={completionScreen} isOnline={isOnline} onToggleOnline={toggleOnline} />
              </div>
              <div className="flex min-h-0 flex-col md:flex-1">
                <StateContent state={state} phase={phase} completionScreen={completionScreen} isOnline={isOnline} onToggleOnline={toggleOnline} onOpenOffer={openOffer} onConfirmDelivery={openCompletionProof} onConfirmProof={confirmProof} onRegisterProblem={registerProblem} onRetryCompletion={openCompletionProof} onBackToDelivery={backToDelivery} onOpenProof={openCompletionProof} />
              </div>
              {state === "overview" || completionScreen === "history" ? <MobileBottomNav state={completionScreen === "history" ? "delivery" : state} onChange={changeState} /> : null}
              <p className="mt-auto hidden pt-1 text-center text-[0.65rem] text-territory-muted md:block lg:pt-2 lg:text-xs">Conceito proposto · Dados e mapas ilustrativos · Melhorias dependem de habilitação e regras operacionais.</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
