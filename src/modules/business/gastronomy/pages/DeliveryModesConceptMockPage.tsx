import { useMemo, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coffee,
  ExternalLink,
  Eye,
  FileText,
  Home,
  Handshake,
  Info,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  MoreVertical,
  Navigation,
  Package,
  RefreshCw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Store,
  Truck,
  Users,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MiniMap } from "@/shared/components/maps/MiniMap";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import driverImage from "@/assets/persona-prestador.jpg";
import directoryImageTwo from "@/assets/persona-morador.jpg";
import directoryImageThree from "@/assets/persona-emprego.jpg";

type DeliveryView =
  | "modalities"
  | "manual"
  | "team"
  | "network"
  | "directory"
  | "profile"
  | "invite"
  | "accept"
  | "operation"
  | "courier";

type OperationState = "manual" | "waiting" | "tracking";

const DELIVERY_LINK = "/gastronomia/pedidos/concept-mock-modalidades?concept-mock=1";

const store = {
  name: "Sabores da Ana",
  city: "Santa Cruz, Salvador",
  address: "Rua Exemplo, 120 · Casa 2",
};

const deliveryItems = [
  { name: "Moqueca individual + farofa extra", value: "R$ 41,00" },
  { name: "Suco natural", value: "R$ 8,00" },
];

const TRACKING_ROUTE: Array<[number, number]> = [
  [-38.4937, -12.9788],
  [-38.4915, -12.9778],
  [-38.489, -12.976],
  [-38.486, -12.9748],
  [-38.4821, -12.9714],
];

const sideItems: Array<{ label: string; icon: LucideIcon; view?: DeliveryView }> = [
  { label: "Pedidos", icon: ClipboardList },
  { label: "Entregas", icon: Bike },
  { label: "Cardápio", icon: UtensilsCrossed },
  { label: "Conversas", icon: MessageCircle },
  { label: "Equipe", icon: Users },
];

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <span className={cn("font-heading font-extrabold tracking-[-0.06em]", dark ? "text-white" : "text-territory-ink")}>
      achegue-se<span className="text-territory-sun">.</span>
    </span>
  );
}

function StoreIdentity({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center", mobile ? "gap-2" : "gap-3")}>
      <img src={foodImage} alt="" className={cn("shrink-0 rounded-lg object-cover", mobile ? "h-10 w-10" : "h-9 w-9")} />
      <div className="min-w-0">
        <p className={cn("truncate font-bold", mobile ? "text-sm" : "text-[0.7rem] text-white")}>{store.name}</p>
        <p className={cn("truncate text-xs", mobile ? "text-territory-muted" : "text-[0.62rem] text-white/70")}>Loja parceira</p>
      </div>
    </div>
  );
}

function StoreTopbar({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <header className="flex items-center justify-between border-b border-territory-border px-1 pb-3">
        <button type="button" onClick={() => window.history.back()} className="rounded-lg p-2" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Brand />
        <button type="button" onClick={() => toast.info("Menu da loja aberto.")} className="rounded-lg p-2" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>
    );
  }

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-territory-border bg-white px-4 lg:px-5">
      <button type="button" onClick={() => toast.info("Seleção de loja disponível para contas com mais de uma loja.")} className="h-8 !min-h-0 flex items-center gap-1.5 rounded-lg border border-territory-border px-2 py-1.5 text-[0.68rem] font-semibold">
        <Store className="h-3.5 w-3.5 text-territory-brand" />{store.name}<ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-3 text-territory-muted">
        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-territory-ink"><span className="grid h-6 w-6 place-items-center rounded-full bg-territory-brand text-[0.58rem] text-white">A</span>Ana<ChevronDown className="h-3 w-3" /></span>
      </div>
    </header>
  );
}

function MobileDeliveryHeader() {
  return <header className="flex h-12 shrink-0 items-center gap-4 border-b border-territory-border bg-territory-surface px-1"><button type="button" onClick={() => window.history.back()} className="rounded-lg p-1 text-territory-ink" aria-label="Voltar para entregas"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button><span className="text-sm font-bold text-territory-ink">Entregas</span></header>;
}

function MobileCourierHeader() {
  return <header className="flex shrink-0 items-center justify-between border-b border-territory-border bg-territory-surface px-1 pb-3"><div className="flex min-w-0 items-center gap-3"><img src={driverImage} alt="" className="h-11 w-11 rounded-full object-cover" /><div className="min-w-0"><p className="truncate text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Central do entregador</p></div></div><button type="button" onClick={() => toast.info("Configurações do entregador serão conectadas em seguida.")} className="rounded-lg p-2" aria-label="Configurações"><Settings className="h-5 w-5" /></button></header>;
}

function MobileContextHeader({ title, onBack, showMenu = false }: { title: string; onBack: () => void; showMenu?: boolean }) {
  return <header className="flex h-12 shrink-0 items-center gap-1 border-b border-territory-border bg-territory-surface px-4"><button type="button" onClick={onBack} className="rounded-lg p-1 text-territory-ink" aria-label="Voltar"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button><span className="min-w-0 flex-1 truncate text-sm font-bold text-territory-ink">{title}</span>{showMenu ? <button type="button" onClick={() => toast.info("Mais opções serão conectadas em seguida.")} className="rounded-lg p-1 text-territory-ink" aria-label="Mais opções"><MoreVertical className="h-5 w-5" aria-hidden="true" /></button> : null}</header>;
}

function MobileStoreIntro() {
  // Shared concept header kept intentionally compact for the mobile viewport.
  return <div className="flex items-center gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-territory-brand text-territory-sun"><Coffee className="h-7 w-7" /></span><div className="min-w-0"><p className="truncate text-base font-bold">{store.name}</p><p className="truncate text-sm text-territory-muted">{store.city}</p></div></div>;
}

function DesktopSidebar({ view, navigate }: { view: DeliveryView; navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return (
    <aside className="hidden w-40 shrink-0 flex-col bg-territory-brand px-3 py-4 text-white md:flex" aria-label="Navegação da loja">
      <div className="px-1 text-lg"><Brand dark /></div>
      <div className="mt-5"><StoreIdentity /></div>
      <nav className="mt-6 space-y-1">
        {sideItems.map(({ label, icon: Icon }) => {
          const active = label === "Entregas";
          return <button type="button" key={label} onClick={() => label === "Entregas" ? navigate("modalities") : label === "Pedidos" ? window.location.assign("/gastronomia/pedidos/concept-mock-store?concept-mock=1") : toast.info(`${label} ficará disponível nesta próxima etapa.`)} className={cn("flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[0.7rem] font-semibold", active ? "bg-territory-sun text-territory-ink" : "text-white/85 hover:bg-white/10")}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{label}</span></button>;
        })}
      </nav>
      <div className="mt-auto border-t border-white/15 pt-3 text-[0.68rem] text-white/70"><button type="button" onClick={() => toast.info("Configurações da loja serão conectadas em seguida.")} className="h-8 !min-h-0 flex w-full items-center gap-2 px-1 py-1.5 text-left"><Settings className="h-3.5 w-3.5" />Configurações</button></div>
    </aside>
  );
}

function MobileBottomNav({ view, navigate }: { view: DeliveryView; navigate: (view: DeliveryView) => void }) {
  const courier = view === "courier";
  const items = courier
    ? [
        { label: "Início", icon: Home, view: "courier" as const },
        { label: "Entregas", icon: Bike, view: "operation" as const },
        { label: "Ganhos", icon: ClipboardList, view: "courier" as const },
        { label: "Perfil", icon: UserRound, view: "courier" as const },
      ]
    : [
        { label: "Pedidos", icon: ClipboardList, view: "manual" as const },
        { label: "Entregas", icon: Bike, view: "modalities" as const },
        { label: "Equipe", icon: Users, view: "directory" as const },
        { label: "Conta", icon: UserRound, view: "courier" as const },
      ];
  return <nav className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-territory-border bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur" aria-label="Navegação inferior">{items.map(({ label, icon: Icon, view: target }, index) => { const active = courier ? index === 0 : (target === "modalities" && ["modalities", "manual", "team", "network", "operation"].includes(view)) || (target === "directory" && ["directory", "profile", "invite", "accept"].includes(view)); return <button type="button" key={label} onClick={() => target === "operation" ? navigate(target) : navigate(target)} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold", active ? "text-territory-brand" : "text-territory-muted")}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>; })}</nav>;
}

