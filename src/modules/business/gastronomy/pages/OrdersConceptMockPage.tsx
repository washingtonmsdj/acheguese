import { useMemo, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  BarChart3,
  Bike,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Grid2X2,
  LayoutList,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import ownerImage from "@/assets/persona-comerciante.jpg";

type OrderStage = "new" | "preparing" | "ready" | "delivery";
type PaymentFilter = "all" | "pending" | "paid";
type ModalityFilter = "all" | "delivery" | "pickup";
type ViewMode = "board" | "list";
type ConceptTab = "operation" | "customers" | "indicators";

type ConceptOrder = {
  id: string;
  number: string;
  customer: string;
  minutes: number;
  modality: "delivery" | "pickup";
  deliveryLabel: string;
  payment: "pending" | "paid";
  paymentLabel: string;
  total: string;
  stage: OrderStage;
  image: string;
};

type StageConfig = {
  id: OrderStage;
  label: string;
  tone: string;
  badge: string;
  icon: LucideIcon;
  actionLabel: string;
};

const stageConfig: StageConfig[] = [
  {
    id: "new",
    label: "Novos",
    tone: "bg-[hsl(var(--territory-sun)/0.23)]",
    badge: "bg-territory-sun/70 text-territory-ink",
    icon: ClipboardList,
    actionLabel: "Ver pedido",
  },
  {
    id: "preparing",
    label: "Em preparo",
    tone: "bg-sky-100/80",
    badge: "bg-sky-200 text-sky-900",
    icon: UtensilsCrossed,
    actionLabel: "Marcar pronto",
  },
  {
    id: "ready",
    label: "Prontos",
    tone: "bg-emerald-100/80",
    badge: "bg-emerald-200 text-emerald-900",
    icon: PackageCheck,
    actionLabel: "Marcar retirado",
  },
  {
    id: "delivery",
    label: "Em entrega",
    tone: "bg-rose-100/80",
    badge: "bg-rose-200 text-rose-900",
    icon: Bike,
    actionLabel: "Ver entrega",
  },
];

const initialOrders: ConceptOrder[] = [
  {
    id: "concept-order-1042",
    number: "1042",
    customer: "Ana Oliveira",
    minutes: 22,
    modality: "delivery",
    deliveryLabel: "Entrega própria",
    payment: "pending",
    paymentLabel: "PIX pendente",
    total: "R$ 54,00",
    stage: "new",
    image: foodImage,
  },
  {
    id: "concept-order-1045",
    number: "1045",
    customer: "Carla Mendes",
    minutes: 5,
    modality: "delivery",
    deliveryLabel: "Entrega própria",
    payment: "pending",
    paymentLabel: "PIX pendente",
    total: "R$ 29,00",
    stage: "new",
    image: foodImage,
  },
  {
    id: "concept-order-1040",
    number: "1040",
    customer: "Mariana Castro",
    minutes: 18,
    modality: "delivery",
    deliveryLabel: "Entrega própria",
    payment: "paid",
    paymentLabel: "Pagamento confirmado",
    total: "R$ 72,00",
    stage: "preparing",
    image: foodImage,
  },
  {
    id: "concept-order-1039",
    number: "1039",
    customer: "Pedro Santos",
    minutes: 12,
    modality: "pickup",
    deliveryLabel: "Retirada",
    payment: "paid",
    paymentLabel: "Pagamento confirmado",
    total: "R$ 36,00",
    stage: "ready",
    image: foodImage,
  },
  {
    id: "concept-order-1038",
    number: "1038",
    customer: "Beatriz Lima",
    minutes: 28,
    modality: "delivery",
    deliveryLabel: "Plataforma",
    payment: "paid",
    paymentLabel: "Pagamento confirmado",
    total: "R$ 62,00",
    stage: "delivery",
    image: foodImage,
  },
];

const customerRows = [
  { initials: "AO", name: "Ana Oliveira", phone: "(71) 98765-4321", orders: "5 pedidos", last: "Último em 12/04" },
  { initials: "MC", name: "Mariana Castro", phone: "(71) 91234-5678", orders: "3 pedidos", last: "Último em 11/04" },
  { initials: "PS", name: "Pedro Santos", phone: "(71) 99876-5432", orders: "4 pedidos", last: "Último em 10/04" },
];

const navItems: { label: string; icon: LucideIcon; tab?: ConceptTab }[] = [
  { label: "Visão geral", icon: Store },
  { label: "Cardápio", icon: UtensilsCrossed },
  { label: "Pedidos", icon: ClipboardList, tab: "operation" },
  { label: "Entregas", icon: Truck },
  { label: "Conversas", icon: MessageCircle },
  { label: "Equipe", icon: Users },
];

function ConceptBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline font-heading font-bold tracking-[-0.055em]", compact ? "text-lg text-territory-ink" : "text-[1.45rem] text-white")}>
      achegue-se<span className="ml-0.5 text-territory-sun">.</span>
    </span>
  );
}

