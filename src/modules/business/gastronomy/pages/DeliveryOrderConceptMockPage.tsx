import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bike,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coins,
  FileText,
  HelpCircle,
  History,
  Info,
  MapPin,
  MessageCircle,
  Search,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";

type DeliveryState = "own" | "request" | "searching" | "unavailable";
type ActionStyle = "brand" | "sun" | "outline" | "help";

type DeliveryStateConfig = {
  id: DeliveryState;
  label: string;
  title: string;
  icon: LucideIcon;
};

type FooterAction = {
  label: string;
  style: ActionStyle;
  icon?: LucideIcon;
  onClick: () => void;
};

const stateOptions: DeliveryStateConfig[] = [
  { id: "own", label: "Entrega própria", title: "Entrega própria", icon: Truck },
  { id: "request", label: "Solicitar motoboy", title: "Solicitar motoboy", icon: Bike },
  { id: "searching", label: "Em busca", title: "Buscando entregador", icon: Search },
  { id: "unavailable", label: "Indisponível", title: "Nenhum entregador disponível", icon: CircleAlert },
];

function parseState(value: string | null): DeliveryState {
  return stateOptions.some((option) => option.id === value) ? (value as DeliveryState) : "own";
}

function getStateConfig(state: DeliveryState) {
  return stateOptions.find((option) => option.id === state) ?? stateOptions[0];
}

function MobileHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-territory-border bg-territory-surface px-1">
      <button
        type="button"
        aria-label="Voltar para entregas"
        onClick={() => toast.info("Voltando para a lista de entregas.")}
        className="rounded-lg p-1 text-territory-ink"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="text-sm font-bold text-territory-ink">Entregas</span>
    </header>
  );
}

function OrderIntro() {
  return (
    <section className="flex items-center gap-3" aria-label="Pedido">
      <img
        src={foodImage}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-territory-border"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-territory-ink">Sabores da Ana</p>
        <h1 className="font-heading text-xl font-bold leading-tight tracking-[-0.045em] text-territory-ink">
          Pedido #1042
        </h1>
        <p className="mt-1 text-xs text-territory-muted">Ana Oliveira · Santa Cruz</p>
      </div>
    </section>
  );
}

function ReadyBanner() {
  return (
    <section
      className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-emerald-900"
      aria-label="Pedido pronto para coleta"
    >
      <UtensilsCrossed className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold">Pronto para coleta</p>
        <p className="text-xs">O pedido está pronto na cozinha.</p>
      </div>
    </section>
  );
}