function PageTitle({ title, subtitle, children }: { title: ReactNode; subtitle: ReactNode; children?: ReactNode }) {
  return <div className="flex shrink-0 items-start justify-between gap-4 border-b border-territory-border pb-3"><div><h1 className="font-heading text-[clamp(1.2rem,1.7vw,1.5rem)] font-extrabold tracking-[-0.045em]">{title}</h1>{subtitle ? <p className="mt-0.5 text-xs text-territory-muted">{subtitle}</p> : null}</div>{children}</div>;
}

function ConceptCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-territory-border bg-white p-4 shadow-sm", className)}>{children}</section>;
}

function InfoNotice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "yellow" | "green" }) {
  return <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs", tone === "yellow" ? "bg-[#fff3c9] text-[#735300]" : tone === "green" ? "bg-[#e8f7ef] text-[#096340]" : "bg-[#edf5fa] text-[#17466b]")}><Info className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
}

function StatusPill({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "yellow" | "blue" }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", tone === "yellow" ? "bg-[#fff0bd] text-[#795500]" : tone === "blue" ? "bg-blue-100 text-blue-800" : "bg-[#c9f1dc] text-[#08734e]")}>{children}</span>;
}

function ItemRows() {
  return <div className="space-y-2 text-xs">{deliveryItems.map((item) => <div key={item.name} className="flex items-start justify-between gap-3"><span>1 × {item.name}</span><span className="font-semibold">{item.value}</span></div>)}</div>;
}

function OrderAside() {
  return <ConceptCard className="min-w-0"><div className="flex items-center gap-2 border-b border-territory-border pb-3"><Store className="h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold">Coleta (restaurante)</p><p className="text-sm font-bold">{store.name}</p><p className="text-xs text-territory-muted">{store.city}</p></div></div><div className="space-y-4 border-b border-territory-border py-4 text-xs"><div className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-territory-brand" /><div><p className="font-bold">Destino</p><p className="mt-1 text-sm">Ana Oliveira</p><p className="text-territory-muted">{store.address}</p><p className="text-territory-muted">{store.city} · BA</p></div></div></div><div className="border-b border-territory-border py-4"><p className="mb-3 text-xs font-bold">Itens do pedido</p><ItemRows /></div><div className="space-y-2 pt-4 text-xs"><div className="flex justify-between"><span>Produtos</span><span>R$ 49,00</span></div><div className="flex justify-between"><span>Entrega</span><span>R$ 7,00</span></div><div className="flex justify-between border-t border-territory-border pt-3 text-sm font-bold"><span>Total</span><span>R$ 56,00</span></div></div></ConceptCard>;
}

function ModalitiesContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const cards: Array<{ icon: LucideIcon; title: string; description: string; action: string; actionView: DeliveryView; disabled?: boolean; actionTone?: "primary" | "link" }> = [
    { icon: Truck, title: "Própria sem integração", description: "Sua equipe externa. Atualização manual, sem mapa.", action: "Definir como padrão", actionView: "manual", actionTone: "primary" },
    { icon: Users, title: "Equipe da loja integrada", description: "Entregadores cadastrados e vinculados à sua loja.", action: "Gerenciar equipe", actionView: "team", actionTone: "link" },
    { icon: Share2, title: "Rede Achegue-se", description: "Solicite entregadores disponíveis na rede.", action: "Consultar disponibilidade", actionView: "network", disabled: true, actionTone: "link" },
  ];
  return <div className="flex min-h-0 flex-1 flex-col gap-3"><PageTitle title="Como sua loja entrega?" subtitle={<><span className="block">Você pode habilitar uma ou mais modalidades.</span><span className="block">Cada pedido utilizará apenas uma modalidade por vez.</span></>} /><div className="space-y-2">{cards.map(({ icon: Icon, title, description, action, actionView, disabled, actionTone }) => <ConceptCard key={title} className={cn("flex flex-col items-stretch gap-2.5 p-2.5 sm:flex-row sm:items-center", disabled && "opacity-80")}><div className="flex min-w-0 flex-1 items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-territory-brand"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold leading-tight">{title}</p><p className="mt-0.5 text-[0.68rem] leading-snug text-territory-muted">{description}</p></div></div><div className="flex min-w-0 items-center gap-2 sm:shrink-0"><div className="min-w-0 flex-1">{disabled ? <StatusPill tone="yellow">Ainda não habilitada</StatusPill> : null}</div><button type="button" disabled={disabled} onClick={() => navigate(actionView)} className={cn("h-8 !min-h-0 shrink-0 text-xs font-bold", actionTone === "primary" ? "rounded-lg bg-territory-sun px-3 py-0 text-territory-ink" : "text-blue-700 hover:underline", disabled && "cursor-not-allowed")}>{action}</button><ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" /></div></ConceptCard>)}</div><InfoNotice>Cada pedido utiliza uma modalidade por vez. Você pode manter mais de uma modalidade habilitada e escolher a mais adequada em cada pedido.</InfoNotice></div>;
}

function ManualOrderAside() {
  return <ConceptCard className="p-3"><div className="flex items-start gap-2 border-b border-territory-border pb-3"><Store className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" /><div><p className="text-xs font-bold">Coleta (restaurante)</p><p className="text-sm font-bold">{store.name}</p><p className="text-xs text-territory-muted">{store.city}</p></div></div><div className="grid gap-3 border-b border-territory-border py-3 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,.7fr)]"><div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" /><div className="text-xs"><p className="font-bold">Destinatário</p><p className="mt-1 text-sm font-bold">Ana Oliveira</p><p className="text-territory-muted">{store.address}</p><p className="text-territory-muted">{store.city} · BA</p></div></div><InfoNotice>O cliente acompanha o status informado pela loja.</InfoNotice></div><div className="border-b border-territory-border py-3"><p className="mb-2 text-xs font-bold">Itens do pedido</p><ItemRows /></div><div className="space-y-2 pt-3 text-xs"><div className="flex justify-between"><span>Produtos</span><span>R$ 49,00</span></div><div className="flex justify-between"><span>Entrega própria</span><span>R$ 5,00</span></div><div className="flex justify-between border-t border-territory-border pt-2 text-sm font-bold"><span>Total</span><span>R$ 54,00</span></div></div></ConceptCard>;
}

function ManualContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-3"><PageTitle title={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>Pedido #1042</span><span className="text-xs font-normal text-territory-muted">Ana Oliveira · Santa Cruz</span><StatusPill>Pronto</StatusPill></span>} subtitle={null}><span className="text-[0.65rem] text-territory-muted">Criado em 12/08/2024 às 11:45</span></PageTitle><div className="grid items-stretch gap-3 lg:grid-cols-2"><ConceptCard className="flex flex-col gap-3 p-3"><div className="flex items-center gap-2.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-territory-brand"><Truck className="h-5 w-5" /></span><div><h2 className="text-base font-extrabold">Entrega realizada pela loja</h2><p className="text-xs text-territory-muted">Sem integração com entregador.</p></div></div><div className="rounded-xl border border-territory-border p-3"><p className="text-xs font-bold">Histórico do pedido</p><div className="mt-3 space-y-3 border-l-2 border-territory-brand/30 pl-4 text-xs"><p className="relative"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full bg-territory-brand" /><b>Em preparo</b><span className="float-right text-territory-muted">10:20</span></p><p className="relative"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full bg-territory-sun" /><b>Pronto</b><span className="float-right text-territory-muted">10:45</span></p><p className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full border-2 border-territory-border bg-white" />Saiu para entrega<span className="float-right">Aguardando</span></p><p className="relative text-territory-muted"><span className="absolute -left-[1.35rem] top-0.5 h-3 w-3 rounded-full border-2 border-territory-border bg-white" />Entregue<span className="float-right">Aguardando</span></p></div></div><div className="mt-auto grid gap-2 sm:grid-cols-2"><Button type="button" onClick={() => toast.success("Pedido marcado como saiu para entrega na demonstração.")} className="bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Marcar saiu para entrega</Button><Button type="button" variant="outline" onClick={() => toast.info("Detalhes do pedido serão abertos na próxima etapa.")} className="border-territory-border bg-white text-territory-ink">Ver pedido</Button></div></ConceptCard><ManualOrderAside /></div><button type="button" onClick={() => navigate("modalities")} className="flex items-center gap-2 self-start text-xs font-bold text-blue-700"><ArrowLeft className="h-4 w-4" />Voltar para modalidades</button></div>;
}

function TeamContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const members = [{ name: "Carlos Santos", initials: "CS", availability: "Disponível para esta loja", dot: "bg-emerald-500" }, { name: "Joana Lima", initials: "JL", availability: "Indisponível", dot: "bg-red-400" }];
  return <div className="flex min-h-0 flex-1 flex-col gap-3"><PageTitle title="Minha equipe" subtitle="Gerencie os entregadores que atendem a sua loja." /><div className="grid items-stretch gap-3 lg:grid-cols-2"><ConceptCard className="p-3"><div className="flex items-center justify-between gap-3 border-b border-territory-border pb-3"><div className="flex gap-5 text-xs"><button type="button" className="border-b-2 border-territory-sun pb-2.5 font-bold">Ativos (2)</button><button type="button" onClick={() => navigate("invite")} className="pb-2.5 text-territory-muted">Convites (0)</button></div><div className="flex items-center gap-3"><Button type="button" onClick={() => navigate("directory")} className="h-8 !min-h-0 bg-territory-sun px-3 py-0 text-xs text-territory-ink hover:bg-territory-sun/85">Convidar entregador</Button><button type="button" onClick={() => navigate("directory")} className="flex items-center gap-1 text-xs font-bold text-blue-700">Encontrar profissionais<ExternalLink className="h-3.5 w-3.5" /></button></div></div><div className="mt-3 space-y-2.5">{members.map((person) => <div key={person.name} className="flex items-center gap-3 rounded-xl border border-territory-border p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef1f5] text-xs font-bold text-territory-ink">{person.initials}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{person.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-territory-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" />Vínculo ativo</p><p className="flex items-center gap-1.5 text-xs text-territory-muted"><span className={cn("h-2 w-2 rounded-full", person.dot)} />{person.availability}</p></div><button type="button" onClick={() => toast.info("Permissões do vínculo serão exibidas aqui.")} className="rounded-lg p-2 text-lg leading-none text-territory-muted" aria-label={`Opções de ${person.name}`}>⋮</button></div>)}</div><div className="mt-3"><InfoNotice>Disponibilidade compartilhada com esta loja não equivale a disponibilidade na rede Achegue-se.</InfoNotice></div></ConceptCard><ConceptCard className="flex flex-col p-3"><div className="border-b border-territory-border pb-3"><p className="text-sm font-bold">Pedido #1042 · Pronto</p><p className="text-xs text-territory-muted">Aguardando atribuição</p></div><label className="mt-3 block text-xs font-bold">Entregador<select className="mt-1 h-9 !min-h-0 w-full rounded-lg border border-territory-border bg-white px-3 text-sm font-normal"><option>Carlos Santos</option><option>Joana Lima</option></select></label><Button type="button" onClick={() => { toast.success("Solicitação enviada para aceite na demonstração."); navigate("operation", "waiting"); }} className="mt-3 h-9 !min-h-0 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Enviar para aceite</Button><div className="mt-3"><InfoNotice>O entregador precisa aceitar este serviço. Depois do aceite, ele poderá iniciar a entrega.</InfoNotice></div></ConceptCard></div></div>;
}

function NetworkContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-3"><PageTitle title="Solicitar entrega à rede" subtitle="Acesse entregadores parceiros da rede Achegue-se."><StatusPill tone="yellow">Cenário futuro com rede habilitada</StatusPill></PageTitle><div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,.92fr)]"><ConceptCard className="h-[clamp(24rem,calc(100dvh-13rem),42rem)] overflow-hidden p-0"><MiniMap latitude={-12.9751} longitude={-38.487} routeCoordinates={TRACKING_ROUTE} routeStartColor="#064e3b" routeEndColor="#fbbf24" title="Santa Cruz · Salvador" description="Rota da solicitação" height="100%" showControls={false} interactive={false} /></ConceptCard><ConceptCard className="flex h-[clamp(24rem,calc(100dvh-13rem),42rem)] flex-col p-3"><div className="flex items-start gap-3 border-b border-territory-border pb-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-territory-brand"><Share2 className="h-5 w-5" /></span><div><p className="text-sm font-bold">Entrega pela rede Achegue-se</p><p className="text-xs text-territory-muted">Conecte sua loja a entregadores disponíveis na sua região.</p></div></div><div className="space-y-3 border-b border-territory-border py-3 text-xs"><p>Valor apresentado ao cliente</p><p className="font-heading text-2xl font-extrabold">R$ 7,00</p><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-territory-brand" /><span>Santa Cruz → Nordeste de Amaralina</span></div></div><Button type="button" onClick={() => toast.info("A rede ainda depende de habilitação e elegibilidade.")} className="mt-3 h-9 !min-h-0 bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Solicitar entrega</Button><InfoNotice>A solicitação inicia a busca. O aceite depende de um entregador disponível.</InfoNotice><button type="button" onClick={() => navigate("modalities")} className="mt-auto self-start text-xs font-bold text-blue-700">Ver alternativas <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></button></ConceptCard></div></div>;
}

function DirectoryContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Encontrar entregadores" subtitle="Busque profissionais interessados em propostas."><Button type="button" onClick={() => navigate("team")} variant="outline" className="border-territory-border bg-white text-territory-ink">Minha equipe</Button></PageTitle><div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]"><ConceptCard className="min-h-0"><div className="flex items-center gap-2 rounded-lg border border-territory-border px-3 py-2.5 text-sm text-territory-muted"><Search className="h-4 w-4" />Nome ou região</div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-territory-border px-3 py-2">Cidade · Salvador<ChevronDown className="ml-2 inline h-3.5 w-3.5" /></span><span className="rounded-lg border border-territory-border px-3 py-2">Bairro · Todos<ChevronDown className="ml-2 inline h-3.5 w-3.5" /></span><button type="button" className="px-2 font-bold text-blue-700">Mais filtros</button></div><h2 className="mt-5 text-sm font-bold">Profissionais interessados em propostas</h2><div className="mt-3 space-y-3">{[{ name: "Carlos Santos", area: "Santa Cruz e região", interest: "Por entrega e por turno" }, { name: "Joana Lima", area: "Nordeste de Amaralina", interest: "Por turno" }].map((person) => <ConceptCard key={person.name} className="p-3"><div className="flex items-center gap-3"><img src={driverImage} alt="" className="h-12 w-12 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{person.name}</p><p className="text-xs text-territory-muted">Moto · Salvador</p><p className="mt-1 text-xs">{person.area}</p><p className="text-xs text-territory-muted">Interesse: {person.interest}</p></div><ChevronRight className="h-4 w-4" /></div><Button type="button" variant="outline" onClick={() => navigate("profile")} className="mt-3 h-9 w-full border-territory-border bg-white text-xs text-territory-ink">Ver perfil</Button></ConceptCard>)}</div><InfoNotice>A presença no diretório não confirma disponibilidade imediata. A localização não é pública.</InfoNotice></ConceptCard><ConceptCard className="hidden lg:block"><p className="text-sm font-bold">Como funciona</p><div className="mt-4 space-y-4 text-xs text-territory-muted"><p className="flex gap-2"><Search className="h-4 w-4 shrink-0 text-territory-brand" />Encontre profissionais por região e interesse.</p><p className="flex gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-territory-brand" />Converse para combinar disponibilidade e condições.</p><p className="flex gap-2"><Users className="h-4 w-4 shrink-0 text-territory-brand" />O vínculo só fica ativo após o aceite do convite.</p></div></ConceptCard></div></div>;
}

function ProfileContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Perfil do entregador" subtitle="Informações profissionais compartilhadas pelo próprio entregador." /><div className="mx-auto w-full max-w-2xl"><ConceptCard className="text-center"><img src={driverImage} alt="Carlos Santos" className="mx-auto h-28 w-28 rounded-2xl object-cover" /><h2 className="mt-3 text-xl font-extrabold">Carlos Santos</h2><p className="text-sm text-territory-muted">Entregador · Salvador, BA</p><div className="mt-5 grid gap-3 text-left sm:grid-cols-2"><div className="rounded-xl bg-territory-surface p-3"><p className="text-xs font-bold">Sobre mim</p><p className="mt-1 text-xs text-territory-muted">Experiência com entregas de refeições e pequenos volumes.</p></div><div className="rounded-xl bg-territory-surface p-3"><p className="text-xs font-bold">Área de atuação</p><p className="mt-1 text-xs text-territory-muted">Santa Cruz · Nordeste de Amaralina</p></div></div><InfoNotice>O diretório não exibe CNH, endereço residencial ou localização em tempo real.</InfoNotice><div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="border-territory-border bg-white text-territory-ink">Conversar</Button><Button type="button" onClick={() => navigate("invite")} className="bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Convidar para minha equipe</Button></div></ConceptCard></div></div>;
}

function MobileProfileContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return <div className="flex min-h-[calc(100dvh-4.75rem)] flex-col gap-4 pb-4"><div className="text-center"><img src={driverImage} alt="Carlos Santos" className="mx-auto h-40 w-40 rounded-2xl object-cover" /><h1 className="mt-2 font-heading text-2xl font-extrabold tracking-[-0.04em]">Carlos Santos</h1><p className="text-sm text-territory-muted">Entregador · Salvador, BA</p></div><div className="space-y-3 px-1 text-left"><div><p className="text-sm font-bold">Sobre mim</p><p className="mt-1 text-sm leading-snug text-territory-muted">Experiência com entregas de refeições e pequenos volumes.</p></div><div><p className="text-sm font-bold">Veículo</p><p className="mt-1 flex items-center gap-2 text-sm"><Bike className="h-5 w-5 text-territory-brand" />Moto</p></div><div><p className="text-sm font-bold">Área de atuação</p><div className="mt-1 flex flex-wrap gap-2"><span className="rounded-full bg-territory-surface px-3 py-1.5 text-xs">Santa Cruz</span><span className="rounded-full bg-territory-surface px-3 py-1.5 text-xs">Nordeste de Amaralina</span></div></div><div><p className="text-sm font-bold">Interesse profissional</p><div className="mt-1 flex flex-wrap gap-2"><span className="rounded-full bg-territory-surface px-3 py-1.5 text-xs">Por entrega</span><span className="rounded-full bg-territory-surface px-3 py-1.5 text-xs">Por turno</span></div></div></div><InfoNotice>Converse para combinar disponibilidade e condições.</InfoNotice><div className="mt-auto grid gap-2"><Button type="button" variant="outline" onClick={() => toast.info("Conversa aberta na demonstração.")} className="h-11 border-territory-border bg-white text-territory-ink"><MessageCircle className="h-4 w-4" />Conversar</Button><Button type="button" onClick={() => navigate("invite")} className="h-11 bg-territory-sun text-territory-ink hover:bg-territory-sun/85"><Users className="h-4 w-4" />Convidar para minha equipe</Button></div></div>;
}

function MobileInviteContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  const conditions = ["Receber solicitações da sua loja", "Acompanhar pedidos atribuídos", "Registrar coleta e conclusão"];
  return <div className="flex min-h-[calc(100dvh-4.75rem)] flex-col gap-4 pb-4"><div className="flex items-center gap-3"><img src={driverImage} alt="Carlos Santos" className="h-12 w-12 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador · Salvador, BA</p></div></div><ConceptCard className="p-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0bd] text-territory-brand"><Store className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold">Sua loja</p><p className="text-xs text-territory-muted">Sabores da Ana · Santa Cruz</p></div></div></ConceptCard><label className="block text-sm font-bold">Mensagem e condições propostas<textarea defaultValue="Olá, Carlos! Buscamos apoio nas entregas do almoço. Vamos combinar horários e remuneração?" maxLength={500} className="mt-2 h-28 w-full resize-none rounded-xl border border-territory-border bg-white p-3 text-sm font-normal leading-snug text-territory-ink" /><span className="mt-1 block text-right text-xs text-territory-muted">71/500</span></label><ConceptCard className="bg-territory-surface p-3"><p className="text-sm font-bold">Ao aceitar o vínculo</p><div className="mt-2 space-y-2 text-sm">{conditions.map((condition) => <p key={condition} className="flex items-center gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-territory-sun text-territory-ink"><Check className="h-3.5 w-3.5" /></span>{condition}</p>)}</div></ConceptCard><InfoNotice>Cada entrega depende de aceite. O convite não ativa a rede Achegue-se.</InfoNotice><div className="mt-auto grid gap-2"><Button type="button" onClick={() => { toast.success("Convite enviado na demonstração."); navigate("accept"); }} className="h-11 bg-territory-sun text-territory-ink hover:bg-territory-sun/85"><Navigation className="h-4 w-4" />Enviar convite</Button><Button type="button" variant="outline" onClick={() => navigate("profile")} className="h-11 border-territory-border bg-white text-territory-ink">Voltar</Button></div></div>;
}

function MobileAcceptContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-3 pb-4">
      <div className="flex items-center gap-3">
        <img src={driverImage} alt="Carlos Santos" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-base font-bold">Carlos Santos</p>
          <p className="text-xs text-territory-muted">Entregador · Salvador, BA</p>
        </div>
      </div>

      <ConceptCard className="p-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0bd] text-territory-brand">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Sabores da Ana</p>
            <p className="truncate text-[0.68rem] text-territory-muted">Santa Cruz · Salvador, BA</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#fff0bd] px-2 py-1 text-[0.66rem] font-bold text-[#795500]">Convite pendente</span>
        </div>
      </ConceptCard>

      <div>
        <p className="text-sm font-bold">Mensagem da loja</p>
        <div className="mt-2 rounded-xl bg-[#f3f6f7] p-3 text-sm leading-snug text-territory-muted">
          Buscamos apoio nas entregas do almoço. Vamos combinar horários e remuneração?
        </div>
      </div>

      <ConceptCard className="p-2.5">
        <p className="text-sm font-bold">Vínculo com a loja</p>
        <div className="mt-2 flex items-start gap-4 pl-4">
          <Handshake className="mt-0.5 h-7 w-7 shrink-0 text-territory-brand" />
          <p className="text-sm leading-snug text-territory-muted">As condições de trabalho são combinadas entre vocês.</p>
        </div>
      </ConceptCard>

      <div className="flex items-start gap-3 rounded-xl bg-[#edf5fa] px-4 py-3 text-sm leading-snug text-[#17466b]">
        <LockKeyhole className="mt-0.5 h-6 w-6 shrink-0 text-territory-brand" />
        <span className="pr-3">Sua localização não ficará pública. O acompanhamento ficará restrito às entregas autorizadas.</span>
      </div>

      <button type="button" onClick={() => toast.info("Conversa aberta na demonstração.")} className="mt-2 flex min-h-9 items-center gap-2 px-1 text-sm font-bold text-blue-700">
        <MessageCircle className="h-5 w-5" />
        Conversar com a loja
        <ChevronRight className="ml-auto h-4 w-4" />
      </button>

      <div className="mt-auto grid gap-2.5">
        <Button type="button" onClick={() => { toast.success("Vínculo aceito na demonstração."); navigate("courier"); }} className="h-11 text-base bg-territory-sun text-territory-ink hover:bg-territory-sun/85">
          <Check className="!h-5 !w-5" />
          Aceitar vínculo
        </Button>
        <Button type="button" variant="outline" onClick={() => toast.info("Convite recusado na demonstração.")} className="h-11 text-base border-territory-brand bg-white text-territory-ink">
          <X className="!h-5 !w-5" />
          Recusar
        </Button>
      </div>

      <p className="mt-1.5 flex items-start gap-3 px-1 text-sm leading-snug text-territory-muted">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        Participar da rede Achegue-se é uma habilitação separada.
      </p>
    </div>
  );
}

function InviteContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Convidar Carlos Santos" subtitle="Envie um convite de vínculo para sua equipe." /><div className="mx-auto w-full max-w-2xl"><ConceptCard><div className="flex items-center gap-3 border-b border-territory-border pb-4"><img src={driverImage} alt="" className="h-12 w-12 rounded-xl object-cover" /><div><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador · Salvador, BA</p></div></div><div className="mt-4 rounded-xl bg-territory-surface p-3"><p className="text-sm font-bold">Sua loja</p><p className="mt-1 text-xs text-territory-muted">{store.name} · {store.city}</p></div><label className="mt-4 block text-xs font-bold">Mensagem e condições propostas<textarea defaultValue="Olá, Carlos! Buscamos apoio nas entregas do almoço. Vamos combinar horários e remuneração?" className="mt-1 h-24 w-full resize-none rounded-lg border border-territory-border bg-white p-3 text-sm font-normal" /></label><InfoNotice>As condições de trabalho são combinadas entre vocês. O convite não ativa a rede Achegue-se.</InfoNotice><div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" onClick={() => navigate("profile")} className="border-territory-border bg-white text-territory-ink">Voltar</Button><Button type="button" onClick={() => { toast.success("Convite enviado na demonstração."); navigate("accept"); }} className="bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Enviar convite</Button></div></ConceptCard></div></div>;
}

function AcceptContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Convite de uma loja" subtitle="Revise o vínculo antes de aceitar." /><div className="mx-auto w-full max-w-2xl"><ConceptCard><div className="flex items-center gap-3 border-b border-territory-border pb-4"><img src={driverImage} alt="" className="h-12 w-12 rounded-xl object-cover" /><div><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador · Salvador, BA</p></div></div><div className="mt-4 rounded-xl bg-[#fff3c9] p-3"><p className="text-sm font-bold">{store.name}</p><p className="mt-1 text-xs text-territory-muted">Convite pendente · {store.city}</p></div><h2 className="mt-4 text-sm font-bold">Ao aceitar o vínculo</h2><div className="mt-2 space-y-2 text-sm"><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Receber solicitações da sua loja</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Acompanhar pedidos atribuídos</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Registrar coleta e conclusão</p></div><InfoNotice>Sua localização não ficará pública. O acompanhamento fica restrito às entregas autorizadas.</InfoNotice><div className="mt-4 grid gap-2 sm:grid-cols-2"><Button type="button" variant="outline" onClick={() => toast.info("Convite recusado na demonstração.")} className="border-territory-border bg-white text-territory-ink">Recusar</Button><Button type="button" onClick={() => { toast.success("Vínculo aceito na demonstração."); navigate("courier"); }} className="bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Aceitar vínculo</Button></div></ConceptCard></div></div>;
}