function StoreIdentity({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center", mobile ? "gap-2" : "gap-3")}>
      <img src={foodImage} alt="" className={cn("shrink-0 rounded-xl object-cover", mobile ? "h-10 w-10" : "h-11 w-11")} />
      <div className="min-w-0">
        <p className={cn("truncate font-bold", mobile ? "text-sm" : "text-sm text-white")}>Sabores da Ana</p>
        <p className={cn("truncate text-xs", mobile ? "text-territory-muted" : "text-white/70")}>Comida caseira com mais sabor</p>
      </div>
    </div>
  );
}

function DesktopSidebar({ onTabChange }: { onTabChange: (tab: ConceptTab) => void }) {
  return (
    <aside className="hidden w-48 shrink-0 flex-col border-r border-white/15 bg-territory-brand px-3.5 py-5 text-white md:flex lg:w-52 lg:px-4" aria-label="Navegação da loja">
      <StoreIdentity />
      <nav className="mt-8 space-y-1">
        {navItems.map(({ label, icon: Icon, tab }) => {
          const active = label === "Pedidos";
          return (
            <button
              key={label}
              type="button"
              onClick={() => tab ? onTabChange(tab) : label === "Entregas" ? window.location.assign("/gastronomia/pedidos/concept-mock-modalidades?concept-mock=1&view=modalities") : toast.info(`${label} ficará disponível nesta próxima etapa.`)}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors",
                active ? "bg-territory-sun text-territory-ink" : "text-white/85 hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
              {label === "Conversas" ? <span className="ml-auto rounded-full bg-territory-error px-1.5 py-0.5 text-[0.625rem] font-bold">12</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/75">
        <p className="font-semibold text-white">Boa comida gera grandes histórias.</p>
        <span className="mt-2 block h-0.5 w-8 bg-territory-sun" />
      </div>
    </aside>
  );
}

function MobileHeader({ activeTab, onTabChange }: { activeTab: ConceptTab; onTabChange: (tab: ConceptTab) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <div className="flex items-center justify-between border-b border-territory-border pb-3">
        <ConceptBrand compact />
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Abrir menu" className="rounded-lg p-2 text-territory-ink">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <StoreIdentity mobile />
        <button type="button" onClick={() => onTabChange(activeTab)} className="rounded-lg border border-territory-border p-2 text-territory-ink" aria-label="Selecionar loja">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {menuOpen ? (
        <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-territory-border bg-territory-surface p-1.5 shadow-lg">
          {[
            { id: "operation" as const, label: "Pedidos", icon: ClipboardList },
            { id: "customers" as const, label: "Clientes", icon: Users },
            { id: "indicators" as const, label: "Indicadores", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => { onTabChange(id); setMenuOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold", activeTab === id ? "bg-territory-sun/20 text-territory-brand" : "text-territory-ink hover:bg-territory-raised")}>
              <Icon className="h-4 w-4" aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ConceptTabs({ activeTab, onTabChange }: { activeTab: ConceptTab; onTabChange: (tab: ConceptTab) => void }) {
  const tabs: { id: ConceptTab; label: string; icon: LucideIcon }[] = [
    { id: "operation", label: "Operação", icon: ClipboardList },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "indicators", label: "Indicadores", icon: BarChart3 },
  ];
  return (
    <div className="flex gap-5 border-b border-territory-border" role="tablist" aria-label="Visões de pedidos">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={cn(
            "relative flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-territory-muted",
            activeTab === id && "text-territory-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-territory-sun",
          )}
        >
          <Icon className="h-4 w-4 md:hidden" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

function FilterButton({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-10 items-center justify-between gap-3 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm text-territory-ink hover:bg-territory-raised", className)}>
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
    </button>
  );
}

function OrderFilters({
  search,
  onSearchChange,
  payment,
  onPaymentChange,
  modality,
  onModalityChange,
  viewMode,
  onViewModeChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  payment: PaymentFilter;
  onPaymentChange: (value: PaymentFilter) => void;
  modality: ModalityFilter;
  onModalityChange: (value: ModalityFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
      <label className="relative min-w-0 flex-1 md:min-w-[12rem]">
        <span className="sr-only">Buscar pedido ou cliente</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar pedido ou cliente..." className="min-h-10 border-territory-border bg-territory-surface pl-9 text-sm" />
      </label>
      <div className="grid shrink-0 grid-cols-2 gap-2 md:flex">
        <FilterButton className="md:w-32 lg:w-36" onClick={() => onPaymentChange(payment === "all" ? "pending" : payment === "pending" ? "paid" : "all")}>
          <span><span className="block text-[0.6875rem] text-territory-muted">Pagamento</span><span className="font-semibold">{payment === "all" ? "Todos" : payment === "pending" ? "Pendentes" : "Confirmados"}</span></span>
        </FilterButton>
        <FilterButton className="md:w-32 lg:w-36" onClick={() => onModalityChange(modality === "all" ? "delivery" : modality === "delivery" ? "pickup" : "all")}>
          <span><span className="block text-[0.6875rem] text-territory-muted">Modalidade</span><span className="font-semibold">{modality === "all" ? "Todas" : modality === "delivery" ? "Entrega" : "Retirada"}</span></span>
        </FilterButton>
        <FilterButton className="hidden md:flex md:w-24 lg:w-32"><span className="font-semibold">Hoje</span></FilterButton>
      </div>
      <div className="hidden h-10 shrink-0 rounded-lg border border-territory-border bg-territory-surface p-1 md:flex">
        <button type="button" onClick={() => onViewModeChange("list")} className={cn("flex items-center gap-1.5 rounded-md px-3 text-xs font-bold", viewMode === "list" ? "bg-territory-brand text-white" : "text-territory-muted")}>
          <LayoutList className="h-4 w-4" aria-hidden="true" />Lista
        </button>
        <button type="button" onClick={() => onViewModeChange("board")} className={cn("flex items-center gap-1.5 rounded-md px-3 text-xs font-bold", viewMode === "board" ? "bg-territory-brand text-white" : "text-territory-muted")}>
          <Grid2X2 className="h-4 w-4" aria-hidden="true" />Quadro
        </button>
      </div>
    </div>
  );
}

function PaymentLine({ order }: { order: ConceptOrder }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs font-semibold", order.payment === "pending" ? "text-territory-warm" : "text-territory-success")}>
      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-sm border", order.payment === "pending" ? "border-territory-warm" : "border-territory-success bg-territory-success text-white")}>
        {order.payment === "paid" ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : null}
      </span>
      {order.paymentLabel}
    </div>
  );
}

function OrderCard({ order, onAction, compact = false }: { order: ConceptOrder; onAction: (order: ConceptOrder) => void; compact?: boolean }) {
  const config = stageConfig.find((stage) => stage.id === order.stage) ?? stageConfig[0];
  const Icon = order.modality === "delivery" ? (order.deliveryLabel === "Plataforma" ? Bike : Truck) : Store;
  return (
    <article className={cn("rounded-xl border border-territory-border bg-territory-surface p-3 shadow-[0_1px_2px_rgba(12,35,50,0.04)]", compact && "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-base font-bold text-territory-ink">#{order.number}</p>
          <p className="truncate text-sm font-bold text-territory-ink">{order.customer}</p>
        </div>
        <span className="shrink-0 text-xs text-territory-muted">{order.minutes} min</span>
      </div>
      <div className="mt-2 space-y-1.5">
        <p className="flex items-center gap-2 text-xs font-medium text-territory-ink"><Icon className="h-4 w-4" aria-hidden="true" />{order.deliveryLabel}</p>
        <PaymentLine order={order} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-heading text-base font-bold text-territory-ink">{order.total}</p>
      </div>
      <Button type="button" onClick={() => onAction(order)} className="mt-2 min-h-9 w-full rounded-lg bg-territory-brand px-2 text-xs font-bold text-white hover:bg-territory-brand/90">
        {config.actionLabel}
      </Button>
    </article>
  );
}

function EmptyStage({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-territory-border/80 px-2 py-6 text-center text-xs text-territory-muted">Nenhum pedido {label.toLowerCase()}.</p>;
}

function OrdersBoard({ orders, onAction }: { orders: ConceptOrder[]; onAction: (order: ConceptOrder) => void }) {
  return (
    <div className="grid min-h-0 gap-3 md:h-full md:grid-cols-4">
      {stageConfig.map((stage) => {
        const Icon = stage.icon;
        const stageOrders = orders.filter((order) => order.stage === stage.id);
        return (
          <section key={stage.id} className={cn("min-w-0 rounded-xl p-2.5", stage.tone)}>
            <div className={cn("flex items-center gap-2 px-1 pb-2 text-sm font-bold", stage.id === "new" ? "text-territory-warm" : "text-territory-ink")}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {stage.label}
              <span className={cn("ml-auto inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs", stage.badge)}>{stageOrders.length}</span>
            </div>
            <div className="space-y-2">
              {stageOrders.length ? stageOrders.map((order) => <OrderCard key={order.id} order={order} onAction={onAction} />) : <EmptyStage label={stage.label} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function OrdersList({ orders, onAction }: { orders: ConceptOrder[]; onAction: (order: ConceptOrder) => void }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => <OrderCard key={order.id} order={order} onAction={onAction} compact />)}
    </div>
  );
}

function MobileOrderList({ orders, onAction }: { orders: ConceptOrder[]; onAction: (order: ConceptOrder) => void }) {
  const newOrders = orders.filter((order) => order.stage === "new");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-territory-sun bg-territory-surface px-3 text-left text-sm font-bold text-territory-ink">
          <span className="h-2 w-2 shrink-0 rounded-full bg-territory-warm" aria-hidden="true" />
          <span className="truncate">Novos ({newOrders.length})</span>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-territory-muted" aria-hidden="true" />
        </button>
        <button type="button" className="flex min-h-10 items-center gap-2 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-semibold text-territory-ink">
          Todos
          <ChevronDown className="h-4 w-4 text-territory-muted" aria-hidden="true" />
        </button>
      </div>
      {newOrders.map((order) => <OrderCard key={order.id} order={order} onAction={onAction} compact />)}
    </div>
  );
}

function CustomersPanel() {
  return (
    <section className="space-y-3" aria-label="Clientes">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-territory-ink">Clientes</h2>
        <p className="text-sm text-territory-muted">Encontre e acompanhe seus clientes</p>
      </div>
      <label className="relative block">
        <span className="sr-only">Buscar nome ou telefone</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted" aria-hidden="true" />
        <Input placeholder="Buscar nome ou telefone..." className="min-h-10 border-territory-border bg-territory-surface pl-9" />
      </label>
      <p className="text-xs font-semibold text-territory-muted">Dados do período selecionado</p>
      <div className="divide-y divide-territory-border rounded-xl border border-territory-border bg-territory-surface">
        {customerRows.map((customer) => (
          <div key={customer.name} className="flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-territory-raised text-xs font-bold text-territory-muted">{customer.initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-territory-ink">{customer.name}</p>
              <p className="text-xs text-territory-muted">{customer.phone}</p>
            </div>
            <div className="text-right text-xs text-territory-muted"><p className="font-semibold text-territory-ink">{customer.orders}</p><p>{customer.last}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IndicatorsPanel() {
  const metrics = [
    { label: "Total de pedidos", value: "18", icon: ClipboardList, tone: "text-territory-ink" },
    { label: "Pendentes", value: "3", icon: Clock3, tone: "text-territory-warm" },
    { label: "Concluídos", value: "12", icon: Check, tone: "text-territory-success" },
    { label: "Cancelados", value: "3", icon: XCircle, tone: "text-territory-error" },
  ];
  return (
    <section className="space-y-3" aria-label="Indicadores">
      <div><h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-territory-ink">Indicadores</h2><p className="text-sm text-territory-muted">Resumo dos pedidos da sua loja</p></div>
      <p className="text-xs font-semibold text-territory-muted">Dados do período selecionado</p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-territory-border bg-territory-surface p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs text-territory-muted">{label}</p><Icon className={cn("h-5 w-5", tone)} aria-hidden="true" /></div><p className={cn("mt-2 font-heading text-3xl font-bold", tone)}>{value}</p></div>)}
      </div>
      <div className="rounded-xl border border-territory-border bg-territory-surface p-3"><p className="text-xs text-territory-muted">Valor dos pedidos</p><p className="mt-1 font-heading text-2xl font-bold text-territory-ink">R$ 864,00</p><p className="mt-3 text-xs text-territory-muted">Ticket médio <strong className="ml-1 text-territory-ink">R$ 48,00</strong></p></div>
    </section>
  );
}

function MobileBottomNavigation({ activeTab, onTabChange }: { activeTab: ConceptTab; onTabChange: (tab: ConceptTab) => void }) {
  const items: { label: string; icon: LucideIcon; tab?: ConceptTab }[] = activeTab === "operation"
    ? [
        { label: "Pedidos", icon: ClipboardList, tab: "operation" },
        { label: "Cardápio", icon: UtensilsCrossed },
        { label: "Entregas", icon: Truck },
        { label: "Mais", icon: Menu },
      ]
    : [
        { label: "Pedidos", icon: ClipboardList, tab: "operation" },
        { label: "Clientes", icon: Users, tab: "customers" },
        { label: "Indicadores", icon: BarChart3, tab: "indicators" },
        { label: "Mais", icon: Menu },
      ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-territory-border bg-territory-surface px-1 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação da loja">
      {items.map(({ label, icon: Icon, tab }) => {
        const active = tab === activeTab;
        return <button key={label} type="button" onClick={() => tab ? onTabChange(tab) : toast.info(`${label} ficará disponível nesta próxima etapa.`)} className={cn("flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-semibold", active ? "text-territory-brand" : "text-territory-muted")}><Icon className="h-5 w-5" aria-hidden="true" />{label}</button>;
      })}
    </nav>
  );
}

export default function OrdersConceptMockPage() {
  const [activeTab, setActiveTab] = useState<ConceptTab>("operation");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [modality, setModality] = useState<ModalityFilter>("all");
  const [orders, setOrders] = useState(initialOrders);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query || `#${order.number} ${order.customer}`.toLowerCase().includes(query);
      const matchesPayment = payment === "all" || order.payment === payment;
      const matchesModality = modality === "all" || order.modality === modality;
      return matchesSearch && matchesPayment && matchesModality;
    });
  }, [modality, orders, payment, search]);

  const handleOrderAction = (order: ConceptOrder) => {
    if (order.stage === "new") {
      toast.info(`Pedido #${order.number}: detalhes do atendimento serão abertos na próxima etapa.`);
      return;
    }
    const nextStage: Record<Exclude<OrderStage, "new" | "delivery">, OrderStage> = {
      preparing: "ready",
      ready: "delivery",
    };
    const next = order.stage === "delivery" ? "delivery" : nextStage[order.stage];
    setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, stage: next } : entry));
    toast.success(`Pedido #${order.number} atualizado.`);
  };

  return (
    <>
      <Helmet>
        <title>Pedidos da loja | Sabores da Ana</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen overflow-x-hidden bg-territory-canvas text-territory-ink max-md:h-[100dvh] max-md:overflow-y-auto max-md:scrollbar-hide md:flex md:h-screen md:flex-col md:overflow-hidden">
        <div className="flex min-h-0 flex-1">
          <DesktopSidebar onTabChange={setActiveTab} />
          <main className="flex min-w-0 flex-1 flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 md:overflow-hidden md:px-6 md:py-5 lg:px-8">
            <MobileHeader activeTab={activeTab} onTabChange={setActiveTab} />
            <div className={cn("mt-5 flex items-start justify-between gap-4 md:mt-0", activeTab !== "operation" && "max-md:hidden")}>
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-bold tracking-[-0.045em] text-territory-ink md:text-[2rem]">Pedidos</h1>
                <p className="mt-0.5 text-sm text-territory-muted">Acompanhe e gerencie os pedidos da sua loja</p>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <button type="button" onClick={() => toast.success("Pedidos atualizados agora.")} className="flex min-h-10 items-center gap-2 rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-semibold text-territory-ink hover:bg-territory-raised"><Store className="h-4 w-4 text-territory-brand" aria-hidden="true" />Sabores da Ana<ChevronDown className="h-4 w-4" aria-hidden="true" /></button>
                <Button type="button" onClick={() => toast.success("Pedidos atualizados agora.")} variant="outline" className="min-h-10 border-territory-border bg-territory-surface text-territory-ink"><Clock3 className="mr-2 h-4 w-4" aria-hidden="true" />Atualizar</Button>
              </div>
            </div>
            <div className="mt-4 hidden md:block"><ConceptTabs activeTab={activeTab} onTabChange={setActiveTab} /></div>

            {activeTab === "operation" ? (
              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <div className="hidden md:block">
                  <OrderFilters search={search} onSearchChange={setSearch} payment={payment} onPaymentChange={setPayment} modality={modality} onModalityChange={setModality} viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
                <div className="mt-4 min-h-0 flex-1">
                  <div className="hidden h-full md:block">
                    {viewMode === "board" ? <OrdersBoard orders={filteredOrders} onAction={handleOrderAction} /> : <OrdersList orders={filteredOrders} onAction={handleOrderAction} />}
                  </div>
                  <div className="md:hidden"><MobileOrderList orders={filteredOrders} onAction={handleOrderAction} /></div>
                </div>
                <div className="mt-3 hidden items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-4 py-2.5 text-xs text-territory-muted md:flex"><span className="flex items-center gap-2 font-semibold text-territory-ink"><ClipboardList className="h-4 w-4" aria-hidden="true" />Concluídos e cancelados</span><span>Acesse o histórico de pedidos da sua loja</span><ChevronDown className="h-4 w-4 -rotate-90" aria-hidden="true" /></div>
              </div>
            ) : null}
            {activeTab === "customers" ? <div className="mt-5"><CustomersPanel /></div> : null}
            {activeTab === "indicators" ? <div className="mt-5"><IndicatorsPanel /></div> : null}
          </main>
        </div>
        <MobileBottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </>
  );
}