function MobileActionFooter({ state }: { state: DeliveryState }) {
  const footer = getFooterModel(state);
  const compact = state === "unavailable";

  return (
    <div className={cn(
      "shrink-0 bg-territory-surface/95 pb-[env(safe-area-inset-bottom)] pt-2",
      compact ? "mt-1" : "mt-2",
    )}>
      <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2")}>
        {footer.heading ? <p className="text-sm font-bold text-territory-ink">{footer.heading}</p> : null}
        {footer.actions.map((action) => (
          <FooterActionButton key={action.label} action={action} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function FooterActionButton({ action, compact = false }: { action: FooterAction; compact?: boolean }) {
  const Icon = action.icon;

  if (action.style === "help") {
    return (
      <button
        type="button"
        onClick={action.onClick}
        className={cn(
          "flex w-full items-center justify-center gap-2 text-sm font-semibold text-territory-ink",
          compact ? "min-h-8" : "min-h-9",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {action.label}
      </button>
    );
  }

  const isOutline = action.style === "outline";
  const colorClass = isOutline
    ? "border-territory-border bg-territory-surface text-territory-ink"
    : action.style === "sun"
      ? "bg-territory-sun text-territory-ink hover:bg-territory-sun/85"
      : "bg-territory-brand text-white hover:bg-territory-brand/90";

  return (
    <Button
      type="button"
      variant={isOutline ? "outline" : "default"}
      onClick={action.onClick}
      className={cn(
        "w-full rounded-xl text-sm font-bold",
        compact ? "min-h-9" : "min-h-10",
        action.style === "brand" || action.style === "sun" ? (compact ? "min-h-10" : "min-h-11") : null,
        colorClass,
      )}
    >
      {Icon ? <Icon className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
      {action.label}
    </Button>
  );
}

function DeliveryCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-territory-border bg-territory-surface p-2.5">
      <h2 className="flex items-center gap-2.5 border-b border-territory-border pb-2 font-heading text-lg font-bold tracking-[-0.035em] text-territory-ink">
        <Icon className="h-7 w-7 shrink-0 text-territory-brand" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function InfoNotice({
  children,
  tone = "neutral",
  compact = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "warning";
  compact?: boolean;
}) {
  const Icon = tone === "warning" ? CircleAlert : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 text-sm",
        compact ? "py-2" : "py-2.5",
        tone === "warning" ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-800",
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function Collection() {
  return (
    <div className="flex items-start gap-3 border-b border-territory-border pb-4">
      <Store className="h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold">Coleta</p>
        <p className="text-sm text-territory-muted">Sabores da Ana · Santa Cruz</p>
      </div>
    </div>
  );
}

function OrderSummary() {
  return (
    <section className="border-t border-territory-border pt-2">
      <div className="flex items-center gap-2.5">
        <FileText className="h-5 w-5 text-territory-brand" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-territory-ink">Resumo do pedido</p>
          <p className="text-sm leading-tight text-territory-ink">2 itens · R$ 54,00</p>
          <p className="text-xs leading-tight text-territory-muted">(R$ 49,00 em produtos + R$ 5,00 de taxa)</p>
        </div>
        <button
          type="button"
          onClick={() => toast.info("Os itens do pedido serão exibidos quando conectados aos dados reais.")}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-territory-brand"
        >
          Ver itens
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function Destination({ divider = true }: { divider?: boolean }) {
  return (
    <section className={cn(divider ? "border-t border-territory-border pt-2" : null)}>
      <div className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-territory-brand" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold text-territory-ink">Destino</p>
          <p className="text-sm leading-tight text-territory-ink">Rua Exemplo, 120 · Casa 2</p>
          <p className="text-sm leading-tight text-territory-muted">Santa Cruz, Salvador · BA</p>
        </div>
      </div>
    </section>
  );
}

function HistoryRow({ label, icon: Icon = History }: { label: string; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} será expandido quando houver histórico do pedido.`)}
      className="flex min-h-9 w-full items-center gap-2.5 border-t border-territory-border pt-2 text-left"
    >
      <Icon className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
      <span className="flex-1 text-sm font-semibold text-territory-ink">{label}</span>
      <ChevronDown className="h-4 w-4 text-territory-muted" aria-hidden="true" />
    </button>
  );
}

function FeeSummary() {
  return (
    <div className="rounded-xl bg-amber-50 px-3 py-3">
      <div className="flex items-start gap-3">
        <Coins className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-territory-ink">Taxa apresentada ao cliente</p>
            <Info className="h-5 w-5 shrink-0 text-territory-ink" aria-hidden="true" />
          </div>
          <p className="mt-1 font-heading text-2xl font-bold text-territory-ink">R$ 7,00</p>
          <p className="text-xs text-territory-muted">Total estimado do pedido: R$ 56,00</p>
          <p className="mt-1 text-[0.6875rem] text-territory-muted">
            (R$ 49,00 em produtos + R$ 5,00 de taxa + R$ 7,00 de entrega)
          </p>
        </div>
      </div>
    </div>
  );
}

function StateBody({ state }: { state: DeliveryState }) {
  if (state === "own") {
    return (
      <div className="space-y-3">
        <InfoNotice>
          Sem rastreamento vinculado
          <br />
          <span className="text-xs font-normal leading-snug">
            Atualize o andamento quando sua equipe sair para entregar.
          </span>
        </InfoNotice>
        <OrderSummary />
        <Destination />
        <HistoryRow label="Histórico do pedido" />
      </div>
    );
  }

  if (state === "request") {
    return (
      <div className="space-y-4">
        <Collection />
        <Destination divider={false} />
        <FeeSummary />
        <InfoNotice>A solicitação inicia a busca. O aceite depende de um entregador disponível.</InfoNotice>
      </div>
    );
  }

  if (state === "searching") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-slate-200 border-t-territory-brand"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-heading text-lg font-bold tracking-[-0.035em]">Aguardando aceite</h2>
          <p className="mt-1 max-w-[15rem] text-sm text-territory-muted">
            Você será avisado quando um entregador aceitar.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-3 text-sm">
          <Clock3 className="h-5 w-5 shrink-0" aria-hidden="true" />
          Solicitação enviada às 12:22
        </div>
        <Collection />
        <Destination divider={false} />
        <HistoryRow icon={FileText} label="Itens e valores" />
        <HistoryRow label="Histórico da solicitação" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <InfoNotice compact tone="warning">Não encontramos um motoboy para esta solicitação.</InfoNotice>
      <Collection />
      <Destination divider={false} />
      <InfoNotice compact>
        Pedido mantido
        <br />
        <span className="text-sm font-normal">O pedido continua pronto para coleta na sua loja.</span>
      </InfoNotice>
      <InfoNotice compact>Combine com o cliente antes de mudar a modalidade ou o valor.</InfoNotice>
    </div>
  );
}

function getFooterModel(state: DeliveryState): { heading?: string; actions: FooterAction[] } {
  const openOrder = () => toast.info("O pedido será aberto quando estiver conectado aos dados reais.");
  const openHelp = () => toast.info("A central de ajuda será aberta quando estiver disponível.");

  if (state === "own") {
    return {
      actions: [
        {
          label: "Marcar saiu para entrega",
          style: "brand",
          onClick: () => toast.success("Pedido marcado como saiu para entrega."),
        },
        { label: "Ver pedido", style: "outline", onClick: openOrder },
        { label: "Preciso de ajuda", style: "help", icon: HelpCircle, onClick: openHelp },
      ],
    };
  }

  if (state === "request") {
    return {
      actions: [
        {
          label: "Solicitar entrega",
          style: "sun",
          onClick: () => toast.success("Solicitação de entrega enviada."),
        },
        { label: "Ver pedido", style: "outline", onClick: openOrder },
        { label: "Preciso de ajuda", style: "help", icon: HelpCircle, onClick: openHelp },
      ],
    };
  }

  if (state === "searching") {
    return {
      actions: [
        { label: "Ver pedido", style: "brand", onClick: openOrder },
        { label: "Preciso de ajuda", style: "help", icon: HelpCircle, onClick: openHelp },
      ],
    };
  }

  return {
    heading: "Como deseja continuar?",
    actions: [
      {
        label: "Tentar nova busca",
        style: "sun",
        onClick: () => toast.success("Uma nova busca foi iniciada."),
      },
      {
        label: "Ver alternativas",
        style: "outline",
        onClick: () => toast.info("As alternativas disponíveis serão exibidas quando conectadas à operação."),
      },
      {
        label: "Falar com o cliente",
        style: "outline",
        icon: MessageCircle,
        onClick: () => toast.info("O contato com o cliente será aberto quando o pedido estiver conectado."),
      },
      { label: "Preciso de ajuda", style: "help", icon: HelpCircle, onClick: openHelp },
    ],
  };
}

function DeliveryStateView({ state }: { state: DeliveryState }) {
  const config = getStateConfig(state);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <DeliveryCard icon={config.icon} title={config.title}>
        <StateBody state={state} />
      </DeliveryCard>
      <MobileActionFooter state={state} />
    </div>
  );
}

function DesktopBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline font-heading font-bold tracking-[-0.055em] text-white", compact ? "text-lg" : "text-2xl")}>
      achegue-se<span className="ml-0.5 text-territory-sun">.</span>
    </span>
  );
}

function DesktopSidebar({ compact = false }: { compact?: boolean }) {
  const items = [
    { label: "Pedidos", icon: ClipboardList },
    { label: "Entregas", icon: Truck, active: true },
    { label: "Cardápio", icon: UtensilsCrossed },
    { label: "Conversas", icon: MessageCircle },
  ];

  return (
    <aside className={cn("hidden shrink-0 flex-col border-r border-territory-border bg-territory-surface py-3 lg:flex", compact ? "w-28 px-2" : "w-56 px-4 py-5")} aria-label="Navegação da loja">
      <nav className={cn("space-y-1", compact ? "mt-3" : "mt-6")}>
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            onClick={() => active ? undefined : toast.info(`${label} ficará disponível nesta próxima etapa.`)}
            className={cn(
              "flex w-full items-center rounded-xl text-left font-semibold",
              compact ? "min-h-8 justify-center px-2" : "min-h-10 gap-3 px-3 text-sm",
              active ? "bg-[#dff1ee] text-territory-brand" : "text-territory-ink hover:bg-territory-canvas",
            )}
          >
            <Icon className={cn("shrink-0", compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden="true" />
            {!compact ? <span>{label}</span> : null}
          </button>
        ))}
      </nav>
      <div className={cn("mt-auto rounded-xl bg-territory-canvas text-xs text-territory-muted", compact ? "hidden" : "p-3")}>
        <p className="font-semibold text-territory-ink">Boa comida, mais perto.</p>
        <span className="mt-2 block h-0.5 w-8 bg-territory-sun" />
      </div>
    </aside>
  );
}

function DesktopTopBar({ compact = false }: { compact?: boolean }) {
  return (
    <header className={cn("flex shrink-0 items-center justify-between bg-territory-brand text-white", compact ? "h-9 px-3" : "h-14 px-5 xl:px-7")}>
      <DesktopBrand compact={compact} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toast.info("A troca de loja ficará disponível nesta próxima etapa.")}
          className={cn("flex items-center gap-2 rounded-xl border border-white/20 font-semibold text-white", compact ? "rounded-md px-2 py-1 text-[0.625rem]" : "px-3 py-2 text-sm")}
        >
          <Store className={cn(compact ? "h-3 w-3" : "h-4 w-4")} aria-hidden="true" />
          Sabores da Ana
          <ChevronDown className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-white/70")} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => toast.info("O perfil ficará disponível nesta próxima etapa.")}
          className={cn("flex items-center gap-2 rounded-xl border border-white/20 font-semibold text-white", compact ? "rounded-md px-2 py-1 text-[0.625rem]" : "px-3 py-2 text-sm")}
        >
          <span className={cn("flex items-center justify-center rounded-full bg-white font-bold text-territory-brand", compact ? "h-4 w-4 text-[0.5rem]" : "h-7 w-7 text-xs")}>A</span>
          Ana
          <ChevronDown className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-white/70")} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function DesktopStatusBadge({ state }: { state: DeliveryState }) {
  const styles: Record<DeliveryState, string> = {
    own: "bg-emerald-100 text-emerald-900",
    request: "bg-amber-100 text-amber-900",
    searching: "bg-sky-100 text-sky-900",
    unavailable: "bg-rose-100 text-rose-900",
  };
  const labels: Record<DeliveryState, string> = {
    own: "Pronto para coleta",
    request: "Pronto para coleta",
    searching: "Pronto para coleta",
    unavailable: "Pronto para coleta",
  };

  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", styles[state])}>{labels[state]}</span>;
}

function DesktopDetails({ state }: { state: DeliveryState }) {
  return (
    <aside className="min-h-0 overflow-y-auto rounded-xl border border-territory-border bg-territory-surface p-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-territory-ink">Coleta (restaurante)</h2>
        <div className="mt-2 flex items-start gap-2 text-sm">
          <Store className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
          <div>
            <p className="font-semibold text-territory-ink">Sabores da Ana</p>
            <p className="text-territory-muted">Santa Cruz, Salvador · BA</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 border-b border-territory-border pb-4 text-sm">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
          <div>
            <p className="font-semibold text-territory-ink">Rua Exemplo, 120 · Casa 2</p>
            <p className="text-territory-muted">Santa Cruz, Salvador · BA</p>
          </div>
        </div>
        <div className="border-b border-territory-border py-4">
          <h3 className="text-sm font-bold text-territory-ink">Itens do pedido</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-territory-ink">1× Moqueca individual + farofa extra</span><span className="shrink-0 font-semibold">R$ 41,00</span></div>
            <div className="flex justify-between gap-3"><span className="text-territory-ink">1× Suco natural</span><span className="shrink-0 font-semibold">R$ 8,00</span></div>
          </div>
        </div>
        <div className="border-b border-territory-border py-4">
          <h3 className="text-sm font-bold text-territory-ink">Pagamento</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-territory-muted">Produtos</span><span className="font-semibold">R$ 49,00</span></div>
            <div className="flex justify-between gap-3"><span className="text-territory-muted">{state === "own" ? "Entrega própria" : "Entrega (plataforma)"}</span><span className="font-semibold">{state === "own" ? "R$ 5,00" : "R$ 7,00"}</span></div>
            <div className="flex justify-between gap-3 border-t border-territory-border pt-2"><span className="font-bold">Total</span><span className="font-bold">R$ 56,00</span></div>
          </div>
        </div>
        <div className="py-4">
          <h3 className="text-sm font-bold text-territory-ink">Histórico</h3>
          <div className="mt-3 space-y-2 text-sm text-territory-muted">
            <p>Pedido confirmado · 12:05</p>
            <p>Pronto para coleta · 12:10</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DesktopHelpLink({ action }: { action: FooterAction }) {
  return (
    <button type="button" onClick={action.onClick} className="flex items-center gap-2 text-xs font-semibold text-territory-brand underline underline-offset-2">
      <HelpCircle className="h-4 w-4" aria-hidden="true" />
      Ajuda sobre a entrega da plataforma
    </button>
  );
}

function DesktopTimeline({ state }: { state: DeliveryState }) {
  const entries = state === "searching"
    ? [
        { label: "Pedido confirmado", time: "11:45", active: true },
        { label: "Solicitação enviada", time: "12:22", active: true },
        { label: "Buscando entregador", time: "Agora", active: true },
      ]
    : [
        { label: "Pedido confirmado", time: "11:45", active: true },
        { label: "Aguardando saída para entrega", time: "Agora", active: false },
      ];

  return (
    <div className="border-t border-territory-border pt-3">
      <h3 className="text-sm font-bold text-territory-ink">Histórico do pedido</h3>
      <div className="mt-3 space-y-2">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2 text-xs">
            <span className={cn("h-3 w-3 rounded-full", entry.active ? "bg-emerald-500" : "bg-slate-300")} />
            <span className={cn("flex-1", entry.active ? "text-territory-ink" : "text-territory-muted")}>{entry.label}</span>
            <span className="text-territory-muted">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopStateBody({ state }: { state: DeliveryState }) {
  const footer = getFooterModel(state);
  const helpAction = footer.actions.find((action) => action.style === "help");

  if (state === "own") {
    return (
      <div className="space-y-4">
        <InfoNotice>
          Sem rastreamento vinculado.
          <br />
          <span className="text-xs font-normal">Atualize o andamento quando sua equipe sair para entregar.</span>
        </InfoNotice>
        <div className="space-y-2">
          {footer.actions.slice(0, 2).map((action) => <FooterActionButton key={action.label} action={action} />)}
        </div>
        <DesktopTimeline state={state} />
      </div>
    );
  }

  if (state === "request") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-territory-muted">A solicitação inicia a busca. O aceite depende de um entregador disponível.</p>
        <div className="space-y-2">
          {footer.actions.slice(0, 2).map((action) => <FooterActionButton key={action.label} action={action} />)}
        </div>
        {helpAction ? <DesktopHelpLink action={helpAction} /> : null}
      </div>
    );
  }

  if (state === "searching") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-territory-brand" />
          <div>
            <p className="font-heading text-lg font-bold text-territory-ink">Aguardando aceite.</p>
            <p className="text-sm text-territory-muted">Você será avisado quando um entregador aceitar.</p>
          </div>
        </div>
        <p className="text-xs text-territory-muted">Solicitação enviada às 12:22.</p>
        <FooterActionButton action={footer.actions[0]} />
        {helpAction ? <DesktopHelpLink action={helpAction} /> : null}
        <DesktopTimeline state={state} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-territory-muted">Não encontramos um motoboy para esta solicitação.</p>
      <InfoNotice>
        Pedido mantido.
        <br />
        <span className="text-xs font-normal">O pedido continua pronto para coleta.</span>
      </InfoNotice>
      <div className="space-y-2">
        {footer.actions.slice(0, 3).map((action) => <FooterActionButton key={action.label} action={action} />)}
      </div>
      <InfoNotice>Combine com o cliente antes de mudar a modalidade ou o valor.</InfoNotice>
    </div>
  );
}

function DesktopStateView({ state }: { state: DeliveryState }) {
  const config = getStateConfig(state);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 border-b border-territory-border pb-3">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.045em] text-territory-ink">Pedido #1042</h1>
        <span className="text-sm text-territory-muted">Ana Oliveira · Santa Cruz</span>
        <DesktopStatusBadge state={state} />
        <span className="ml-auto hidden text-xs text-territory-muted xl:inline">Criado em 12/08/2024 às 11:45</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3">
        <section className="min-w-0 overflow-y-auto rounded-xl border border-territory-border bg-territory-surface p-4">
          <div className="flex items-center gap-3 border-b border-territory-border pb-3">
            <config.icon className={cn("h-8 w-8 shrink-0", state === "unavailable" ? "text-amber-700" : "text-territory-brand")} aria-hidden="true" />
            <h2 className={cn("font-heading text-xl font-bold tracking-[-0.04em]", state === "unavailable" ? "text-amber-800" : "text-territory-ink")}>
              {config.title}
            </h2>
          </div>
          <div className="mt-4">
            <DesktopStateBody state={state} />
          </div>
        </section>
        <DesktopDetails state={state} />
      </div>
    </div>
  );
}

function DesktopStateShell({ state }: { state: DeliveryState }) {
  return (
    <div className="delivery-concept-page hidden h-[100dvh] min-h-0 flex-col overflow-hidden bg-territory-canvas text-territory-ink md:flex">
      <DesktopTopBar />
      <div className="flex min-h-0 flex-1">
        <DesktopSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col overflow-y-auto p-5 xl:p-7">
            <DesktopStateView state={state} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DeliveryOrderConceptMockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseState(searchParams.get("state"));

  const changeState = (next: DeliveryState) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("concept-mock", "1");
    nextParams.set("state", next);
    setSearchParams(nextParams);
  };

  return (
    <>
      <Helmet>
        <title>Entregas | Sabores da Ana</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <DesktopStateShell state={state} />
      <div className="delivery-concept-page flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-territory-canvas text-territory-ink md:hidden">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full min-h-0 max-w-md flex-col px-4">
            <div className="min-h-0 flex-1 overflow-y-auto pb-0 pt-3 scrollbar-hide">
              <div className="flex min-h-full flex-col gap-3">
                <OrderIntro />
                <ReadyBanner />
                <DeliveryStateView state={state} />
              </div>
            </div>
          </div>
        </main>
        <div className="sr-only">
          {stateOptions.map((option) => (
            <button key={option.id} type="button" onClick={() => changeState(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