function OperationContent({ state, navigate }: { state: OperationState; navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const tracking = state === "tracking";
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Pedido #1043" subtitle="Equipe da loja integrada · Ana Oliveira"><StatusPill tone={tracking ? "green" : "yellow"}>{tracking ? "Em entrega" : "Pronto para coleta"}</StatusPill></PageTitle><div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,.8fr)]"><ConceptCard className="flex min-h-0 flex-col gap-4">{tracking ? <><div className="flex items-center gap-3"><img src={driverImage} alt="" className="h-12 w-12 rounded-full object-cover" /><div><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador vinculado à sua loja</p></div><StatusPill>Em entrega</StatusPill></div><MiniMap latitude={-12.9751} longitude={-38.487} routeCoordinates={TRACKING_ROUTE} routeStartColor="#064e3b" routeEndColor="#fbbf24" title="Entrega #1043" description="Acompanhamento autorizado" height="18rem" showControls={false} interactive={false} /><div className="grid gap-2 sm:grid-cols-2"><Button type="button" onClick={() => toast.info("Conversa aberta na demonstração.")} variant="outline" className="border-territory-border bg-white text-territory-ink">Falar com entregador</Button><Button type="button" onClick={() => toast.info("Detalhes do pedido serão abertos.")} variant="outline" className="border-territory-border bg-white text-territory-ink">Ver pedido</Button></div></> : <><div className="flex items-center gap-3"><img src={driverImage} alt="" className="h-12 w-12 rounded-full object-cover" /><div><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador vinculado à sua loja</p></div></div><div className="rounded-xl bg-[#fff3c9] p-4"><p className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-5 w-5" />Aguardando aceite</p><p className="mt-1 text-xs text-territory-muted">Solicitação enviada agora. O profissional ainda não confirmou este serviço.</p></div><InfoNotice>Enquanto não houver aceite, não confirme ao cliente que este entregador realizará a entrega.</InfoNotice><div className="mt-auto grid gap-2"><Button type="button" onClick={() => navigate("operation", "tracking")} className="bg-territory-brand text-white hover:bg-territory-brand/90">Simular aceite e acompanhar</Button><Button type="button" variant="outline" onClick={() => toast.info("Solicitação cancelada na demonstração.")} className="border-territory-border bg-white text-territory-ink">Cancelar solicitação</Button></div></>}</ConceptCard><OrderAside /></div><button type="button" onClick={() => navigate("team")} className="flex items-center gap-2 self-start text-xs font-bold text-blue-700"><ArrowLeft className="h-4 w-4" />Voltar para equipe</button></div>;
}

function MobileOrderSummary() {
  return <ConceptCard className="min-h-[clamp(12rem,54vw,14rem)] p-3"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-territory-brand" /><p className="text-sm font-bold">Resumo do pedido</p></div><div className="mt-3 flex items-center gap-3 border-t border-territory-border pt-3"><Store className="h-5 w-5 shrink-0 text-territory-brand" /><div className="min-w-0"><p className="text-xs font-bold">Coleta</p><p className="text-sm font-bold">{store.name}</p><p className="text-xs text-territory-muted">{store.city}</p></div></div><div className="mt-3 flex items-center gap-3 border-t border-territory-border pt-3"><MapPin className="h-5 w-5 shrink-0 text-territory-brand" /><div className="min-w-0"><p className="text-xs font-bold">Destino</p><p className="text-sm font-bold">Rua Exemplo, 120 · Casa 2</p><p className="text-xs text-territory-muted">Nordeste de Amaralina · Salvador · BA</p></div></div></ConceptCard>;
}

function MobileTeamContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const members = [
    { name: "Carlos Santos", status: "Disponível para esta loja", color: "bg-emerald-500" },
    { name: "Joana Lima", status: "Indisponível", color: "bg-red-400" },
  ];
  return <div className="flex min-h-full flex-col gap-3"><div className="flex items-start justify-between gap-3 border-b border-territory-border pb-3"><div className="min-w-0"><h1 className="font-heading text-xl font-extrabold">Minha equipe</h1><p className="mt-1 text-xs text-territory-muted">Gerencie os entregadores da sua loja.</p></div><Button type="button" onClick={() => navigate("directory")} variant="outline" className="h-9 shrink-0 border-territory-border bg-white px-3 text-xs text-territory-ink">Encontrar</Button></div><div className="flex gap-5 border-b border-territory-border text-xs"><button type="button" className="border-b-2 border-territory-sun pb-2.5 font-bold">Ativos (2)</button><button type="button" onClick={() => navigate("invite")} className="pb-2.5 text-territory-muted">Convites (0)</button></div><ConceptCard className="p-3"><div className="space-y-2.5">{members.map((person) => <div key={person.name} className="flex items-center gap-2.5 rounded-lg border border-territory-border p-2.5"><img src={driverImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{person.name}</p><p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.68rem] text-territory-muted"><span className={cn("h-2 w-2 shrink-0 rounded-full", person.color)} />{person.status}</p></div><button type="button" onClick={() => toast.info("Permissões do vínculo serão exibidas aqui.")} className="rounded-lg px-1.5 text-lg leading-none text-territory-muted" aria-label={`Opções de ${person.name}`}>⋮</button></div>)}</div></ConceptCard><ConceptCard className="p-3"><div className="flex items-center gap-2 border-b border-territory-border pb-3"><Package className="h-5 w-5 text-territory-brand" /><div><p className="text-sm font-bold">Pedido #1042 · Pronto</p><p className="text-xs text-territory-muted">Aguardando atribuição</p></div></div><label className="mt-3 block text-xs font-bold">Entregador<select className="mt-1 h-9 w-full rounded-lg border border-territory-border bg-white px-2.5 text-xs font-normal"><option>Carlos Santos</option><option>Joana Lima</option></select></label><Button type="button" onClick={() => { toast.success("Solicitação enviada para aceite na demonstração."); navigate("operation", "waiting"); }} className="mt-3 h-9 w-full bg-territory-sun px-3 text-xs text-territory-ink hover:bg-territory-sun/85">Enviar para aceite</Button></ConceptCard><InfoNotice>Disponibilidade na loja e participação na rede Achegue-se são contextos independentes.</InfoNotice><button type="button" onClick={() => navigate("modalities")} className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-blue-700"><ArrowLeft className="h-4 w-4" />Voltar para modalidades</button></div>;
}

function MobileNetworkContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return <div className="flex min-h-full flex-col gap-3"><div className="flex items-start justify-between gap-3 border-b border-territory-border pb-3"><div className="min-w-0"><h1 className="font-heading text-xl font-extrabold">Solicitar entrega à rede</h1><p className="mt-1 text-xs text-territory-muted">Acesse entregadores parceiros da rede Achegue-se.</p></div><StatusPill tone="yellow">Cenário futuro</StatusPill></div><ConceptCard className="overflow-hidden p-0"><MiniMap latitude={-12.978} longitude={-38.465} title="Santa Cruz · Salvador" description="Rota ilustrativa da solicitação" height="10rem" showControls={false} interactive={false} /></ConceptCard><ConceptCard className="p-3"><div className="flex items-center gap-3 border-b border-territory-border pb-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-territory-brand"><LocateFixed className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold">Entrega pela rede Achegue-se</p><p className="text-xs leading-snug text-territory-muted">Conecte sua loja a entregadores disponíveis na sua região.</p></div></div><div className="border-b border-territory-border py-3"><p className="text-xs text-territory-muted">Valor apresentado ao cliente</p><p className="font-heading text-2xl font-extrabold">R$ 7,00</p><p className="mt-1 flex items-center gap-2 text-xs"><MapPin className="h-4 w-4 shrink-0 text-territory-brand" />Santa Cruz → Nordeste de Amaralina</p></div><Button type="button" onClick={() => toast.info("A rede ainda depende de habilitação e elegibilidade.")} className="mt-3 h-9 w-full bg-territory-sun px-3 text-xs text-territory-ink hover:bg-territory-sun/85">Solicitar entrega</Button><InfoNotice tone="yellow" >A solicitação inicia a busca. O aceite depende de um entregador disponível.</InfoNotice><button type="button" onClick={() => navigate("modalities")} className="mt-2 self-start text-xs font-bold text-blue-700">Ver alternativas <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></button></ConceptCard></div>;
}

function MobileDirectoryContent({ navigate }: { navigate: (view: DeliveryView) => void }) {
  const people = [
    { name: "Carlos Santos", area: "Santa Cruz e região", interest: "Por entrega e por turno", image: driverImage },
    { name: "Joana Lima", area: "Nordeste de Amaralina", interest: "Por turno", image: directoryImageTwo },
    { name: "Marcos Oliveira", area: "Vale das Pedrinhas", interest: "Por entrega", image: directoryImageThree },
  ];
  return <div className="flex min-h-full flex-col gap-3"><div className="flex min-h-[3.5rem] items-center gap-3 px-1"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fff0bd] text-territory-brand"><Store className="h-6 w-6" /></span><div className="min-w-0"><p className="text-sm font-bold">Sabores da Ana</p><p className="text-xs text-territory-muted">Santa Cruz · Salvador, BA</p></div></div><div className="flex h-11 items-center gap-2 rounded-lg border border-territory-border bg-white px-3 text-xs text-territory-muted"><Search className="h-4 w-4 shrink-0" />Nome ou região</div><div className="flex items-center gap-2 text-[0.68rem]"><span className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-territory-border bg-white px-2.5 py-2"><span><span className="block text-territory-muted">Cidade</span><b>Salvador</b></span><ChevronDown className="h-3.5 w-3.5 shrink-0" /></span><span className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-territory-border bg-white px-2.5 py-2"><span><span className="block text-territory-muted">Bairro</span><b>Todos</b></span><ChevronDown className="h-3.5 w-3.5 shrink-0" /></span><button type="button" className="flex shrink-0 items-center gap-1 px-0.5 font-bold text-blue-700">Mais filtros<SlidersHorizontal className="h-3.5 w-3.5" /></button></div><h2 className="mt-2 text-sm font-bold">Profissionais interessados em propostas</h2><div className="space-y-2">{people.map((person) => <ConceptCard key={person.name} className="h-[8rem] min-h-0 p-2.5"><div className="flex min-h-0 items-center gap-2.5"><img src={person.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold leading-tight">{person.name}</p><p className="text-[0.68rem] leading-tight text-territory-muted">Moto · Salvador</p><p className="mt-0.5 flex items-center gap-1 truncate text-[0.68rem] leading-tight"><MapPin className="h-3 w-3 shrink-0" />{person.area}</p><p className="truncate text-[0.68rem] leading-tight text-territory-muted">Interesse: {person.interest}</p></div><ChevronRight className="h-4 w-4 shrink-0" /></div><Button type="button" variant="outline" onClick={() => navigate("profile")} className="mt-1.5 h-8 w-full border-territory-border bg-white px-2 text-xs text-territory-ink">Ver perfil</Button></ConceptCard>)}</div><InfoNotice>A presença no diretório não confirma disponibilidade imediata.</InfoNotice></div>;
}

function MobileManualContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-xl font-extrabold tracking-[-0.04em]">Pedido #1042</h1>
        <span className="shrink-0 rounded-full bg-[#eef1f5] px-2.5 py-1 text-[0.68rem] font-bold text-territory-ink">Própria sem integração</span>
      </div>
      <ConceptCard className="p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff0bd] text-territory-ink"><Truck className="h-6 w-6" /></span>
          <div><p className="text-base font-bold">Saiu para entrega</p><p className="text-xs text-territory-muted">Atualizado pela loja às 12:30</p></div>
        </div>
      </ConceptCard>
      <div className="flex items-center gap-3 px-1">
        <UserRound className="h-6 w-6 shrink-0 text-territory-muted" />
        <div className="min-w-0"><p className="text-sm font-bold">Ana Oliveira</p><p className="text-xs text-territory-muted">{store.city}</p></div>
      </div>
      <InfoNotice>Sem rastreamento de entregador. Sua loja informa o andamento ao cliente.</InfoNotice>
      <div className="flex min-h-0 flex-1 flex-col border-t border-territory-border pt-3">
        <p className="text-xs font-bold">Histórico do pedido</p>
        <div className="mt-3 flex min-h-[10rem] flex-1 flex-col justify-between border-l-2 border-territory-brand/30 pl-3 text-xs">
          <div className="relative flex items-start justify-between gap-2">
            <span className="absolute -left-[1.05rem] top-0.5 h-3 w-3 rounded-full bg-territory-brand" />
            <div><b className="block">Pronto</b><span className="text-[0.68rem] text-territory-muted">Pedido preparado pela loja</span></div>
            <span className="shrink-0 text-territory-muted">11:50</span>
          </div>
          <div className="relative flex items-start justify-between gap-2">
            <span className="absolute -left-[1.05rem] top-0.5 h-3 w-3 rounded-full bg-territory-sun" />
            <div><b className="block">Saiu para entrega</b><span className="text-[0.68rem] text-territory-muted">Atualizado pela loja às 12:30</span></div>
            <span className="shrink-0 text-territory-muted">12:30</span>
          </div>
          <div className="relative flex items-start justify-between gap-2 text-territory-muted">
            <span className="absolute -left-[1.05rem] top-0.5 h-3 w-3 rounded-full border-2 border-territory-border bg-white" />
            <div><span className="block">Entregue</span><span className="text-[0.68rem]">Aguardando atualização da loja</span></div>
            <span className="shrink-0">—</span>
          </div>
        </div>
      </div>
      <div className="mt-auto grid gap-2">
        <Button type="button" onClick={() => toast.success("Entrega registrada na demonstração.")} className="bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Registrar entregue</Button>
        <Button type="button" variant="outline" onClick={() => toast.info("Detalhes do pedido serão abertos.")} className="border-territory-border bg-white text-territory-ink">Ver pedido</Button>
      </div>
      <button type="button" onClick={() => navigate("modalities")} className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-blue-700"><FileText className="h-4 w-4" />Histórico</button>
    </div>
  );
}
function MobileOperationContent({ state, navigate }: { state: OperationState; navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const tracking = state === "tracking";
  return <div className="flex min-h-full flex-1 flex-col gap-3"><div className="flex items-center justify-between gap-2"><h1 className="font-heading text-xl font-extrabold tracking-[-0.04em]">Pedido #1043</h1>{!tracking && <StatusPill tone="yellow">Pronto para coleta</StatusPill>}</div><p className="-mt-1 text-xs text-territory-muted">Equipe da loja integrada</p>{tracking ? <><ConceptCard className="p-3"><div className="flex items-center gap-3"><img src={driverImage} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador vinculado à sua loja</p></div><StatusPill>Em entrega</StatusPill></div><div className="relative mt-3 overflow-hidden rounded-xl"><MiniMap latitude={-12.9751} longitude={-38.487} routeCoordinates={TRACKING_ROUTE} routeStartColor="#064e3b" routeEndColor="#fbbf24" title="Entrega #1043" description="Acompanhamento autorizado" height="clamp(14rem, 72vw, 18rem)" showControls={false} interactive={false} /><span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[0.625rem] font-semibold text-territory-muted shadow-sm"><span>Atualizado há 15 s</span><RefreshCw className="h-3 w-3" /></span><span className="pointer-events-none absolute bottom-3 left-2 rounded-lg bg-white/95 px-2 py-1 text-[0.625rem] leading-tight text-territory-ink shadow-sm"><b className="block">Santa Cruz</b><span className="text-territory-muted">Coleta</span></span><span className="pointer-events-none absolute bottom-3 right-2 rounded-lg bg-white/95 px-2 py-1 text-right text-[0.625rem] leading-tight text-territory-ink shadow-sm"><b className="block">Nordeste de Amaralina</b><span className="text-territory-muted">Destino</span></span></div><div className="mt-3 flex items-center gap-3 rounded-xl border border-territory-border p-3"><UserRound className="h-6 w-6 shrink-0 text-territory-muted" /><div className="min-w-0"><p className="text-sm font-bold">Ana Oliveira</p><p className="text-xs text-territory-muted">Nordeste de Amaralina, Salvador</p></div><ChevronRight className="h-4 w-4 shrink-0 text-territory-muted" /></div><div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" onClick={() => toast.info("Conversa aberta na demonstração.")} className="bg-territory-brand px-2 text-xs text-white hover:bg-territory-brand/90">Falar com entregador</Button><Button type="button" onClick={() => toast.info("Detalhes do pedido serão abertos.")} variant="outline" className="border-territory-border bg-white px-2 text-xs text-territory-ink">Ver pedido</Button></div></ConceptCard><div className="mt-1"><InfoNotice>Acompanhamento restrito a esta entrega.</InfoNotice></div></> : <><ConceptCard className="min-h-[clamp(11rem,50vw,13rem)] p-3"><div className="flex items-center gap-3"><img src={driverImage} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="text-sm font-bold">Carlos Santos</p><p className="text-xs text-territory-muted">Entregador vinculado à sua loja</p></div></div><div className="mt-3 rounded-xl bg-[#fff3c9] p-3"><p className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-5 w-5" />Aguardando aceite</p><p className="mt-1 text-xs text-territory-muted">Solicitação enviada às 12:32</p></div><p className="mt-2 text-xs text-territory-muted">O profissional ainda não confirmou este serviço.</p></ConceptCard><MobileOrderSummary /><div className="grid gap-2"><Button type="button" onClick={() => toast.info("Solicitação aberta na demonstração.")} className="bg-territory-brand text-white hover:bg-territory-brand/90">Ver solicitação</Button><Button type="button" variant="outline" onClick={() => toast.info("Solicitação cancelada na demonstração.")} className="border-territory-border bg-white text-territory-ink">Cancelar solicitação</Button></div><div className="mt-1"><InfoNotice>Cancelar a solicitação não cancela o pedido.</InfoNotice></div></>}</div>;
}

function MobileCourierContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between border-b border-territory-border pb-2">
        <div className="flex gap-5 text-sm">
          <button type="button" className="border-b-2 border-territory-brand pb-2 font-bold">Minhas lojas</button>
          <button type="button" className="pb-2 text-territory-muted">Rede Achegue-se</button>
        </div>
      </div>
      <ConceptCard className="p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-territory-brand text-territory-sun"><Coffee className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate whitespace-nowrap text-sm font-bold">{store.name}</p>
            <p className="truncate text-xs text-territory-muted">1 entrega em andamento</p>
          </div>
          <StatusPill>Vínculo ativo</StatusPill>
        </div>
        <button type="button" onClick={() => navigate("operation", "tracking")} className="mt-2 flex w-full items-center gap-2 rounded-lg bg-[#e8f7ef] p-2.5 text-left">
          <span className="h-6 w-1 shrink-0 rounded-full bg-territory-brand" />
          <span className="min-w-0 flex-1"><b className="block text-sm">#1043 · Em entrega</b><span className="text-xs text-territory-muted">Santa Cruz → Nordeste de Amaralina</span></span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
        <Button type="button" onClick={() => navigate("operation", "tracking")} className="mt-2 h-9 w-full bg-territory-sun px-3 text-xs text-territory-ink hover:bg-territory-sun/85">Continuar entrega</Button>
      </ConceptCard>
      <h2 className="pt-1 text-sm font-bold">Convites</h2>
      <ConceptCard className="p-2.5">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-territory-surface"><Store className="h-5 w-5 text-territory-brand" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-bold">Mercado da Praça</p><span className="shrink-0 rounded-full bg-[#ffe4cd] px-2 py-1 text-[0.68rem] font-bold text-[#984500]">Convite pendente</span></div>
            <p className="mt-1 text-xs leading-snug text-territory-muted">Você foi convidado para fazer entregas por esta loja.</p>
          </div>
        </div>
        <Button type="button" onClick={() => navigate("accept")} variant="outline" className="mt-2 h-8 w-full border-territory-border bg-white text-xs text-territory-ink">Ver convite</Button>
      </ConceptCard>
      <h2 className="pt-1 text-sm font-bold">Rede Achegue-se</h2>
      <ConceptCard className="p-2.5">
        <div className="flex items-start gap-2.5">
          <LocateFixed className="mt-1 h-5 w-5 shrink-0 text-territory-brand" />
          <div className="min-w-0"><p className="text-sm font-bold">Participação ainda não habilitada</p><p className="text-xs leading-snug text-territory-muted">Entregue para mais lojas e amplie suas oportunidades.</p></div>
        </div>
        <Button type="button" onClick={() => toast.info("Os requisitos da rede serão exibidos em seguida.")} variant="outline" className="mt-2 h-8 w-full border-territory-border bg-white text-xs text-territory-ink">Conhecer requisitos</Button>
        <div className="mt-2 flex items-center gap-2 border-t border-territory-border pt-2">
          <Eye className="h-4 w-4 shrink-0 text-territory-brand" />
          <div className="min-w-0 flex-1"><p className="text-xs font-bold">Visibilidade no diretório</p><p className="text-[0.68rem] text-territory-muted">Visível para lojas</p></div>
          <Settings className="h-4 w-4 shrink-0 text-territory-muted" />
        </div>
      </ConceptCard>
      <InfoNotice>Vínculo com loja e participação na rede são independentes.</InfoNotice>
    </div>
  );
}

function CourierContent({ navigate }: { navigate: (view: DeliveryView, state?: OperationState) => void }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4"><PageTitle title="Minhas lojas" subtitle="Vínculos e entregas em seus contextos."><StatusPill>Vínculo ativo</StatusPill></PageTitle><ConceptCard><div className="flex items-center gap-3 border-b border-territory-border pb-4"><img src={foodImage} alt="" className="h-11 w-11 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{store.name}</p><p className="text-xs text-territory-muted">1 entrega em andamento</p></div><StatusPill>Vínculo ativo</StatusPill></div><button type="button" onClick={() => navigate("operation")} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-[#e8f7ef] p-3 text-left"><Bike className="h-5 w-5 text-territory-brand" /><span className="min-w-0 flex-1"><b className="block text-sm">#1043 · Em entrega</b><span className="text-xs text-territory-muted">Santa Cruz → Nordeste de Amaralina</span></span><ChevronRight className="h-4 w-4" /></button><Button type="button" onClick={() => navigate("operation", "tracking")} className="mt-3 w-full bg-territory-sun text-territory-ink hover:bg-territory-sun/85">Continuar entrega</Button></ConceptCard><ConceptCard><h2 className="text-sm font-bold">Convites</h2><div className="mt-3 flex items-center gap-3 rounded-xl border border-territory-border p-3"><Store className="h-5 w-5 text-territory-brand" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">Mercado da Praça</p><p className="text-xs text-territory-muted">Convite pendente</p></div><button type="button" onClick={() => navigate("accept")} className="text-xs font-bold text-blue-700">Ver convite</button></div></ConceptCard><InfoNotice>A entrada na equipe e a participação na rede Achegue-se são contextos independentes.</InfoNotice></div>;
}

function DesktopPage({ view, state, navigate }: { view: DeliveryView; state: OperationState; navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const content = view === "modalities" ? <ModalitiesContent navigate={navigate} /> : view === "manual" ? <ManualContent navigate={navigate} /> : view === "team" ? <TeamContent navigate={navigate} /> : view === "network" ? <NetworkContent navigate={navigate} /> : view === "directory" ? <DirectoryContent navigate={navigate} /> : view === "profile" ? <ProfileContent navigate={navigate} /> : view === "invite" ? <InviteContent navigate={navigate} /> : view === "accept" ? <AcceptContent navigate={navigate} /> : view === "operation" ? <OperationContent state={state} navigate={navigate} /> : <CourierContent navigate={navigate} />;
  return <div className="hidden h-full min-h-0 flex-1 md:flex"><DesktopSidebar view={view} navigate={navigate} /><div className="flex min-w-0 flex-1 flex-col"><StoreTopbar /><main className="min-h-0 flex-1 overflow-hidden bg-territory-canvas p-4 lg:p-5"><div className="mx-auto flex h-full min-h-0 max-w-none flex-col">{content}</div></main></div></div>;
}

function MobilePage({ view, state, navigate }: { view: DeliveryView; state: OperationState; navigate: (view: DeliveryView, state?: OperationState) => void }) {
  const shopOperation = view === "manual" || view === "operation";
  const courier = view === "courier";
  const directoryFlow = ["directory", "profile", "invite", "accept"].includes(view);
  const contextTitle = view === "directory" ? "Encontrar entregadores" : view === "profile" ? "Perfil do entregador" : view === "invite" ? "Convidar Carlos Santos" : "Convite de uma loja";
  const content = view === "modalities" ? <ModalitiesContent navigate={navigate} /> : view === "manual" ? <MobileManualContent navigate={navigate} /> : view === "team" ? <MobileTeamContent navigate={navigate} /> : view === "network" ? <MobileNetworkContent navigate={navigate} /> : view === "directory" ? <MobileDirectoryContent navigate={navigate} /> : view === "profile" ? <MobileProfileContent navigate={navigate} /> : view === "invite" ? <MobileInviteContent navigate={navigate} /> : view === "accept" ? <MobileAcceptContent navigate={navigate} /> : view === "operation" ? <MobileOperationContent state={state} navigate={navigate} /> : <MobileCourierContent navigate={navigate} />;
  return <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-territory-canvas md:hidden">{shopOperation ? <MobileDeliveryHeader /> : courier ? <MobileCourierHeader /> : directoryFlow ? <MobileContextHeader title={contextTitle} showMenu={view === "profile" || view === "accept"} onBack={() => navigate(view === "directory" ? "team" : "directory")} /> : <div className="shrink-0 px-4 pt-3"><StoreTopbar mobile /></div>}<main className={cn("min-h-0 flex-1 overflow-y-auto px-4 scrollbar-hide", courier ? "pb-[4.5rem] pt-3" : "pb-4 pt-3")}><div className="mx-auto flex min-h-full max-w-md flex-col">{shopOperation ? <><MobileStoreIntro /><div className="mt-3 flex min-h-0 flex-1 flex-col">{content}</div></> : content}</div></main>{courier || view === "modalities" || view === "team" || view === "network" || view === "directory" ? <MobileBottomNav view={view} navigate={navigate} /> : null}</div>;
}

function parseView(value: string | null): DeliveryView {
  const views: DeliveryView[] = ["modalities", "manual", "team", "network", "directory", "profile", "invite", "accept", "operation", "courier"];
  return views.includes(value as DeliveryView) ? value as DeliveryView : "modalities";
}

function parseState(value: string | null): OperationState {
  return value === "tracking" ? "tracking" : value === "waiting" ? "waiting" : "manual";
}

export default function DeliveryModesConceptMockPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const state = parseState(searchParams.get("state"));
  const goView = (nextView: DeliveryView, nextState?: OperationState) => navigate(`${DELIVERY_LINK}&view=${nextView}${nextState ? `&state=${nextState}` : ""}`);
  const title = useMemo(() => view === "modalities" ? "Entregas da loja" : view === "manual" ? "Entrega própria" : view === "team" ? "Minha equipe" : view === "network" ? "Rede Achegue-se" : view === "directory" ? "Encontrar entregadores" : view === "profile" ? "Perfil do entregador" : view === "invite" ? "Convidar entregador" : view === "accept" ? "Convite de uma loja" : view === "operation" ? "Operação da entrega" : "Minhas lojas", [view]);
  return <><Helmet><title>{title} · Sabores da Ana</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="h-[100dvh] min-h-0 overflow-hidden text-territory-ink"><DesktopPage view={view} state={state} navigate={goView} /><MobilePage view={view} state={state} navigate={goView} /></div></>;
}
